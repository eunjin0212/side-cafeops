-- ============================================================
-- Migration: Make get_leaderboard's combined (no explicit
-- location filter) view match "My Scores" exactly
--
-- Bug: the combined branch summed score_entries filtered to
-- se.location_id = ANY(caller's own locations), which silently
-- excluded any entry with location_id = NULL (score_entries
-- created before the location feature existed, or for an
-- employee with no location at submission time). This made a
-- staff member's own leaderboard total (no filter UI available
-- to them) diverge from their "My Scores" total, which sums
-- every entry unconditionally.
--
-- Fix: split "was a location explicitly requested" from "which
-- locations is this caller allowed to see."
--   - No explicit location requested (the common case for
--     non-privileged callers, and general_manager/owner's "All"
--     view): combined branch, sums EVERY score_entry for the
--     profile with no location filter at all -- identical
--     arithmetic to useMyScores(). Employees are still scoped to
--     only those the caller is allowed to see.
--   - An explicit single location requested (a general_manager/
--     owner location filter chip, or the home screen's own-rank
--     lookup): per_location branch, unchanged -- points specific
--     to that one location only, intentionally a subset.
-- ============================================================

CREATE OR REPLACE FUNCTION get_leaderboard(p_location_id uuid DEFAULT NULL)
RETURNS TABLE (
  profile_id   uuid,
  full_name    text,
  email        text,
  role         text,
  location_id  uuid,
  location_name text,
  total_points  bigint,
  rank          bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH caller AS (
    SELECT
      p.role::text AS role,
      COALESCE(
        ARRAY_AGG(el.location_id) FILTER (WHERE el.location_id IS NOT NULL),
        '{}'
      ) AS location_ids
    FROM   profiles p
    LEFT   JOIN employee_locations el
           ON  el.profile_id = p.id
           AND el.is_active  = true
    WHERE  p.id = auth.uid()
    GROUP  BY p.role
  ),
  current_cycle AS (
    SELECT id
    FROM   score_cycles
    WHERE  is_active = true
      AND  ended_at  > now()
    ORDER  BY started_at DESC
    LIMIT  1
  ),
  -- explicit_location: set only when the caller actually asked for one
  -- specific (and permitted) location. NULL means "no explicit filter."
  -- member_locations: which locations the caller may see at all.
  -- NULL means unrestricted (general_manager/owner with no filter).
  params AS (
    SELECT
      CASE
        WHEN c.role IN ('general_manager', 'owner') THEN
          CASE WHEN p_location_id IS NOT NULL THEN ARRAY[p_location_id] ELSE NULL END
        ELSE
          CASE
            WHEN p_location_id IS NOT NULL AND p_location_id = ANY(c.location_ids)
              THEN ARRAY[p_location_id]
            ELSE NULL
          END
      END AS explicit_location,
      CASE
        WHEN c.role IN ('general_manager', 'owner') THEN NULL
        ELSE c.location_ids
      END AS member_locations
    FROM caller c
  ),
  -- One row per (employee, location) -- only when a single location
  -- was explicitly requested. Points are specific to that location.
  per_location AS (
    SELECT
      p.id                          AS profile_id,
      p.full_name,
      p.email,
      p.role::text                  AS role,
      el.location_id                AS location_id,
      l.name                        AS location_name,
      COALESCE(SUM(se.points), 0)   AS total_points
    FROM   profiles            p
    JOIN   employee_locations  el
           ON  el.profile_id = p.id
           AND el.is_active  = true
    JOIN   locations           l  ON l.id = el.location_id
    LEFT   JOIN score_entries  se
           ON  se.profile_id  = p.id
           AND se.location_id = el.location_id
           AND se.cycle_id    = (SELECT id FROM current_cycle)
    CROSS JOIN params pr
    WHERE  p.is_active = true
      AND  p.role      != 'owner'
      AND  pr.explicit_location IS NOT NULL
      AND  el.location_id = pr.explicit_location[1]
    GROUP BY p.id, p.full_name, p.email, p.role, el.location_id, l.name
  ),
  -- One row per employee -- used whenever no single location was
  -- explicitly requested. Sums EVERY score_entry for the profile,
  -- with no location filter at all, so this always matches
  -- useMyScores()'s arithmetic exactly.
  combined AS (
    SELECT
      p.id                          AS profile_id,
      p.full_name,
      p.email,
      p.role::text                  AS role,
      NULL::uuid                    AS location_id,
      NULL::text                    AS location_name,
      COALESCE(SUM(se.points), 0)   AS total_points
    FROM   profiles            p
    CROSS JOIN params pr
    LEFT   JOIN score_entries  se
           ON  se.profile_id  = p.id
           AND se.cycle_id    = (SELECT id FROM current_cycle)
    WHERE  p.is_active = true
      AND  p.role      != 'owner'
      AND  pr.explicit_location IS NULL
      AND  EXISTS (
        SELECT 1
        FROM   employee_locations el
        WHERE  el.profile_id = p.id
          AND  el.is_active  = true
          AND  (pr.member_locations IS NULL OR el.location_id = ANY(pr.member_locations))
      )
    GROUP BY p.id, p.full_name, p.email, p.role
  ),
  base AS (
    SELECT * FROM per_location
    UNION ALL
    SELECT * FROM combined
  )
  SELECT
    b.profile_id,
    b.full_name,
    b.email,
    b.role,
    b.location_id,
    b.location_name,
    b.total_points,
    RANK() OVER (PARTITION BY b.location_id ORDER BY b.total_points DESC) AS rank
  FROM  base b
  ORDER BY b.total_points DESC, b.full_name ASC NULLS LAST;
$$;

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- Restore the previous definition from
-- 20260818000001_fix_leaderboard_combined_double_count.sql
-- (combined branch still filters by location membership, causing
-- the My-Scores-vs-leaderboard mismatch this migration fixes).

-- ============================================================
-- Migration: Deduplicate get_leaderboard when scope spans
-- multiple locations
--
-- Bug introduced by 20260817000000: an employee working at
-- multiple locations now appeared once PER location whenever the
-- result set spanned more than one location — e.g. the
-- general_manager/owner "All locations" view, or a multi-location
-- staff member's own leaderboard screen (which has no filter UI
-- and therefore always queries unrestricted).
--
-- Fix: only produce one row per (employee, location) when exactly
-- ONE location is actually in scope (an explicit p_location_id,
-- or a caller who belongs to exactly one location). Whenever scope
-- spans more than one location, collapse to one row per employee
-- with points summed across every location in scope — no
-- duplicates, location_id/location_name are NULL for these rows.
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
  -- target_locations: the set of location(s) actually in scope for this call.
  -- NULL means "every location, unrestricted" (general_manager/owner, no filter).
  params AS (
    SELECT
      CASE
        WHEN c.role IN ('general_manager', 'owner') THEN
          CASE WHEN p_location_id IS NOT NULL THEN ARRAY[p_location_id] ELSE NULL END
        ELSE
          CASE
            WHEN p_location_id IS NOT NULL AND p_location_id = ANY(c.location_ids)
              THEN ARRAY[p_location_id]
            ELSE c.location_ids
          END
      END AS target_locations
    FROM caller c
  ),
  -- One row per (employee, location) — used only when exactly one
  -- location is in scope. Points are specific to that location.
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
      AND  array_length(pr.target_locations, 1) = 1
      AND  el.location_id = ANY(pr.target_locations)
    GROUP BY p.id, p.full_name, p.email, p.role, el.location_id, l.name
  ),
  -- One row per employee — used when scope spans more than one
  -- location (or is fully unrestricted). Points are summed across
  -- every location in scope. No per-location breakdown.
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
    JOIN   employee_locations  el
           ON  el.profile_id = p.id
           AND el.is_active  = true
    CROSS JOIN params pr
    LEFT   JOIN score_entries  se
           ON  se.profile_id  = p.id
           AND se.cycle_id    = (SELECT id FROM current_cycle)
           AND (pr.target_locations IS NULL OR se.location_id = ANY(pr.target_locations))
    WHERE  p.is_active = true
      AND  p.role      != 'owner'
      AND  (pr.target_locations IS NULL OR el.location_id = ANY(pr.target_locations))
      AND  (pr.target_locations IS NULL OR array_length(pr.target_locations, 1) > 1)
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
-- 20260817000000_leaderboard_per_location_scoring.sql
-- (always one row per (employee, active location), no dedup).

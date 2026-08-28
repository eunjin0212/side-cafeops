-- ============================================================
-- Migration: Reuse is_privileged_actor() inside get_leaderboard()
-- instead of re-implementing the same role check inline
--
-- The `profiles` SELECT policy (20260820000001) and get_leaderboard()
-- both need "is this caller general_manager/owner (sees
-- everything) or not (scoped to their own locations)." The
-- profiles policy calls is_privileged_actor(); get_leaderboard()
-- independently re-derived the same check via
-- `c.role IN ('general_manager', 'owner')` in its `caller`/`params`
-- CTEs. Harmless today, but a future change to what counts as
-- "privileged" would need to be made in both places, and they've
-- already drifted once (this one never used the helper). Fixed by
-- having get_leaderboard() call is_privileged_actor() too -- both
-- are SECURITY DEFINER functions, and one SECURITY DEFINER
-- function calling another (as opposed to a table's own RLS
-- policy referencing that same table) is not the recursion
-- pattern fixed elsewhere this session.
--
-- Output is unchanged: this only swaps which expression computes
-- "is privileged," not the surrounding aggregation logic. The
-- `caller` CTE no longer needs to select `role` since nothing
-- else in the function used it.
-- ============================================================

CREATE OR REPLACE FUNCTION get_leaderboard(p_location_id uuid DEFAULT NULL)
RETURNS TABLE(
  profile_id uuid,
  full_name text,
  email text,
  role text,
  location_id uuid,
  location_name text,
  total_points bigint,
  rank bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH caller AS (
    SELECT
      COALESCE(
        ARRAY_AGG(el.location_id) FILTER (WHERE el.location_id IS NOT NULL),
        '{}'
      ) AS location_ids
    FROM   profiles p
    LEFT   JOIN employee_locations el
           ON  el.profile_id = p.id
           AND el.is_active  = true
    WHERE  p.id = auth.uid()
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
        WHEN is_privileged_actor() THEN
          CASE WHEN p_location_id IS NOT NULL THEN ARRAY[p_location_id] ELSE NULL END
        ELSE
          CASE
            WHEN p_location_id IS NOT NULL AND p_location_id = ANY(c.location_ids)
              THEN ARRAY[p_location_id]
            ELSE NULL
          END
      END AS explicit_location,
      CASE
        WHEN is_privileged_actor() THEN NULL
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
-- Re-apply the 20260819000000 definition (inline
-- `c.role IN ('general_manager', 'owner')` checks, `caller`
-- selects `role` again).

-- ============================================================
-- Migration: Fix double-counted points in get_leaderboard's
-- "combined" (multi-location) branch
--
-- Bug: the combined CTE joined profiles -> employee_locations
-- (one row per active location) and THEN left-joined score_entries
-- on profile_id alone (not scoped to that specific location row).
-- For an employee with N active locations, every one of their
-- score_entries got joined N times and summed N times, inflating
-- their combined total by a factor of N.
--
-- Fix: check location membership via EXISTS instead of a JOIN, so
-- score_entries is joined directly against profiles (one-to-many,
-- no fan-out) and each entry is summed exactly once.
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
  -- every location in scope, joined directly against profiles
  -- (not through employee_locations) so each entry counts once
  -- regardless of how many locations the employee belongs to.
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
           AND (pr.target_locations IS NULL OR se.location_id = ANY(pr.target_locations))
    WHERE  p.is_active = true
      AND  p.role      != 'owner'
      AND  (pr.target_locations IS NULL OR array_length(pr.target_locations, 1) > 1)
      AND  EXISTS (
        SELECT 1
        FROM   employee_locations el
        WHERE  el.profile_id = p.id
          AND  el.is_active  = true
          AND  (pr.target_locations IS NULL OR el.location_id = ANY(pr.target_locations))
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
-- 20260818000000_leaderboard_dedupe_multi_location.sql
-- (has the double-counting bug in the combined branch).

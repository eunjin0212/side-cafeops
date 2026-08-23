-- ============================================================
-- Migration: Rank employees per-location on the leaderboard
--
-- Bug: get_leaderboard previously joined employee_locations
-- filtered to is_primary = true, so an employee working at
-- multiple locations only ever appeared under their ONE primary
-- location — never under any other location they're assigned to,
-- even when explicitly filtered to it.
--
-- Fix: produce one row per (employee, active location) instead of
-- one row per employee. Points are now location-specific, summed
-- from score_entries.location_id rather than the employee's
-- overall cycle total. Rank is computed per location (PARTITION
-- BY location_id) so multiple locations in one result set (the
-- unfiltered "All locations" view for general_manager/owner)
-- don't get mixed into a single cross-location rank.
--
-- Side effect: an employee with zero active location assignments
-- no longer appears on the leaderboard at all (previously showed
-- with location_id/location_name = NULL in the unfiltered view).
-- Also: score_entries created before location_id existed (or for
-- employees with no location at submission time) have
-- location_id = NULL and are not counted toward any location's total.
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
  -- One row per (employee, active location) — points are specific to that location.
  base AS (
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
    WHERE  p.is_active = true
      AND  p.role      != 'owner'
    GROUP  BY p.id, p.full_name, p.email, p.role, el.location_id, l.name
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
  FROM  base b, caller c
  WHERE
    CASE
      WHEN c.role IN ('general_manager', 'owner')
        THEN (p_location_id IS NULL OR b.location_id = p_location_id)
      ELSE b.location_id = ANY (c.location_ids)
    END
  ORDER BY b.location_name ASC, b.total_points DESC, b.full_name ASC NULLS LAST;
$$;

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- Restore the previous definition from
-- 20260815000000_exclude_owner_from_leaderboard.sql
-- (single primary-location row per employee, cycle-wide totals).

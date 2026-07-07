-- Leaderboard: sum score_entries per employee in the current active cycle.
-- p_location_id NULL  → global ranking across all locations.
-- p_location_id set   → ranking within that location only.
-- Employees with no entries appear with 0 points (COALESCE).
-- Uses the same cycle resolution as get_or_create_current_cycle:
--   is_active = true AND ended_at > now().

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
  WITH current_cycle AS (
    SELECT id
    FROM   score_cycles
    WHERE  is_active = true
      AND  ended_at  > now()
    ORDER  BY started_at DESC
    LIMIT  1
  ),
  employee_scores AS (
    SELECT  se.profile_id,
            SUM(se.points) AS total_points
    FROM    score_entries se
    JOIN    current_cycle cc ON se.cycle_id = cc.id
    GROUP   BY se.profile_id
  ),
  base AS (
    SELECT
      p.id                              AS profile_id,
      p.full_name,
      p.email,
      p.role::text                      AS role,
      el.location_id,
      l.name                            AS location_name,
      COALESCE(es.total_points, 0)      AS total_points
    FROM   profiles            p
    LEFT   JOIN employee_locations el
           ON  el.profile_id = p.id
           AND el.is_primary  = true
           AND el.is_active   = true
    LEFT   JOIN locations      l  ON l.id  = el.location_id
    LEFT   JOIN employee_scores es ON es.profile_id = p.id
    WHERE  p.is_active = true
  )
  SELECT
    b.profile_id,
    b.full_name,
    b.email,
    b.role,
    b.location_id,
    b.location_name,
    b.total_points,
    RANK() OVER (ORDER BY b.total_points DESC) AS rank
  FROM  base b
  WHERE (p_location_id IS NULL OR b.location_id = p_location_id)
  ORDER BY total_points DESC, full_name ASC NULLS LAST;
$$;

-- Rollback: DROP FUNCTION IF EXISTS get_leaderboard(uuid);

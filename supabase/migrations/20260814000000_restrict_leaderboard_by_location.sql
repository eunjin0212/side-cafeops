-- ============================================================
-- Migration: Restrict get_leaderboard results by caller's location
-- Staff/supervisor/location_manager only see employees who share
-- a location with them. general_manager/owner see every location
-- (and may still filter via p_location_id).
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
  FROM  base b, caller c
  WHERE
    CASE
      WHEN c.role IN ('general_manager', 'owner')
        THEN (p_location_id IS NULL OR b.location_id = p_location_id)
      ELSE b.location_id = ANY (c.location_ids)
    END
  ORDER BY total_points DESC, full_name ASC NULLS LAST;
$$;

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- Restore the previous definition from 20260707000005_add_leaderboard_function.sql
-- (unrestricted p_location_id-only filtering, no caller-location check).

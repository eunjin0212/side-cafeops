-- ============================================================
-- Migration: Restrict profiles SELECT to self, same-location
-- coworkers, or general_manager/owner (who see everyone)
--
-- Previously "authenticated users can select profiles" was
-- USING (true) -- fully open. This replaces it so trainee/staff/
-- supervisor/location_manager only see profiles that share at
-- least one active location with them (or their own profile).
-- general_manager/owner are unrestricted, matching the leaderboard
-- location-restriction rule already in place.
--
-- Affects every feature that reads profiles: the Employees list,
-- Employee detail, Score Entry's employee search, and the current
-- user's own profile lookup (always allowed via id = auth.uid()).
-- ============================================================

DROP POLICY IF EXISTS "authenticated users can select profiles" ON profiles;

CREATE POLICY "profiles visible to self, same-location coworkers, or GM/owner"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('general_manager', 'owner')
    )
    OR EXISTS (
      SELECT 1
      FROM   employee_locations mine
      JOIN   employee_locations theirs
             ON  theirs.location_id = mine.location_id
             AND theirs.is_active   = true
      WHERE  mine.profile_id  = auth.uid()
        AND  mine.is_active   = true
        AND  theirs.profile_id = profiles.id
    )
  );

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP POLICY IF EXISTS "profiles visible to self, same-location coworkers, or GM/owner" ON profiles;
-- CREATE POLICY "authenticated users can select profiles"
--   ON profiles FOR SELECT TO authenticated USING (true);

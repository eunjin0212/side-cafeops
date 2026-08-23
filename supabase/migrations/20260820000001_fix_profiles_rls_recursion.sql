-- ============================================================
-- Migration: Fix infinite recursion in the profiles SELECT policy
--
-- Bug: 20260820000000's policy checked the actor's role via
-- `EXISTS (SELECT 1 FROM profiles AS actor WHERE actor.id = auth.uid() ...)`.
-- Once the profiles SELECT policy stopped being a trivial
-- USING (true), evaluating that inner subquery required
-- re-evaluating the SAME policy on profiles again -> infinite
-- recursion (Postgres error 42P17), breaking every real
-- authenticated read of profiles, including a user's own profile.
--
-- Fix: check the actor's role through a SECURITY DEFINER helper
-- function, which bypasses RLS for its own internal query and
-- therefore doesn't recurse.
-- ============================================================

CREATE OR REPLACE FUNCTION is_privileged_actor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('general_manager', 'owner')
  );
$$;

DROP POLICY IF EXISTS "profiles visible to self, same-location coworkers, or GM/owner" ON profiles;

CREATE POLICY "profiles visible to self, same-location coworkers, or GM/owner"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR is_privileged_actor()
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
-- DROP FUNCTION IF EXISTS is_privileged_actor();
-- CREATE POLICY "authenticated users can select profiles"
--   ON profiles FOR SELECT TO authenticated USING (true);

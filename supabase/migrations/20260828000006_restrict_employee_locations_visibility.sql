-- ============================================================
-- Migration: Restrict employee_locations SELECT to self, same-
-- location coworkers, or GM/owner
--
-- "authenticated users can select employee_locations" was USING
-- (true) -- any authenticated user could read the full org's
-- location-assignment table, leaking who-works-where across
-- every location even for employees they can't otherwise see
-- (profiles is already restricted since 20260820000001).
--
-- Fix: same visibility rule as profiles/score_entries, extracted
-- into a SECURITY DEFINER STABLE helper. A plain inline subquery
-- (`FROM employee_locations mine JOIN employee_locations theirs
-- ...`) can't be used directly in this policy's USING clause,
-- unlike the profiles/score_entries policies -- because THIS
-- policy is defined ON employee_locations itself, referencing
-- employee_locations again from within its own policy hits the
-- same syntactic 42P17 recursion class fixed for profiles in
-- 20260828000001. The helper function's internal query runs
-- SECURITY DEFINER (bypasses RLS), breaking the cycle exactly
-- like is_privileged_actor() already does for profiles.
-- ============================================================

CREATE OR REPLACE FUNCTION shares_active_location_with(target_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM employee_locations AS mine
    JOIN employee_locations AS theirs
      ON theirs.location_id = mine.location_id AND theirs.is_active = true
    WHERE mine.profile_id = auth.uid()
      AND mine.is_active = true
      AND theirs.profile_id = target_id
  );
$$;

DROP POLICY IF EXISTS "authenticated users can select employee_locations" ON employee_locations;

CREATE POLICY "employee_locations visible to self, same-location coworkers, or GM/owner"
  ON employee_locations FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR is_privileged_actor()
    OR shares_active_location_with(profile_id)
  );

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP POLICY IF EXISTS "employee_locations visible to self, same-location coworkers, or GM/owner" ON employee_locations;
-- CREATE POLICY "authenticated users can select employee_locations"
--   ON employee_locations FOR SELECT TO authenticated USING (true);
-- DROP FUNCTION IF EXISTS shares_active_location_with(uuid);

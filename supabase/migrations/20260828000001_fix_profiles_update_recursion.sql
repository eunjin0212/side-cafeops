-- ============================================================
-- Migration: Fix infinite recursion (42P17) introduced by the
-- previous migration's profiles UPDATE policy
--
-- 20260828000000 replaced the profiles UPDATE policies with one
-- that references `profiles` again via subquery from WITHIN a
-- policy defined ON profiles itself. Postgres's RLS recursion
-- guard is syntactic, not semantic: any reference back to the
-- same relation while that relation's own policies are still
-- being resolved trips 42P17, even though the nested subqueries
-- here would have terminated fine on their own. This is the same
-- root cause 20260820000001 fixed for the profiles SELECT policy
-- (via the is_privileged_actor() SECURITY DEFINER function) --
-- the earlier migration's comment claiming this pattern was safe
-- was wrong specifically for self-referencing UPDATE policies.
--
-- This is currently a live outage: ALL profile updates (including
-- ordinary self-edits of full_name/phone) fail with 42P17 until
-- this is applied.
--
-- Fix: read role/is_active/email through a new SECURITY DEFINER
-- STABLE function (get_profile_snapshot), the same technique
-- already proven safe by is_privileged_actor() -- a SECURITY
-- DEFINER function's internal query runs as the function owner
-- and bypasses RLS entirely, so it never re-enters profiles'
-- policy resolution.
-- ============================================================

CREATE OR REPLACE FUNCTION get_profile_snapshot(target_id uuid)
RETURNS TABLE(role employee_role, is_active boolean, email text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role, is_active, email FROM profiles WHERE id = target_id;
$$;

DROP POLICY IF EXISTS "profile updates respect role hierarchy" ON profiles;

CREATE POLICY "profile updates respect role hierarchy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR (SELECT s.role FROM get_profile_snapshot(auth.uid()) AS s)
       IN ('location_manager', 'general_manager', 'owner')
  )
  WITH CHECK (
    (
      auth.uid() = profiles.id
      AND ROW(profiles.role, profiles.is_active, profiles.email) = (
        SELECT s.role, s.is_active, s.email FROM get_profile_snapshot(profiles.id) AS s
      )
    )
    OR (
      auth.uid() != profiles.id
      AND (SELECT s.role FROM get_profile_snapshot(auth.uid()) AS s)
          IN ('location_manager', 'general_manager', 'owner')
      AND (SELECT s.role FROM get_profile_snapshot(auth.uid()) AS s)
          > (SELECT s.role FROM get_profile_snapshot(profiles.id) AS s)
      AND (SELECT s.role FROM get_profile_snapshot(auth.uid()) AS s)
          > profiles.role
    )
  );

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP POLICY IF EXISTS "profile updates respect role hierarchy" ON profiles;
-- DROP FUNCTION IF EXISTS get_profile_snapshot(uuid);
--
-- CREATE POLICY "users can update own profile"
--   ON profiles FOR UPDATE TO authenticated
--   USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
--
-- CREATE POLICY "managers can update profiles"
--   ON profiles FOR UPDATE TO authenticated
--   USING (EXISTS (SELECT 1 FROM profiles AS actor
--                  WHERE actor.id = auth.uid()
--                    AND actor.role IN ('location_manager','general_manager','owner')))
--   WITH CHECK (EXISTS (SELECT 1 FROM profiles AS actor
--                  WHERE actor.id = auth.uid()
--                    AND actor.role IN ('location_manager','general_manager','owner')));

-- ============================================================
-- Migration: Add target-rank check + block self-assignment on
-- employee_locations INSERT/UPDATE/DELETE
--
-- The three write policies on employee_locations only checked
-- the ACTOR's own role (location_manager+) -- none referenced
-- employee_locations.profile_id at all. Concretely, a
-- location_manager could:
--   - INSERT/UPDATE a row with profile_id = auth.uid(), self-
--     assigning to any location or setting is_primary for
--     themselves (violates "users must never edit their own
--     location assignment").
--   - INSERT/UPDATE/DELETE the location membership of a
--     general_manager or owner, with no rank check at all.
--
-- Fix: require profile_id != auth.uid() (self-assignment always
-- blocked, regardless of rank -- mirrors the explicit self-ID
-- guard already used in employees/[id]/edit.tsx), and require
-- actor_role >= target_role. `>=` (not strict `>`) intentionally
-- matches src/constants/permissions.ts's canEditEmployeeLocation,
-- which was deliberately changed this session to allow same-rank
-- peers (e.g. two location_managers) to edit each other's
-- location assignment -- self-edit is what's forbidden, not
-- same-rank edits of someone else. This keeps the DB policy and
-- the frontend permission helper expressing the same rule, per
-- CLAUDE.md's "Client-side permission checks and RLS rules must
-- represent the same business rules."
--
-- The added subqueries reference `profiles`, a different table
-- from the one the policy is defined on, so this does not hit
-- the self-referencing-policy recursion class fixed by
-- 20260828000001 -- same safe shape as the existing score_entries
-- target-rank check.
-- ============================================================

DROP POLICY IF EXISTS "managers can insert employee_locations" ON employee_locations;
DROP POLICY IF EXISTS "managers can update employee_locations" ON employee_locations;
DROP POLICY IF EXISTS "managers can delete employee_locations" ON employee_locations;

CREATE POLICY "managers can insert employee_locations"
  ON employee_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('location_manager', 'general_manager', 'owner')
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        >= (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
  );

CREATE POLICY "managers can update employee_locations"
  ON employee_locations FOR UPDATE
  TO authenticated
  USING (
    profile_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('location_manager', 'general_manager', 'owner')
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        >= (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
  )
  WITH CHECK (
    profile_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('location_manager', 'general_manager', 'owner')
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        >= (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
  );

CREATE POLICY "managers can delete employee_locations"
  ON employee_locations FOR DELETE
  TO authenticated
  USING (
    profile_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('location_manager', 'general_manager', 'owner')
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        >= (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
  );

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP POLICY IF EXISTS "managers can insert employee_locations" ON employee_locations;
-- DROP POLICY IF EXISTS "managers can update employee_locations" ON employee_locations;
-- DROP POLICY IF EXISTS "managers can delete employee_locations" ON employee_locations;
--
-- CREATE POLICY "managers can insert employee_locations"
--   ON employee_locations FOR INSERT TO authenticated
--   WITH CHECK (EXISTS (SELECT 1 FROM profiles AS actor
--               WHERE actor.id = auth.uid()
--                 AND actor.role IN ('location_manager','general_manager','owner')));
--
-- CREATE POLICY "managers can update employee_locations"
--   ON employee_locations FOR UPDATE TO authenticated
--   USING (EXISTS (SELECT 1 FROM profiles AS actor
--               WHERE actor.id = auth.uid()
--                 AND actor.role IN ('location_manager','general_manager','owner')))
--   WITH CHECK (EXISTS (SELECT 1 FROM profiles AS actor
--               WHERE actor.id = auth.uid()
--                 AND actor.role IN ('location_manager','general_manager','owner')));
--
-- CREATE POLICY "managers can delete employee_locations"
--   ON employee_locations FOR DELETE TO authenticated
--   USING (EXISTS (SELECT 1 FROM profiles AS actor
--               WHERE actor.id = auth.uid()
--                 AND actor.role IN ('location_manager','general_manager','owner')));

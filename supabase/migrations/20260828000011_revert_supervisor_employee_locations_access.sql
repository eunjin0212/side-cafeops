-- ============================================================
-- Migration: Revert employee_locations write access to
-- location_manager+ only (supervisor excluded)
--
-- Business rule correction: supervisors can edit a trainee/staff
-- employee's ROLE, but NOT their location assignment -- location
-- edits require location_manager or above. 20260828000007 had
-- widened employee_locations INSERT/UPDATE/DELETE to include
-- 'supervisor' and added an asymmetric same-rank carve-out, both
-- driven by a (mistaken) assumption that canEditEmployeeLocation
-- should mirror canEditEmployeeRole's floor. src/constants/
-- permissions.ts's canEditEmployeeLocation has been reverted to
-- its original floor (>= location_manager, >= target rank, no
-- special-casing needed since the floor already guarantees
-- location_manager+ for any edit including same-rank). This
-- migration reverts the RLS side to match.
--
-- profiles.role edits (20260828000008's policy, supervisor floor)
-- are unaffected -- only location assignment changes here.
-- ============================================================

DROP POLICY IF EXISTS "managers can insert employee_locations" ON employee_locations;
DROP POLICY IF EXISTS "managers can update employee_locations" ON employee_locations;
DROP POLICY IF EXISTS "managers can delete employee_locations" ON employee_locations;

CREATE POLICY "managers can insert employee_locations"
  ON employee_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id != auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        IN ('location_manager', 'general_manager', 'owner')
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        >= (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
  );

CREATE POLICY "managers can update employee_locations"
  ON employee_locations FOR UPDATE
  TO authenticated
  USING (
    profile_id != auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        IN ('location_manager', 'general_manager', 'owner')
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        >= (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
  )
  WITH CHECK (
    profile_id != auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        IN ('location_manager', 'general_manager', 'owner')
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        >= (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
  );

CREATE POLICY "managers can delete employee_locations"
  ON employee_locations FOR DELETE
  TO authenticated
  USING (
    profile_id != auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        IN ('location_manager', 'general_manager', 'owner')
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        >= (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
  );

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- Re-apply 20260828000007's employee_locations policies
-- (supervisor floor + asymmetric same-rank carve-out).

-- ============================================================
-- Migration: Add INSERT and DELETE policies for employee_locations
-- Required for multi-location assignment by managers
-- ============================================================

CREATE POLICY "managers can insert employee_locations"
  ON employee_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('location_manager', 'general_manager', 'owner')
    )
  );

CREATE POLICY "managers can delete employee_locations"
  ON employee_locations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('location_manager', 'general_manager', 'owner')
    )
  );

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP POLICY IF EXISTS "managers can insert employee_locations" ON employee_locations;
-- DROP POLICY IF EXISTS "managers can delete employee_locations" ON employee_locations;

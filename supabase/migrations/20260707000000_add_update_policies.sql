-- ============================================================
-- Migration: Add UPDATE RLS policies
-- Tables: profiles, employee_locations
-- ============================================================

-- profiles: users can update their own row (full_name, phone, avatar_url)
CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- profiles: location_manager+ can update any profile (role, is_active)
CREATE POLICY "managers can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('location_manager', 'general_manager', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('location_manager', 'general_manager', 'owner')
    )
  );

-- employee_locations: location_manager+ can update location assignments
CREATE POLICY "managers can update employee_locations"
  ON employee_locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('location_manager', 'general_manager', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('location_manager', 'general_manager', 'owner')
    )
  );

-- ------------------------------------------------------------
-- Rollback (run manually if needed)
-- ------------------------------------------------------------
-- DROP POLICY IF EXISTS "users can update own profile" ON profiles;
-- DROP POLICY IF EXISTS "managers can update profiles" ON profiles;
-- DROP POLICY IF EXISTS "managers can update employee_locations" ON employee_locations;

-- ============================================================
-- Migration: Allow supervisor to edit trainee/staff role and
-- location, matching corrected src/constants/permissions.ts
--
-- src/constants/__tests__/permissions.test.ts always asserted
-- that a supervisor can edit a trainee/staff's role and location
-- (only same-or-higher-rank targets should be blocked), but
-- canEditEmployeeRole/canEditEmployeeLocation's actual code
-- required actor rank >= location_manager, contradicting the
-- test suite -- a pre-existing bug flagged repeatedly this
-- session. Fixed in permissions.ts (this commit) by lowering the
-- floor to `supervisor` for both, and giving
-- canEditEmployeeLocation the asymmetric rule the tests actually
-- specify: strictly-higher-rank targets need only actor >=
-- supervisor, but SAME-rank targets (peer editing peer) still
-- require actor >= location_manager.
--
-- The two RLS policies gating these same actions
-- (20260828000000/1 for profiles.role, 20260828000003 for
-- employee_locations) still hard-coded the actor role list as
-- ('location_manager','general_manager','owner') -- excluding
-- supervisor entirely. Left as-is, this would silently block the
-- exact action the frontend now allows, reintroducing a
-- frontend/RLS disagreement in the other direction. Fix: widen
-- the actor role list to include 'supervisor' on both, and give
-- employee_locations the same asymmetric same-rank rule now in
-- canEditEmployeeLocation (>= for strictly-lower targets requires
-- only supervisor; same-rank requires location_manager+).
--
-- profiles.role edits keep the strict `>` comparison (matches
-- canEditEmployeeRole, which never allows same-rank edits) --
-- only the actor floor changes there.
-- ============================================================

DROP POLICY IF EXISTS "profile updates respect role hierarchy" ON profiles;

CREATE POLICY "profile updates respect role hierarchy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('supervisor', 'location_manager', 'general_manager', 'owner')
    )
  )
  WITH CHECK (
    (
      auth.uid() = profiles.id
      AND profiles.role = (SELECT old.role FROM profiles AS old WHERE old.id = profiles.id)
      AND profiles.is_active = (SELECT old.is_active FROM profiles AS old WHERE old.id = profiles.id)
      AND profiles.email = (SELECT old.email FROM profiles AS old WHERE old.id = profiles.id)
    )
    OR (
      auth.uid() != profiles.id
      AND (SELECT s.role FROM get_profile_snapshot(auth.uid()) AS s)
          IN ('supervisor', 'location_manager', 'general_manager', 'owner')
      AND (SELECT s.role FROM get_profile_snapshot(auth.uid()) AS s)
          > (SELECT s.role FROM get_profile_snapshot(profiles.id) AS s)
      AND (SELECT s.role FROM get_profile_snapshot(auth.uid()) AS s)
          > profiles.role
    )
  );

DROP POLICY IF EXISTS "managers can insert employee_locations" ON employee_locations;
DROP POLICY IF EXISTS "managers can update employee_locations" ON employee_locations;
DROP POLICY IF EXISTS "managers can delete employee_locations" ON employee_locations;

CREATE POLICY "managers can insert employee_locations"
  ON employee_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id != auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        IN ('supervisor', 'location_manager', 'general_manager', 'owner')
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid())
          > (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
      OR (
        (SELECT role FROM profiles WHERE id = auth.uid())
            = (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
        AND (SELECT role FROM profiles WHERE id = auth.uid())
            IN ('location_manager', 'general_manager', 'owner')
      )
    )
  );

CREATE POLICY "managers can update employee_locations"
  ON employee_locations FOR UPDATE
  TO authenticated
  USING (
    profile_id != auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        IN ('supervisor', 'location_manager', 'general_manager', 'owner')
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid())
          > (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
      OR (
        (SELECT role FROM profiles WHERE id = auth.uid())
            = (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
        AND (SELECT role FROM profiles WHERE id = auth.uid())
            IN ('location_manager', 'general_manager', 'owner')
      )
    )
  )
  WITH CHECK (
    profile_id != auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        IN ('supervisor', 'location_manager', 'general_manager', 'owner')
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid())
          > (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
      OR (
        (SELECT role FROM profiles WHERE id = auth.uid())
            = (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
        AND (SELECT role FROM profiles WHERE id = auth.uid())
            IN ('location_manager', 'general_manager', 'owner')
      )
    )
  );

CREATE POLICY "managers can delete employee_locations"
  ON employee_locations FOR DELETE
  TO authenticated
  USING (
    profile_id != auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        IN ('supervisor', 'location_manager', 'general_manager', 'owner')
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid())
          > (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
      OR (
        (SELECT role FROM profiles WHERE id = auth.uid())
            = (SELECT role FROM profiles WHERE id = employee_locations.profile_id)
        AND (SELECT role FROM profiles WHERE id = auth.uid())
            IN ('location_manager', 'general_manager', 'owner')
      )
    )
  );

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- Re-apply the previous (location_manager-floor, no same-rank
-- carve-out) versions from 20260828000001 and 20260828000003.

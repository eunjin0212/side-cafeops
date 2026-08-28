-- ============================================================
-- Migration: Fix 42P17 recursion reintroduced by 20260828000007
--
-- 20260828000007's profiles UPDATE policy USING clause reverted
-- to a raw `EXISTS (SELECT 1 FROM profiles AS actor ...)`
-- subquery instead of the get_profile_snapshot() SECURITY
-- DEFINER helper introduced in 20260828000001 specifically to
-- avoid this -- same self-referencing-policy recursion class,
-- copy-paste mistake. This is a live outage for every profiles
-- UPDATE (self-edit and manager-edit both) until fixed.
-- ============================================================

DROP POLICY IF EXISTS "profile updates respect role hierarchy" ON profiles;

CREATE POLICY "profile updates respect role hierarchy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR (SELECT s.role FROM get_profile_snapshot(auth.uid()) AS s)
       IN ('supervisor', 'location_manager', 'general_manager', 'owner')
  )
  WITH CHECK (
    (
      auth.uid() = profiles.id
      AND profiles.role = (SELECT s.role FROM get_profile_snapshot(profiles.id) AS s)
      AND profiles.is_active = (SELECT s.is_active FROM get_profile_snapshot(profiles.id) AS s)
      AND profiles.email = (SELECT s.email FROM get_profile_snapshot(profiles.id) AS s)
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

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- Re-apply 20260828000001's version (location_manager floor,
-- no supervisor).

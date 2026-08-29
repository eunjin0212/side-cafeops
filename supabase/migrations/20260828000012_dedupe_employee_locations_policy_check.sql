-- ============================================================
-- Migration: Extract the repeated employee_locations write-check
-- into a single helper function
--
-- INSERT/UPDATE/DELETE policies on employee_locations
-- (20260828000011) each repeated the identical condition block
-- verbatim: not self, actor is location_manager+, actor rank >=
-- target rank. Same block, three times in the same file --
-- exactly the kind of duplication worth extracting.
--
-- Not SECURITY DEFINER: this intentionally relies on the profiles
-- SELECT policy for both the actor and target role lookups,
-- matching the established pattern already used by the
-- score_entries target-rank check (20260821000000) -- if the
-- actor can't see the target (different, non-shared location),
-- the subquery returns no row and the check fails closed. This
-- function queries `profiles`, a different table from the one
-- each policy is defined on, so it does not hit the self-
-- referencing-policy recursion class fixed elsewhere this
-- session.
-- ============================================================

CREATE OR REPLACE FUNCTION can_manage_employee_location(target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    target_profile_id != auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        IN ('location_manager', 'general_manager', 'owner')
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        >= (SELECT role FROM profiles WHERE id = target_profile_id);
$$;

DROP POLICY IF EXISTS "managers can insert employee_locations" ON employee_locations;
DROP POLICY IF EXISTS "managers can update employee_locations" ON employee_locations;
DROP POLICY IF EXISTS "managers can delete employee_locations" ON employee_locations;

CREATE POLICY "managers can insert employee_locations"
  ON employee_locations FOR INSERT
  TO authenticated
  WITH CHECK (can_manage_employee_location(profile_id));

CREATE POLICY "managers can update employee_locations"
  ON employee_locations FOR UPDATE
  TO authenticated
  USING (can_manage_employee_location(profile_id))
  WITH CHECK (can_manage_employee_location(profile_id));

CREATE POLICY "managers can delete employee_locations"
  ON employee_locations FOR DELETE
  TO authenticated
  USING (can_manage_employee_location(profile_id));

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- Re-apply 20260828000011's three inline policies, then:
-- DROP FUNCTION IF EXISTS can_manage_employee_location(uuid);

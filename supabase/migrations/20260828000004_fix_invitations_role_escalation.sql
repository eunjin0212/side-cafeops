-- ============================================================
-- Migration: Block role-escalation via invitations INSERT/UPDATE
--
-- Two live gaps:
--
-- 1. "managers can insert invitations" only checked the ACTOR's
--    own role (location_manager+) -- it never constrained the
--    `role` column being written to the invitation itself. A
--    location_manager (the lowest role allowed to invite) could
--    insert invitations(role = 'owner', email = 'anyone@...').
--
-- 2. "managers can update invitations" had no explicit WITH
--    CHECK, so Postgres defaulted it to the USING clause -- which
--    only re-checks actor identity/role, not the row's contents.
--    The original inviter (any location_manager) could later
--    UPDATE their own pending invitation to bump its role to
--    'owner' after creation, bypassing whatever check existed
--    at insert time.
--
-- Fix: require the invitation's `role` to be strictly lower than
-- the acting user's own current role, on both INSERT and UPDATE
-- (mirrors canEditEmployeeRole's strict `>` semantics -- you
-- cannot grant a role at or above your own rank). The subquery
-- references `profiles`, a different table from the one this
-- policy is defined on, so this is the same safe cross-table
-- shape already used by the score_entries and employee_locations
-- target-rank checks -- not the self-referencing-policy
-- recursion class fixed by 20260828000001.
-- ============================================================

DROP POLICY IF EXISTS "managers can insert invitations" ON invitations;
DROP POLICY IF EXISTS "managers can update invitations" ON invitations;

CREATE POLICY "managers can insert invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('location_manager', 'general_manager', 'owner')
    )
    AND role < (SELECT role FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "managers can update invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (
    invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('general_manager', 'owner')
    )
  )
  WITH CHECK (
    (
      invited_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('general_manager', 'owner')
      )
    )
    AND role < (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP POLICY IF EXISTS "managers can insert invitations" ON invitations;
-- DROP POLICY IF EXISTS "managers can update invitations" ON invitations;
--
-- CREATE POLICY "managers can insert invitations"
--   ON invitations FOR INSERT TO authenticated
--   WITH CHECK (
--     invited_by = auth.uid()
--     AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
--                 AND role IN ('location_manager','general_manager','owner'))
--   );
--
-- CREATE POLICY "managers can update invitations"
--   ON invitations FOR UPDATE TO authenticated
--   USING (
--     invited_by = auth.uid()
--     OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('general_manager','owner'))
--   );

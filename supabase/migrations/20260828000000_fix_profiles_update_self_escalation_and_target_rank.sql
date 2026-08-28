-- ============================================================
-- Migration: Close profiles UPDATE self-escalation + missing
-- target-rank check
--
-- Two live bugs, confirmed against the deployed policies:
--
-- 1. "users can update own profile" only checked that the row's
--    id still equalled auth.uid() -- it placed no restriction on
--    WHICH columns changed. Any authenticated user could run
--    profiles.update({ role: 'owner' }) against their own row
--    and pass RLS, self-promoting to any role. It also let a
--    user silently change their own email/is_active (the
--    frontend's read-only email field is UX only).
--
-- 2. "managers can update profiles" only checked the ACTOR's own
--    role (location_manager/general_manager/owner) -- it never
--    compared against the target row's role. A location_manager
--    could edit a general_manager's or owner's role, or edit a
--    peer at the same rank, with no rank check at all.
--
-- Fix: replace both policies with a single UPDATE policy that
-- covers two mutually exclusive branches:
--   (a) self-edit: role/is_active/email must stay byte-identical
--       to the currently stored value (full_name/phone/avatar_url
--       remain freely editable, per "all roles may edit their own
--       personal information").
--   (b) other-edit: actor must be location_manager+ AND actor's
--       role must be strictly higher than BOTH the target's
--       current role and the new role being assigned (blocks
--       same-rank/upward edits and blocks granting a role at or
--       above the actor's own rank).
--
-- The self-referencing subqueries (`SELECT ... FROM profiles AS x
-- WHERE x.id = ...`) are safe from the earlier 42P17 recursion
-- bug: recursion only occurs when a policy's own USING/WITH CHECK
-- expression is evaluated as part of resolving that same clause
-- for the same row (a policy calling itself). Here the subqueries
-- go through the profiles SELECT policy once (already non-
-- recursive since 20260820000001), not through this UPDATE
-- policy, so there is no cycle. This mirrors the existing
-- `score_entries` INSERT policy, which already does the same
-- self-referencing-subquery pattern successfully.
-- ============================================================

DROP POLICY IF EXISTS "users can update own profile" ON profiles;
DROP POLICY IF EXISTS "managers can update profiles" ON profiles;

CREATE POLICY "profile updates respect role hierarchy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('location_manager', 'general_manager', 'owner')
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
      AND EXISTS (
        SELECT 1 FROM profiles AS actor
        WHERE actor.id = auth.uid()
          AND actor.role IN ('location_manager', 'general_manager', 'owner')
      )
      AND (SELECT actor.role FROM profiles AS actor WHERE actor.id = auth.uid())
          > (SELECT old.role FROM profiles AS old WHERE old.id = profiles.id)
      AND (SELECT actor.role FROM profiles AS actor WHERE actor.id = auth.uid())
          > profiles.role
    )
  );

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP POLICY IF EXISTS "profile updates respect role hierarchy" ON profiles;
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

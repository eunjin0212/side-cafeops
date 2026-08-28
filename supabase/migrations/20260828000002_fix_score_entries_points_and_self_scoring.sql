-- ============================================================
-- Migration: Block unvalidated points and self-scoring on
-- score_entries INSERT
--
-- Two live gaps in the score_entries INSERT policy:
--
-- 1. `points` was accepted from the client with no server-side
--    check against score_categories.points for the given
--    category_id (src/services/scoreEntryService.ts passes
--    input.points straight through). Any supervisor+ could
--    insert an entry with category_id = a real category but an
--    arbitrary points value, corrupting BASE_SCORE + SUM(points)
--    and the leaderboard.
--
-- 2. The target-rank check (actor_role >= target_role) is always
--    true when profile_id = auth.uid() (a role compared to
--    itself), so nothing blocked an actor from scoring
--    themselves. The frontend already excludes the current user
--    from the selectable employee list in scores/entry.tsx, but
--    that is UX only -- RLS is the actual boundary.
--
-- Fix: require submitted_by != profile_id, and require the
-- (category_id, points) pair to match a currently-active
-- score_categories row. Both added checks reference OTHER
-- tables (profiles, score_categories) via subquery from a
-- policy defined on score_entries -- not a self-reference on
-- score_entries itself -- so this does not hit the profiles-
-- policy-referencing-itself recursion class fixed by
-- 20260828000001; this is the same safe cross-table subquery
-- shape the existing target-rank check already uses successfully.
-- ============================================================

DROP POLICY IF EXISTS "supervisors can insert score_entries" ON score_entries;

CREATE POLICY "supervisors can insert score_entries"
  ON score_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND submitted_by != profile_id
    AND EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('supervisor', 'location_manager', 'general_manager', 'owner')
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        >= (SELECT role FROM profiles WHERE id = score_entries.profile_id)
    AND EXISTS (
      SELECT 1 FROM score_categories AS sc
      WHERE sc.id = score_entries.category_id
        AND sc.points = score_entries.points
        AND sc.is_active = true
    )
  );

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP POLICY IF EXISTS "supervisors can insert score_entries" ON score_entries;
-- CREATE POLICY "supervisors can insert score_entries"
--   ON score_entries FOR INSERT TO authenticated
--   WITH CHECK (
--     submitted_by = auth.uid()
--     AND EXISTS (
--       SELECT 1 FROM profiles AS actor
--       WHERE actor.id = auth.uid()
--         AND actor.role IN ('supervisor', 'location_manager', 'general_manager', 'owner')
--     )
--     AND (SELECT role FROM profiles WHERE id = auth.uid())
--         >= (SELECT role FROM profiles WHERE id = score_entries.profile_id)
--   );

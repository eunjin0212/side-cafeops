-- ============================================================
-- Migration: Block scoring an employee who outranks the actor
--
-- Previously the score_entries INSERT policy only checked that
-- the actor's role was in the scoring roles list -- it never
-- compared the actor's rank against the target employee
-- (score_entries.profile_id). A supervisor could submit a score
-- entry for a general_manager or owner.
--
-- Fix: require the actor's role rank to be >= the target's role
-- rank (employee_role is a Postgres enum declared in hierarchy
-- order: trainee < staff < supervisor < location_manager <
-- general_manager < owner, so >= compares correctly). Same-rank
-- scoring stays allowed, matching the location edit permission
-- pattern already in place.
--
-- The target-profile subquery is intentionally a plain (non
-- SECURITY DEFINER) lookup: it relies on the profiles SELECT
-- policy, so if the actor can't even see the target (different,
-- non-shared location), the subquery returns no row, the
-- comparison evaluates to NULL, and the insert is correctly
-- blocked -- consistent with the location-visibility restriction
-- already in place.
-- ============================================================

DROP POLICY IF EXISTS "supervisors can insert score_entries" ON score_entries;

CREATE POLICY "supervisors can insert score_entries"
  ON score_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('supervisor', 'location_manager', 'general_manager', 'owner')
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid())
        >= (SELECT role FROM profiles WHERE id = score_entries.profile_id)
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
--   );

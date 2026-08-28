-- ============================================================
-- Migration: Restrict score_entries SELECT to self, same-
-- location coworkers, or GM/owner
--
-- "authenticated users can select score_entries" was USING
-- (true) -- every authenticated user, including trainee, could
-- read every score_entries row for every employee at every
-- location, including notes. This was inconsistent with the
-- location-based privacy model already applied to `profiles`
-- (20260820000000/20260820000001): a trainee at Location A could
-- see Location B staff's full score history directly from this
-- table even though they can't see those employees' profiles at
-- all.
--
-- Fix: mirror the exact same visibility rule already used for
-- profiles -- visible if it's your own entry, you share an
-- active location with the entry's employee, or you're a
-- privileged actor (general_manager/owner, via the existing
-- is_privileged_actor() SECURITY DEFINER helper).
--
-- This does not affect get_leaderboard(): that function is
-- SECURITY DEFINER and already does its own location filtering
-- internally, bypassing table RLS entirely. Confirmed no app
-- code queries score_entries for another employee's rows outside
-- what this policy now allows: getMyScoreEntries() is only ever
-- called with the caller's own profile id, and the .select()
-- Postgrest performs after createScoreEntries()/createScoreEntry()
-- INSERT only ever targets employees the submitter could already
-- see in the UI (profiles visibility requires a shared location
-- unless the submitter is already privileged).
-- ============================================================

DROP POLICY IF EXISTS "authenticated users can select score_entries" ON score_entries;

CREATE POLICY "score_entries visible to self, same-location coworkers, or GM/owner"
  ON score_entries FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR is_privileged_actor()
    OR EXISTS (
      SELECT 1
      FROM employee_locations AS mine
      JOIN employee_locations AS theirs
        ON theirs.location_id = mine.location_id AND theirs.is_active = true
      WHERE mine.profile_id = auth.uid()
        AND mine.is_active = true
        AND theirs.profile_id = score_entries.profile_id
    )
  );

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP POLICY IF EXISTS "score_entries visible to self, same-location coworkers, or GM/owner" ON score_entries;
-- CREATE POLICY "authenticated users can select score_entries"
--   ON score_entries FOR SELECT TO authenticated USING (true);

-- ============================================================
-- Migration: Run score cycles continuously on a fixed calendar
--
-- Cycles were only created when a score was submitted, so they
-- stopped whenever nobody submitted one (production had gaps of
-- 25, 4, and 34 days) and started at arbitrary times.
--
-- Cycles now fall on a fixed 14-day grid, so the result is the
-- same whenever the function runs. The app also calls it when
-- reading the current cycle, and it creates any cycles missed
-- while nobody was using the app. No scheduler is needed, which
-- also means a paused Supabase project can't leave a gap.
--
-- The grid is computed in local time so boundaries stay at
-- midnight across daylight saving changes. Existing cycles and
-- score entries are not modified.
-- ============================================================

ALTER TABLE score_cycles
  ADD CONSTRAINT score_cycles_started_at_key UNIQUE (started_at);

CREATE OR REPLACE FUNCTION get_or_create_current_cycle()
RETURNS uuid AS $$
DECLARE
  anchor constant timestamp := '2026-11-03 00:00';
  tz constant text := 'America/Toronto';
  cycle_id uuid;
BEGIN
  SELECT id INTO cycle_id
  FROM score_cycles
  WHERE is_active = true AND started_at <= now() AND ended_at > now()
  ORDER BY started_at DESC
  LIMIT 1;

  IF cycle_id IS NOT NULL THEN
    RETURN cycle_id;
  END IF;

  INSERT INTO score_cycles (started_at, ended_at, is_active)
  SELECT (anchor + n * INTERVAL '14 days') AT TIME ZONE tz,
         (anchor + (n + 1) * INTERVAL '14 days') AT TIME ZONE tz,
         true
  FROM generate_series(0, ((now() AT TIME ZONE tz)::date - anchor::date) / 14) AS n
  ON CONFLICT (started_at) DO NOTHING;

  SELECT id INTO cycle_id
  FROM score_cycles
  WHERE is_active = true AND started_at <= now() AND ended_at > now()
  ORDER BY started_at DESC
  LIMIT 1;

  RETURN cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- The app now calls this when reading too, so limit it to signed-in users.
REVOKE ALL ON FUNCTION get_or_create_current_cycle() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_or_create_current_cycle() TO authenticated;

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- Cycles created by this function are kept: score entries may
-- reference them, and the original function works alongside them.
--
-- ALTER TABLE score_cycles DROP CONSTRAINT score_cycles_started_at_key;
--
-- CREATE OR REPLACE FUNCTION get_or_create_current_cycle()
-- RETURNS uuid AS $$
-- DECLARE
--   cycle_id uuid;
-- BEGIN
--   SELECT id INTO cycle_id
--   FROM score_cycles
--   WHERE is_active = true AND ended_at > now()
--   ORDER BY started_at DESC
--   LIMIT 1;
--
--   IF cycle_id IS NULL THEN
--     INSERT INTO score_cycles (started_at, ended_at, is_active)
--     VALUES (now(), now() + INTERVAL '14 days', true)
--     RETURNING id INTO cycle_id;
--   END IF;
--
--   RETURN cycle_id;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
--
-- GRANT EXECUTE ON FUNCTION get_or_create_current_cycle() TO PUBLIC, anon;

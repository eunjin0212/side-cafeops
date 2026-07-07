-- ============================================================
-- Migration: Add score_cycles and score_entries tables
-- score_entries are immutable: no UPDATE or DELETE policies.
-- Corrections use a new row with correction_for reference.
-- ============================================================

-- ------------------------------------------------------------
-- score_cycles
-- ------------------------------------------------------------

CREATE TABLE score_cycles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at  timestamptz NOT NULL,
  ended_at    timestamptz NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE score_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can select score_cycles"
  ON score_cycles FOR SELECT TO authenticated USING (true);

-- Cycle creation is handled exclusively by get_or_create_current_cycle()
-- No INSERT/UPDATE/DELETE client policies.

-- ------------------------------------------------------------
-- Auto-manage current cycle (SECURITY DEFINER bypasses RLS)
-- Returns the current active cycle id, creating one if needed.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_or_create_current_cycle()
RETURNS uuid AS $$
DECLARE
  cycle_id uuid;
BEGIN
  SELECT id INTO cycle_id
  FROM score_cycles
  WHERE is_active = true AND ended_at > now()
  ORDER BY started_at DESC
  LIMIT 1;

  IF cycle_id IS NULL THEN
    INSERT INTO score_cycles (started_at, ended_at, is_active)
    VALUES (now(), now() + INTERVAL '14 days', true)
    RETURNING id INTO cycle_id;
  END IF;

  RETURN cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- score_entries
-- ------------------------------------------------------------

CREATE TABLE score_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id        uuid NOT NULL REFERENCES score_cycles(id),
  profile_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id     uuid NOT NULL REFERENCES score_categories(id),
  points          integer NOT NULL,
  notes           text,
  submitted_by    uuid NOT NULL REFERENCES profiles(id),
  correction_for  uuid REFERENCES score_entries(id),
  created_at      timestamptz NOT NULL DEFAULT now()
  -- No updated_at: entries are immutable by design.
);

ALTER TABLE score_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can select score_entries"
  ON score_entries FOR SELECT TO authenticated USING (true);

CREATE POLICY "supervisors can insert score_entries"
  ON score_entries FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('supervisor', 'location_manager', 'general_manager', 'owner')
    )
  );

-- No UPDATE or DELETE policies: entries are permanently immutable.

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP FUNCTION IF EXISTS get_or_create_current_cycle();
-- DROP TABLE IF EXISTS score_entries CASCADE;
-- DROP TABLE IF EXISTS score_cycles CASCADE;

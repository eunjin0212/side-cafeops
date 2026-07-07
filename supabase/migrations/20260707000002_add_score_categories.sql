-- ============================================================
-- Migration: Add score_categories table
-- Soft delete only (is_active). No DELETE RLS policy by design.
-- ============================================================

CREATE TYPE score_section AS ENUM (
  'daily_performance',
  'manager_review',
  'positive_addup',
  'management_people'
);

CREATE TABLE score_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  section     score_section NOT NULL,
  points      integer NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_score_categories_updated_at
  BEFORE UPDATE ON score_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE score_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can select score_categories"
  ON score_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admins can insert score_categories"
  ON score_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('general_manager', 'owner')
    )
  );

CREATE POLICY "admins can update score_categories"
  ON score_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('general_manager', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('general_manager', 'owner')
    )
  );

-- No DELETE policy: hard deletes are blocked by RLS. Use is_active = false instead.

-- Seed data from CLAUDE.md examples
INSERT INTO score_categories (name, section, points) VALUES
  ('Late / late notice',         'daily_performance', -5),
  ('Fail to update daily record','daily_performance', -1),
  ('Bad Google review',          'manager_review',    -5),
  ('Good Google review',         'positive_addup',     5),
  ('Help cover for coworkers',   'positive_addup',     2);

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP TABLE IF EXISTS score_categories CASCADE;
-- DROP TYPE IF EXISTS score_section;

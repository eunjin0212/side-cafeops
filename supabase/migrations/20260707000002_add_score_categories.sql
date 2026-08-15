-- ============================================================
-- Migration: Add score_categories table
-- Soft delete only (is_active). No DELETE RLS policy by design.
-- ============================================================

CREATE TYPE IF NOT EXISTS score_section AS ENUM (
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

-- ============================================================
-- Seed data
-- ============================================================

INSERT INTO score_categories (name, section, points) VALUES
  -- Performance Scoreboard per day
  ('Late / late notice', 'daily_performance', -5),
  ('No uniform / hair not tied properly / phone usage / punctuality violation', 'daily_performance', -1),
  ('Fail to take orders correctly / missed order / inaccurate bill / wrong order made/served', 'daily_performance', -1),
  ('Broken / lost / misuse company property', 'daily_performance', -2),
  ('Fail to check / organize board game / washroom papers / low stock items', 'daily_performance', -1),
  ('Unfinished shift duties / weekly cleaning not done properly or on time', 'daily_performance', -1),
  ('Missed reservation / waitlist handling', 'daily_performance', -2),
  ('No smile / low quality customer service', 'daily_performance', -2),
  ('Workplace cleanliness / hygiene / food quality issue', 'daily_performance', -1),
  ('Game fee / extra hour fee charging missing / missed payment', 'daily_performance', -5),
  ('Missed clock in/out / clock out without approval / early clock-in without approval', 'daily_performance', -1),
  ('Fail to organize utility room / major room / inventory backup', 'daily_performance', -1),

  -- Review by Managers (bi-weekly one-time review)
  ('Bad Google review', 'manager_review', -5),
  ('Fail to update availabilities on time / over 2 day off requests per month / limited availability', 'manager_review', -2),
  ('Lower than average work pace / quality / no ability to multitask', 'manager_review', -5),
  ('Fail to notify supervisors for any broken utensils / mistakes', 'manager_review', -5),
  ('Failed to check/respond group messages', 'manager_review', -5),
  ('Disrespectful communication / gossip / distracting others / fail to show teamwork', 'manager_review', -10),

  -- Positive add-up (every 2 weeks)
  ('No late in a month', 'positive_addup', 1),
  ('No utensil broken', 'positive_addup', 1),
  ('Good Google review', 'positive_addup', 5),
  ('No wrong/missed orders', 'positive_addup', 1),
  ('Help cover / stay longer for team members', 'positive_addup', 2),
  ('Suggest improvements for store operations', 'positive_addup', 1),
  ('Help train new employees', 'positive_addup', 1),
  ('No day off request', 'positive_addup', 2),

  -- Management people points
  ('Fail to check emails', 'management_people', -2),
  ('Fail to update daily record', 'management_people', -1),
  ('Fail to update timesheet correctly', 'management_people', -1),
  ('Fail to update employee performance checklist', 'management_people', -5),
  ('Fail to report anything unusual during shift', 'management_people', -5),
  ('Fail to check supplier items delivery', 'management_people', -2),
  ('Fail to check and train new trainee', 'management_people', -1),
  ('Fail to arrange daily duties to each staff', 'management_people', -1),
  ('Fail to finish opening/closing duties', 'management_people', -1),
  ('Game lost', 'management_people', -5),
  ('Fail for language use control', 'management_people', -5),
  ('Fail to do Food Handling Safety Control', 'management_people', -5);

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP TABLE IF EXISTS score_categories CASCADE;
-- DROP TYPE IF EXISTS score_section;

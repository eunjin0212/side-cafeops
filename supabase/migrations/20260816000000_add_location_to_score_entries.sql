-- ============================================================
-- Migration: Add location_id to score_entries
-- Records which location a score entry was earned at, for
-- employees who work across multiple locations.
-- ============================================================

ALTER TABLE score_entries
  ADD COLUMN location_id uuid REFERENCES locations(id);

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- ALTER TABLE score_entries DROP COLUMN location_id;

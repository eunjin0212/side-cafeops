-- ============================================================
-- Migration: Keep-alive ping for the free-tier inactivity pause
--
-- Supabase pauses free projects that see no sufficient activity
-- for 7 days. The previous keep-alive only read `locations` as
-- anon, which RLS answers with an empty result, and the warning
-- emails kept coming.
--
-- A GitHub Action now calls ping() twice a week so the project sees a
-- real database write. The table holds a single row that is
-- overwritten on every ping, so it never grows and repeated
-- calls are harmless. It is separate from business data.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS ping();
--   DROP TABLE IF EXISTS keep_alive;
-- ============================================================

CREATE TABLE keep_alive (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pinged_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on with no policies: nobody can read or write the table
-- directly. The only way in is ping() below.
ALTER TABLE keep_alive ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION ping()
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
  INSERT INTO keep_alive (id, pinged_at)
  VALUES (1, now())
  ON CONFLICT (id) DO UPDATE SET pinged_at = EXCLUDED.pinged_at
  RETURNING pinged_at;
$$;

REVOKE ALL ON FUNCTION ping() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ping() TO anon, authenticated;

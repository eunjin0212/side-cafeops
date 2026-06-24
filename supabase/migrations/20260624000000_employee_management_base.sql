-- ============================================================
-- Migration: Employee Management Base
-- Tables: profiles, locations, employee_locations
-- ============================================================

-- ------------------------------------------------------------
-- Enum
-- ------------------------------------------------------------

CREATE TYPE employee_role AS ENUM (
  'staff',
  'supervisor',
  'location_manager',
  'general_manager',
  'owner'
);

-- ------------------------------------------------------------
-- updated_at trigger function
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------

CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL UNIQUE,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        employee_role NOT NULL DEFAULT 'staff',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can select profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- Auto-create profile on sign up
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ------------------------------------------------------------
-- locations
-- ------------------------------------------------------------

CREATE TABLE locations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  address     text,
  timezone    text NOT NULL DEFAULT 'America/Toronto',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can select locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- employee_locations
-- ------------------------------------------------------------

CREATE TABLE employee_locations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  is_primary  boolean NOT NULL DEFAULT false,
  hired_at    date,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, location_id)
);

CREATE TRIGGER trg_employee_locations_updated_at
  BEFORE UPDATE ON employee_locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE employee_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can select employee_locations"
  ON employee_locations FOR SELECT
  TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- Rollback (run manually if needed)
-- ------------------------------------------------------------
-- DROP TABLE IF EXISTS employee_locations, locations, profiles CASCADE;
-- DROP TYPE IF EXISTS employee_role;
-- DROP FUNCTION IF EXISTS set_updated_at();
-- DROP FUNCTION IF EXISTS handle_new_user();
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

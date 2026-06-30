CREATE TABLE invitations (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT          NOT NULL,
  role        employee_role NOT NULL DEFAULT 'staff',
  location_id UUID          REFERENCES locations(id) ON DELETE SET NULL,
  invited_by  UUID          NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  token       TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  status      TEXT          NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ   NOT NULL DEFAULT now() + INTERVAL '7 days',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TRIGGER set_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers can insert invitations"
  ON invitations FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('location_manager', 'general_manager', 'owner')
    )
  );

CREATE POLICY "managers can select invitations"
  ON invitations FOR SELECT TO authenticated
  USING (
    invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('general_manager', 'owner')
    )
  );

CREATE POLICY "managers can update invitations"
  ON invitations FOR UPDATE TO authenticated
  USING (
    invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('general_manager', 'owner')
    )
  );

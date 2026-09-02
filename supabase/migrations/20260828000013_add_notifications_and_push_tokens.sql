-- ============================================================
-- Migration: Notifications + push tokens, auto-notify on
-- score_entries INSERT (in-app row + Expo push)
--
-- Why: employees should be notified when they receive a score.
-- Two tables:
--   - notifications: an in-app inbox row per event. `type`/`data`
--     are generic (jsonb) so future event types (invitations,
--     reminders, ...) can reuse this table without a schema
--     change -- only `type` needs a new value and the client
--     needs to know how to render it.
--   - push_tokens: one row per registered device (Expo push
--     token). A profile can have multiple devices. Uniqueness is
--     on the token itself (a device's token is tied to that
--     device+app install, not to whoever is currently logged in
--     on it), with an upsert-on-conflict reassigning ownership to
--     whoever just registered it (handles logout/login with a
--     different account on the same device).
--
-- Delivery: a trigger on score_entries INSERT both writes the
-- notifications row and calls Expo's push API directly via
-- pg_net (no Edge Function -- this environment can't reliably
-- deploy/test one without Docker). This is fire-and-forget: the
-- trigger does not wait for or inspect Expo's response.
--
-- RLS notes:
--   - notifications: no client INSERT policy at all -- rows are
--     only created by the SECURITY DEFINER trigger function,
--     which bypasses RLS. SELECT/UPDATE are scoped to the
--     recipient. UPDATE's WITH CHECK only re-asserts
--     profile_id = auth.uid(), not per-column invariants (e.g.
--     restricting to `is_read` only) -- doing that would need a
--     self-referencing subquery on notifications from within
--     notifications' own policy, which is exactly the 42P17
--     recursion class fixed twice already this session. The risk
--     being skipped (a user editing their own notification's
--     title/body) has no real impact -- it's their own inbox.
--   - push_tokens: INSERT/DELETE scoped to own rows. UPDATE uses
--     USING (true) to allow the ON CONFLICT upsert to reassign a
--     token row to a new owner even though the row doesn't
--     currently belong to them -- WITH CHECK still requires the
--     resulting owner to be the caller. This means a caller who
--     somehow knew another device's exact (long, random, opaque)
--     token string could redirect that device's notifications to
--     themselves; not practically exploitable, but noted.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------
CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text NOT NULL,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_profile_created
  ON notifications (profile_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ------------------------------------------------------------
-- push_tokens
-- ------------------------------------------------------------
CREATE TABLE push_tokens (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expo_push_token  text NOT NULL UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_tokens_profile ON push_tokens (profile_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select own push tokens"
  ON push_tokens FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "users can insert own push tokens"
  ON push_tokens FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "users can reassign push tokens to themselves"
  ON push_tokens FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "users can delete own push tokens"
  ON push_tokens FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- ------------------------------------------------------------
-- Trigger: notify on score_entries INSERT
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_score_entry_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_name  text;
  v_title          text;
  v_body           text;
  v_notification_id uuid;
  v_tokens         text[];
BEGIN
  SELECT name INTO v_category_name
  FROM score_categories
  WHERE id = NEW.category_id;

  v_title := CASE WHEN NEW.points >= 0 THEN 'You earned points!' ELSE 'Points deducted' END;
  v_body  := COALESCE(v_category_name, 'Score update')
             || ' (' || CASE WHEN NEW.points >= 0 THEN '+' ELSE '' END || NEW.points || ' pts)';

  INSERT INTO notifications (profile_id, type, title, body, data)
  VALUES (
    NEW.profile_id,
    'score_entry',
    v_title,
    v_body,
    jsonb_build_object(
      'scoreEntryId', NEW.id,
      'categoryId', NEW.category_id,
      'points', NEW.points
    )
  )
  RETURNING id INTO v_notification_id;

  SELECT ARRAY_AGG(expo_push_token) INTO v_tokens
  FROM push_tokens
  WHERE profile_id = NEW.profile_id;

  IF v_tokens IS NOT NULL AND array_length(v_tokens, 1) > 0 THEN
    PERFORM net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
      body := (
        SELECT jsonb_agg(
          jsonb_build_object(
            'to', t,
            'title', v_title,
            'body', v_body,
            'data', jsonb_build_object('notificationId', v_notification_id, 'type', 'score_entry')
          )
        )
        FROM unnest(v_tokens) AS t
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_score_entry_recipient
  AFTER INSERT ON score_entries
  FOR EACH ROW EXECUTE FUNCTION notify_score_entry_recipient();

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP TRIGGER IF EXISTS trg_notify_score_entry_recipient ON score_entries;
-- DROP FUNCTION IF EXISTS notify_score_entry_recipient();
-- DROP TABLE IF EXISTS push_tokens;
-- DROP TABLE IF EXISTS notifications;
-- -- pg_net left installed (harmless, may be relied on elsewhere later).

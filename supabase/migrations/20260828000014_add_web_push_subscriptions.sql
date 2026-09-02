-- ============================================================
-- Migration: Web Push subscriptions + route notification
-- delivery through an Edge Function
--
-- The app currently ships web-only (no App Store/EAS build), so
-- native Expo push tokens can't be issued. iOS Safari (16.4+)
-- supports Web Push for a page added to the home screen, but
-- sending a Web Push message requires encrypting the payload
-- (ECDH + HKDF + AES-GCM per RFC 8291) and signing a VAPID JWT
-- (RFC 8292) -- real crypto that pg_net calling a plain HTTP API
-- can't do. This requires an actual server-side function.
--
-- web_push_subscriptions stores what the Push API's
-- PushManager.subscribe() returns client-side: an opaque
-- `endpoint` URL (unique per browser+device+site) plus the
-- `p256dh`/`auth` keys needed to encrypt messages to it. Same
-- shape and RLS pattern as push_tokens (20260828000013).
--
-- The score_entries trigger now calls a `send-push-notification`
-- Edge Function (deployed separately via `supabase functions
-- deploy --use-api`, which bundles server-side without Docker)
-- instead of calling Expo's push API directly -- that function
-- looks up both push_tokens and web_push_subscriptions for the
-- recipient and sends to whichever exist, doing the Web Push
-- encryption via the `web-push` npm package (Deno's npm
-- compatibility layer).
--
-- The trigger authenticates to the function with a shared secret
-- (not a user JWT -- this is a server-to-server call with no
-- caller identity) stored in Supabase Vault, matched against an
-- Edge Function secret of the same value. The function is
-- deployed with --no-verify-jwt since this custom check replaces
-- Supabase's normal JWT verification.
-- ============================================================

CREATE TABLE web_push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_web_push_subscriptions_profile ON web_push_subscriptions (profile_id);

ALTER TABLE web_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select own web push subscriptions"
  ON web_push_subscriptions FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "users can insert own web push subscriptions"
  ON web_push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- USING(true) so the ON CONFLICT(endpoint) upsert can reassign a
-- subscription row to a new owner (same reasoning as push_tokens'
-- equivalent policy).
CREATE POLICY "users can reassign web push subscriptions to themselves"
  ON web_push_subscriptions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "users can delete own web push subscriptions"
  ON web_push_subscriptions FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- ------------------------------------------------------------
-- Shared secret for trigger -> Edge Function calls
-- ------------------------------------------------------------
SELECT vault.create_secret(
  'n9qmQZA320fe6GS07NIphRAdjMOJ7Pjz9jUfN3EnCh4',
  'edge_function_trigger_secret',
  'Shared secret Postgres triggers send as X-Trigger-Secret when calling Edge Functions; must match the Edge Function''s TRIGGER_SECRET env var.'
);

-- ------------------------------------------------------------
-- Trigger: notify on score_entries INSERT (now via Edge Function)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_score_entry_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_name   text;
  v_title           text;
  v_body            text;
  v_notification_id uuid;
  v_trigger_secret  text;
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

  SELECT decrypted_secret INTO v_trigger_secret
  FROM vault.decrypted_secrets
  WHERE name = 'edge_function_trigger_secret';

  IF v_trigger_secret IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://ozxshixpgqstxomnlrpm.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Trigger-Secret', v_trigger_secret
      ),
      body := jsonb_build_object(
        'profileId', NEW.profile_id,
        'notificationId', v_notification_id,
        'title', v_title,
        'body', v_body,
        'data', jsonb_build_object('notificationId', v_notification_id, 'type', 'score_entry')
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- DROP TABLE IF EXISTS web_push_subscriptions;
-- SELECT vault.update_secret((SELECT id FROM vault.decrypted_secrets WHERE name = 'edge_function_trigger_secret'), 'ROTATED');
-- -- (vault has no direct delete_secret helper; the row can be left inert or removed via `DELETE FROM vault.secrets`.)
-- -- Re-apply 20260828000013's notify_score_entry_recipient() (direct pg_net call to Expo, no Edge Function).

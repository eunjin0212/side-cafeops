// Sends a push notification to every device registered for a profile —
// both native Expo push tokens (push_tokens) and Web Push subscriptions
// (web_push_subscriptions). Invoked by the score_entries trigger
// (notify_score_entry_recipient) via pg_net, authenticated with a shared
// secret rather than a user JWT since the caller is Postgres itself, not
// an end user.
//
// Required Edge Function secrets (set via `supabase secrets set`):
//   TRIGGER_SECRET        — must match Vault's edge_function_trigger_secret
//   VAPID_PUBLIC_KEY       — Web Push VAPID public key
//   VAPID_PRIVATE_KEY      — Web Push VAPID private key (never exposed to clients)
//   VAPID_SUBJECT          — a mailto: or https: URL identifying this app
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically
// by the Edge Functions runtime.

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

type RequestBody = {
  profileId: string;
  notificationId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const triggerSecret = req.headers.get('X-Trigger-Secret');
  if (!triggerSecret || triggerSecret !== Deno.env.get('TRIGGER_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: RequestBody;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const { profileId, title, body, data } = payload;
  if (!profileId || !title || !body) {
    return new Response('Missing required fields', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT');
  if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  }

  const results = { expo: 0, webPush: 0, errors: [] as string[] };

  // Native Expo push tokens
  const { data: pushTokens } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .eq('profile_id', profileId);

  if (pushTokens && pushTokens.length > 0) {
    try {
      const messages = pushTokens.map((t) => ({
        to: t.expo_push_token,
        title,
        body,
        data: data ?? {},
      }));
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });
      results.expo = messages.length;
    } catch (err) {
      results.errors.push(`expo: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Web Push subscriptions
  if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
    const { data: subs } = await supabase
      .from('web_push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('profile_id', profileId);

    if (subs && subs.length > 0) {
      const payloadStr = JSON.stringify({ title, body, data: data ?? {} });
      await Promise.all(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payloadStr,
            );
            results.webPush += 1;
          } catch (err) {
            // 404/410 means the subscription is gone (user revoked
            // permission, uninstalled the PWA, etc.) -- clean it up.
            const status = (err as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) {
              await supabase.from('web_push_subscriptions').delete().eq('id', sub.id);
            } else {
              results.errors.push(
                `webPush(${sub.id}): ${err instanceof Error ? err.message : String(err)}`,
              );
            }
          }
        }),
      );
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

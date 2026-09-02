import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { registerPushToken, registerWebPushSubscription } from '@/services/notificationService';

export type WebPushPermission = 'unsupported' | 'default' | 'granted' | 'denied';

// Converts a VAPID public key (base64url, no padding) into the raw byte
// array PushManager.subscribe() expects.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function getWebPushSupport(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window
  );
}

async function subscribeWebPush(profileId: string): Promise<void> {
  const vapidPublicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    // Misconfigured deployment (missing env var) — throw so the caller can
    // tell the user, instead of silently doing nothing after they granted
    // permission.
    throw new Error('Push notifications are not configured for this deployment.');
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    }));

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Could not create a push subscription.');
  }

  await registerWebPushSubscription(profileId, {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });
}

async function registerNativePush(profileId: string): Promise<void> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) {
    console.warn(
      'usePushNotificationRegistration: no EAS projectId configured, skipping push token registration.',
    );
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
  await registerPushToken(profileId, expoPushToken);
}

// Native push (Expo push tokens) auto-registers on sign-in like before —
// mobile permission dialogs aren't subject to the restriction below.
//
// Web Push is different: Safari (16.4+) and increasingly other browsers
// refuse to even show the permission prompt unless requestPermission() is
// called synchronously inside a user gesture (a click) — calling it from
// an effect on mount silently does nothing on Safari. So on web this hook
// does NOT auto-request; it reports the current permission state and
// hands back `requestWebPushPermission` for a button to call directly
// from its onPress.
export function usePushNotificationRegistration(): {
  webPushPermission: WebPushPermission;
  requestWebPushPermission: () => Promise<void>;
  subscribeError: string | null;
} {
  const { profile } = useCurrentProfile();
  const [webPushPermission, setWebPushPermission] = useState<WebPushPermission>(() =>
    getWebPushSupport() ? Notification.permission : 'unsupported',
  );
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || Platform.OS === 'web') return;
    registerNativePush(profile.id).catch((err) => {
      console.error('usePushNotificationRegistration: failed to register', err);
    });
  }, [profile]);

  async function requestWebPushPermission(): Promise<void> {
    if (!profile || !getWebPushSupport()) return;
    setSubscribeError(null);
    try {
      const permission = await Notification.requestPermission();
      setWebPushPermission(permission);
      if (permission === 'granted') {
        await subscribeWebPush(profile.id);
      }
    } catch (err) {
      console.error('usePushNotificationRegistration: web push request failed', err);
      setSubscribeError('Could not turn on notifications. Please try again.');
    }
  }

  return { webPushPermission, requestWebPushPermission, subscribeError };
}

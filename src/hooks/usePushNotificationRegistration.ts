import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { registerPushToken } from '@/services/notificationService';

// Requests notification permission and registers this device's Expo push
// token against the signed-in profile. Silently no-ops on failure (no
// physical device, permission denied, no EAS project configured yet) —
// push registration is a nice-to-have, never something that should block
// using the app.
export function usePushNotificationRegistration(): void {
  const { profile } = useCurrentProfile();

  useEffect(() => {
    if (!profile) return;

    let cancelled = false;

    async function register(): Promise<void> {
      try {
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
        if (cancelled || !profile) return;

        await registerPushToken(profile.id, expoPushToken);
      } catch (err) {
        console.error('usePushNotificationRegistration: failed to register', err);
      }
    }

    void register();

    return () => {
      cancelled = true;
    };
  }, [profile]);
}

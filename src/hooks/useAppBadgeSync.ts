import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useNotifications } from '@/hooks/useNotifications';

function getBadgeSupport(): boolean {
  return Platform.OS === 'web' && typeof navigator !== 'undefined' && 'setAppBadge' in navigator;
}

// Syncs the home-screen app icon's red badge count (iOS/Android "Add to
// Home Screen" PWAs only — a regular browser tab has no icon to badge) to
// the real unread-notification count whenever the app is open. This works
// independently of Web Push delivery, so the badge is correct the moment
// the user opens the app even if a push notification never arrived. The
// service worker (public/sw.js) also updates the badge on an incoming push
// for live updates while the app is backgrounded.
export function useAppBadgeSync(): void {
  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (!getBadgeSupport()) return;
    const sync =
      unreadCount > 0 ? navigator.setAppBadge(unreadCount) : navigator.clearAppBadge();
    sync.catch((err: unknown) => {
      console.error('useAppBadgeSync: failed to sync app badge', err);
    });
  }, [unreadCount]);
}

// Minimal service worker for Web Push. This app has no offline/caching
// story yet -- this worker exists solely so the browser has something to
// register a push subscription against and to display notifications.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Best-effort home-screen icon badge: set it to however many notifications
// this service worker currently has on screen. It's an approximation (not
// the real DB unread count), self-corrects the moment the app is opened —
// see useAppBadgeSync, which syncs it to the real count on foreground.
async function syncBadgeToShownNotifications() {
  if (!('setAppBadge' in self.navigator)) return;
  try {
    const shown = await self.registration.getNotifications();
    if (shown.length > 0) {
      await self.navigator.setAppBadge(shown.length);
    } else {
      await self.navigator.clearAppBadge();
    }
  } catch {
    // Badging API unsupported or blocked — non-fatal.
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Twilight Cafe', body: event.data.text() };
  }

  const title = payload.title || 'Twilight Cafe';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-1024.png',
    badge: '/icons/icon-1024.png',
    data: payload.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(syncBadgeToShownNotifications),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      await syncBadgeToShownNotifications();
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/notifications');
    })(),
  );
});

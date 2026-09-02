// Minimal service worker for Web Push. This app has no offline/caching
// story yet -- this worker exists solely so the browser has something to
// register a push subscription against and to display notifications.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'CafeOps', body: event.data.text() };
  }

  const title = payload.title || 'CafeOps';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-1024.png',
    badge: '/icons/icon-1024.png',
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/notifications');
    }),
  );
});

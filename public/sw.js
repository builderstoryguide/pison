/**
 * Service Worker for Web Push Notifications
 * Handles push events and displays notifications for pending transactions
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = { title: 'Pending Transactions', body: 'New transactions require your approval', url: '/validation/pending' };
  try {
    payload = event.data.json();
  } catch {
    payload.body = event.data.text() || payload.body;
  }

  const options = {
    body: payload.body,
    icon: '/media/illustrations/1.svg',
    badge: '/media/illustrations/1.svg',
    data: {
      url: payload.url || '/validation/pending',
      timestamp: Date.now(),
    },
    actions: [{ action: 'open', title: 'Review' }],
    tag: 'pending-transactions',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title || 'Pending Transactions', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const path = event.notification.data?.url || '/validation/pending';
  const url = new URL(path, self.location.origin).href;
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

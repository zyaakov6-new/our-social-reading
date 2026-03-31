// AMUD Service Worker — handles push notifications

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? 'AMUD';
  const options = {
    body: data.body ?? '',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: data.tag ?? 'amud-notification',
    renotify: true,
    data: { url: data.url ?? '/' },
    dir: 'rtl',
    lang: 'he',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});

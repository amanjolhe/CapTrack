self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    const { title, body, delaySeconds, reminderId } = event.data;
    const triggerMs = Math.max(100, delaySeconds * 1000);
    
    setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: `reminder-${reminderId || Date.now()}`,
        renotify: true,
        vibrate: [200, 100, 200]
      });
    }, triggerMs);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

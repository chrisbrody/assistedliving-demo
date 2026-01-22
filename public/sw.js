// Service Worker for PWA functionality
const CACHE_NAME = 'facility-ready-board-v3';

// Install event - cache basic assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/admin',
        '/floor',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ===========================================
// PUSH NOTIFICATIONS
// ===========================================

// Handle incoming push messages
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, tag, data: notificationData } = data;

  const options = {
    body: body,
    tag: tag || 'facility-ready-board',
    icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=readyboard&size=192',
    badge: 'https://api.dicebear.com/7.x/shapes/svg?seed=readyboard&size=72',
    vibrate: [200, 100, 200, 100, 200], // Vibration pattern for mobile
    requireInteraction: true, // Keep notification visible until user interacts
    data: notificationData,
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click - focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle action button clicks
  if (event.action === 'dismiss') {
    return;
  }

  // Determine which view to open based on notification data
  const viewType = event.notification.data?.viewType || 'admin';
  const targetPath = viewType === 'floor' ? '/floor' : '/admin';

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes('/admin') || client.url.includes('/floor')) {
          return client.focus();
        }
      }
      // Open new window if none exists
      return clients.openWindow(targetPath);
    })
  );
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls (we want those fresh)
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});

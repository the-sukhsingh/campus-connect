// Service worker for SCSRK PWA

const CACHE_VERSION = '1';
const CACHE_NAME = 'scsrk-cache-v' + CACHE_VERSION;
const OFFLINE_URL = '/offline';

// Assets to cache
const urlsToCache = [
  '/offline',
  '/auth',
  '/manifest.json',
  '/favicon.ico',
  '/dashboard/student',
  '/dashboard/faculty',
  '/dashboard/hod',
  '/dashboard/notes/[id]',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Add a map to track recently processed notification IDs with timestamps
const processedNotifications = new Map();

// Clear old notification IDs every 5 minutes to prevent memory leaks
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [id, timestamp] of processedNotifications.entries()) {
    if (timestamp < fiveMinutesAgo) {
      processedNotifications.delete(id);
    }
  }
}, 60000); // Run every minute

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Helper function to check if a request has cache busting param
function hasCacheBustingParam(url) {
  const urlObj = new URL(url, self.location.origin);
  return urlObj.searchParams.has('_');
}

// Helper function to check if we should bypass cache
function shouldBypassCache(request) {
  const url = new URL(request.url);

  if (hasCacheBustingParam(url.href)) {
    return true;
  }

  if (url.pathname.startsWith('/api/')) {
    const cachableApiRoutes = [
      '/api/firebase-config/'
    ];

    if (cachableApiRoutes.some(route => url.pathname.includes(route))) {
      return false;
    }

    return true;
  }

  if (url.search.includes('no-cache')) {
    return true;
  }

  return false;
}

// Fetch event - network first for API and cache busted requests, cache first for assets
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/_next/data/') || 
      url.pathname.startsWith('/_next/static/') ||
      url.pathname.includes('__nextjs') ||
      (event.request.mode === 'navigate' && !url.pathname.startsWith('/api/'))) {
    return;
  }

  if (event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'You are offline. This operation requires network connectivity.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  if (shouldBypassCache(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return response;
        })
        .catch(async () => {
          if (event.request.mode === 'navigate') {
            return caches.match(event.request)
              .then(cachedResponse => {
                if (cachedResponse) {
                  const headers = new Headers(cachedResponse.headers);
                  headers.append('X-From-Cache', 'true');

                  return new Response(cachedResponse.body, {
                    status: cachedResponse.status,
                    statusText: cachedResponse.statusText,
                    headers: headers
                  });
                }
                return caches.match(OFFLINE_URL);
              });
          }

          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              const headers = new Headers(cachedResponse.headers);
              headers.append('X-From-Cache', 'true');
              headers.append('X-Cache-Status', 'stale');

              return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers: headers
              });
            }

            return new Response(
              JSON.stringify({ error: 'You are offline and no cached data is available.' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            return new Response('Network error', { status: 503 });
          });
      })
  );
});

// Create a notifications broadcast channel
const notificationsChannel = 'notifications-channel';

// Helper function to store a notification
function storeNotification(notification) {
  try {
    let storedNotifications = [];
    const existingData = self.localStorage.getItem('backgroundNotifications');

    if (existingData) {
      try {
        storedNotifications = JSON.parse(existingData);
        if (!Array.isArray(storedNotifications)) {
          storedNotifications = [];
        }
      } catch (error) {
        console.error('[SW] Error parsing stored notifications:', error);
        storedNotifications = [];
      }
    }

    storedNotifications.push({
      id: notification.id || Date.now().toString(),
      title: notification.title,
      body: notification.body,
      url: notification.data?.url || notification.url || '/',
      timestamp: new Date().toISOString(),
      read: false
    });

    self.localStorage.setItem(
      'backgroundNotifications', 
      JSON.stringify(storedNotifications.slice(-50))
    );

    return true;
  } catch (error) {
    console.error('[SW] Error storing notification:', error);
    return false;
  }
}

// Push notification event handling - This is the main handler for push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    console.log('[SW] Push notification received:', data);

    const notificationId = data.data?.id || `notification-${Date.now()}`;

    if (processedNotifications.has(notificationId)) {
      console.log('[SW] Duplicate notification detected, skipping:', notificationId);
      return;
    }

    processedNotifications.set(notificationId, Date.now());

    const options = {
      body: data.notification?.body || data.body || '',
      icon: data.notification?.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.data?.url || data.url || '/',
        id: notificationId
      },
      tag: notificationId,
      renotify: false
    };

    const title = data.notification?.title || data.title || 'New Notification';

    const notificationObj = {
      id: notificationId,
      title: title,
      body: options.body,
      url: options.data.url,
      timestamp: new Date().toISOString(),
      read: false
    };

    async function checkAppIsActive() {
      const allClients = await self.clients.matchAll({ 
        type: 'window',
        includeUncontrolled: true 
      });

      if (allClients.length === 0) {
        console.log('[SW] No clients found, app is not active');
        return false;
      }

      let isActive = false;

      for (const client of allClients) {
        try {
          const visibilityState = await client.visibilityState;
          if (visibilityState === 'visible') {
            isActive = true;
            break;
          }
        } catch (e) {
          console.log('[SW] Client does not support visibilityState API:', e);
        }
      }

      if (!isActive) {
        for (const client of allClients) {
          try {
            const focused = await client.focused;
            if (focused) {
              isActive = true;
              break;
            }
          } catch (e) {
            console.log('[SW] Client does not support focused API:', e);
          }
        }
      }

      console.log('[SW] App active state:', isActive);
      return isActive;
    }

    event.waitUntil((async () => {
      const isAppActive = await checkAppIsActive();
      const hasBroadcastChannel = 'BroadcastChannel' in self;

      try {
        const db = await new Promise((resolve, reject) => {
          const request = self.indexedDB.open('notifications', 1);

          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('notifications')) {
              db.createObjectStore('notifications', { keyPath: 'id' });
            }
          };

          request.onsuccess = (event) => resolve(event.target.result);
          request.onerror = (event) => reject(event.target.error);
        });

        const tx = db.transaction('notifications', 'readwrite');
        const store = tx.objectStore('notifications');

        const getRequest = store.get(notificationId);
        let exists = false;

        await new Promise((resolve) => {
          getRequest.onsuccess = (event) => {
            exists = !!event.target.result;
            resolve();
          };
          getRequest.onerror = () => resolve();
        });

        if (exists) {
          console.log('[SW] Notification already exists in IndexedDB, skipping:', notificationId);
          return;
        }

        await store.put(notificationObj);
        console.log('[SW] Notification stored in IndexedDB:', notificationObj.id);
      } catch (error) {
        console.error('[SW] Error storing notification in IndexedDB:', error);
        try {
          let storedNotifications = [];
          const existingData = localStorage.getItem('backgroundNotifications');

          if (existingData) {
            storedNotifications = JSON.parse(existingData);

            if (storedNotifications.some(n => n.id === notificationId)) {
              console.log('[SW] Notification already exists in localStorage, skipping:', notificationId);
              return;
            }
          }

          storedNotifications.push(notificationObj);
          localStorage.setItem('backgroundNotifications', JSON.stringify(storedNotifications));
        } catch (e) {
          console.error('[SW] Failed to store notification in localStorage:', e);
        }
      }

      if (isAppActive && hasBroadcastChannel) {
        try {
          const channel = new BroadcastChannel(notificationsChannel);
          channel.postMessage({
            type: 'NOTIFICATION_RECEIVED',
            notification: notificationObj
          });
          channel.close();
          console.log('[SW] Notification sent to active app via BroadcastChannel');
          return;
        } catch (error) {
          console.error('[SW] Error sending message via BroadcastChannel:', error);
        }
      }

      return self.registration.showNotification(title, options);
    })());
  } catch (error) {
    console.error('[SW] Error processing push notification:', error);
  }
});

// Notification click event - open the target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const url = notificationData.url || '/';
  const notificationId = notificationData.id || Date.now().toString();

  try {
    const tempNotifications = self.indexedDB.open('notifications', 1);

    tempNotifications.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');

      const getRequest = store.get(notificationId);

      getRequest.onsuccess = () => {
        const notification = getRequest.result;
        if (notification) {
          notification.read = true;
          store.put(notification);
        }
      };

      tx.oncomplete = () => {
        db.close();
      };
    };
  } catch (error) {
    console.error('[SW] Error marking notification as read:', error);
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Listen for message from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_NOTIFICATION_CHANNEL') {
    console.log('[SW] Notification channel initialized');
  }

  if (event.data && event.data.type === 'INVALIDATE_CACHE') {
    const urls = event.data.urls || [];

    if (urls.length > 0) {
      caches.open(CACHE_NAME).then(cache => {
        urls.forEach(url => {
          console.log('[SW] Invalidating cache for:', url);
          cache.delete(url);
        });
      });
    } else if (event.data.pattern) {
      const pattern = new RegExp(event.data.pattern);
      caches.open(CACHE_NAME).then(cache => {
        cache.keys().then(requests => {
          requests.forEach(request => {
            if (pattern.test(request.url)) {
              console.log('[SW] Invalidating cache for pattern match:', request.url);
              cache.delete(request);
            }
          });
        });
      });
    }
  }

  if (event.data && event.data.type === 'FORCE_NETWORK_FETCH') {
    console.log('[SW] Forced network fetch requested');

    const urls = event.data.urls || [];

    if (urls.length > 0) {
      caches.open(CACHE_NAME).then(cache => {
        urls.forEach(url => {
          console.log('[SW] Forcing network fetch for:', url);

          cache.delete(url).then(() => {
            const cacheBustUrl = url.includes('?') 
              ? `${url}&_=${Date.now()}` 
              : `${url}?_=${Date.now()}`;

            fetch(cacheBustUrl, {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              },
              cache: 'no-store'
            }).then(response => {
              if (response && response.status === 200) {
                cache.put(url, response.clone());
              }
            }).catch(err => {
              console.error('[SW] Error fetching fresh data:', err);
            });
          });
        });
      });
    } else {
      caches.open(CACHE_NAME).then(cache => {
        cache.keys().then(requests => {
          requests.forEach(request => {
            if (request.url.includes('/api/')) {
              console.log('[SW] Force invalidating API cache for:', request.url);
              cache.delete(request);
            }
          });
        });
      });
    }
  }

  if (event.data && event.data.type === 'SKIP_WAITING_ON_API_ROUTES') {
    console.log('[SW] Skip waiting on API routes requested');
    caches.open(CACHE_NAME).then(cache => {
      cache.keys().then(requests => {
        const apiRequests = requests.filter(request => 
          request.url.includes('/api/')
        );

        apiRequests.forEach(request => {
          console.log('[SW] Deleting API cache for:', request.url);
          cache.delete(request);
        });
      });
    });
  }

  if (event.data && event.data.type === 'CLEAR_NOTIFICATIONS') {
    try {
      const tempNotifications = self.indexedDB.open('notifications', 1);

      tempNotifications.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction('notifications', 'readwrite');
        const store = tx.objectStore('notifications');

        store.clear();

        tx.oncomplete = () => {
          db.close();
          console.log('[SW] Notifications cleared from IndexedDB');
        };
      };
    } catch (error) {
      console.error('[SW] Error clearing notifications from IndexedDB:', error);
      localStorage.removeItem('backgroundNotifications');
      console.log('[SW] Notifications cleared from localStorage');
    }
  }

  if (event.data && event.data.type === 'MARK_NOTIFICATION_READ') {
    try {
      const notificationId = event.data.id;

      if (notificationId) {
        const tempNotifications = self.indexedDB.open('notifications', 1);

        tempNotifications.onsuccess = (event) => {
          const db = event.target.result;
          const tx = db.transaction('notifications', 'readwrite');
          const store = tx.objectStore('notifications');

          const getRequest = store.get(notificationId);

          getRequest.onsuccess = () => {
            const notification = getRequest.result;
            if (notification) {
              notification.read = true;
              store.put(notification);
              console.log(`[SW] Notification ${notificationId} marked as read in IndexedDB`);
            }
          };

          tx.oncomplete = () => {
            db.close();
          };
        };
      }
    } catch (error) {
      console.error('[SW] Error marking notification as read in IndexedDB:', error);
    }
  }

  if (event.data && event.data.type === 'REQUEST_NOTIFICATION_SYNC') {
    console.log('[SW] Notification sync requested by client');
    syncNotifications();
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    const db = await new Promise((resolve, reject) => {
      const request = self.indexedDB.open('notifications', 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });

    const notifications = await new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readonly');
      const store = tx.objectStore('notifications');
      const request = store.getAll();

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });

    if (notifications && notifications.length > 0) {
      console.log('[SW] Found notifications in IndexedDB:', notifications.length);

      const clients = await self.clients.matchAll();

      if (clients.length > 0) {
        const client = clients[0];
        client.postMessage({
          type: 'SYNC_NOTIFICATIONS',
          notifications
        });
        console.log('[SW] Sent notifications to client');
      } else {
        console.log('[SW] No active clients found to send notifications to');
      }
    } else {
      console.log('[SW] No notifications found in IndexedDB');

      try {
        const storedNotifications = localStorage.getItem('backgroundNotifications');
        if (storedNotifications) {
          const notifications = JSON.parse(storedNotifications);

          if (notifications && notifications.length > 0) {
            console.log('[SW] Found notifications in localStorage:', notifications.length);

            const clients = await self.clients.matchAll();

            if (clients.length > 0) {
              const client = clients[0];
              client.postMessage({
                type: 'SYNC_NOTIFICATIONS',
                notifications
              });
              console.log('[SW] Sent notifications from localStorage to client');
            }
          }
        }
      } catch (error) {
        console.error('[SW] Error syncing notifications from localStorage:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Error syncing notifications:', error);
  }
}
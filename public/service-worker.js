// Service worker for SCSRK PWA

const CACHE_VERSION = '1';
const CACHE_NAME = 'scsrk-cache-v' + CACHE_VERSION;
const OFFLINE_URL = '/offline';

// Assets to cache
const urlsToCache = [
  '/offline',
  '/auth',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

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
  // Check for cache control headers that indicate no caching
  const url = new URL(request.url);
  
  // Cache busting via timestamp parameter
  if (hasCacheBustingParam(url.href)) {
    return true;
  }
  
  // Always bypass cache for API requests to ensure fresh data
  if (url.pathname.startsWith('/api/')) {
    // We could have an allowlist of API endpoints that CAN be cached
    const cachableApiRoutes = [
      '/api/firebase-config/'
    ];
    
    // Check if URL is in the allowlist
    if (cachableApiRoutes.some(route => url.pathname.includes(route))) {
      return false;
    }
    
    return true;
  }
  
  // Don't cache URLs with no-cache in the query string
  if (url.search.includes('no-cache')) {
    return true;
  }
  
  return false;
}

// Fetch event - network first for API and cache busted requests, cache first for assets
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip Next.js navigation requests and let them be handled by the router
  const url = new URL(event.request.url);
  
  // Skip handling Next.js internal navigation and data requests
  if (url.pathname.startsWith('/_next/data/') || 
      url.pathname.startsWith('/_next/static/') ||
      url.pathname.includes('__nextjs') ||
      (event.request.mode === 'navigate' && !url.pathname.startsWith('/api/'))) {
    return; // Let Next.js handle navigation requests
  }
  
  // For non-GET requests (POST, PUT, DELETE), don't cache
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
  
  // Network first strategy for requests that should bypass cache
  if (shouldBypassCache(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // For API requests that we successfully got from network, don't cache them
          // so we always get fresh data on next request
          return response;
        })
        .catch(async () => {
          // If network fails, try cache as fallback (but only for critical routes)
          if (event.request.mode === 'navigate') {
            return caches.match(event.request)
              .then(cachedResponse => {
                if (cachedResponse) {
                  // Mark cached response so UI can show "offline data" indicator
                  const headers = new Headers(cachedResponse.headers);
                  headers.append('X-From-Cache', 'true');
                  
                  // Create new response with the added header
                  return new Response(cachedResponse.body, {
                    status: cachedResponse.status,
                    statusText: cachedResponse.statusText,
                    headers: headers
                  });
                }
                return caches.match(OFFLINE_URL);
              });
          }
          
          // For API requests, return cached version with header indicating it's stale
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
  
  // Cache first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response since we're going to use it twice
            const responseToCache = response.clone();
            
            // Cache the new resource
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(() => {
            // If it's a navigation request, show offline page
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
    // Get existing notifications from localStorage
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
    
    // Add the new notification
    storedNotifications.push({
      id: notification.id || Date.now().toString(),
      title: notification.title,
      body: notification.body,
      url: notification.data?.url || notification.url || '/',
      timestamp: new Date().toISOString(),
      read: false
    });
    
    // Store back in localStorage (limit to 50 notifications)
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
    
    const options = {
      body: data.notification?.body || data.body || '',
      icon: data.notification?.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.data?.url || data.url || '/',
        id: data.data?.id || Date.now().toString()
      }
    };
    
    const title = data.notification?.title || data.title || 'New Notification';
    
    // Create notification object to store
    const notificationObj = {
      id: data.data?.id || Date.now().toString(),
      title: title,
      body: options.body,
      url: options.data.url,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // IMPORTANT: Always store the notification first, regardless of app state
    // This ensures notifications are available even when dismissed
    
    // Use IndexedDB for persistent storage that works in service worker context
    self.clients.matchAll().then(clients => {
      // If app is not open or no clients are found, use persistent storage
      const isAppOpen = clients.length > 0;
      
      // Try to send notification directly to app if it's open
      let notificationSent = false;
      if (isAppOpen && 'BroadcastChannel' in self) {
        try {
          const channel = new BroadcastChannel(notificationsChannel);
          channel.postMessage({
            type: 'NOTIFICATION_RECEIVED',
            notification: notificationObj
          });
          channel.close();
          notificationSent = true;
          console.log('[SW] Notification sent to app via BroadcastChannel');
        } catch (error) {
          console.error('[SW] Error sending message via BroadcastChannel:', error);
        }
      }
      
      // Always store the notification, even if we sent it to the app
      // This ensures it's never lost and can be retrieved later if needed
      try {
        const tempNotifications = self.indexedDB.open('notifications', 1);
        
        tempNotifications.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('notifications')) {
            db.createObjectStore('notifications', { keyPath: 'id' });
          }
        };
        
        tempNotifications.onsuccess = (event) => {
          const db = event.target.result;
          const tx = db.transaction('notifications', 'readwrite');
          const store = tx.objectStore('notifications');
          
          const request = store.put(notificationObj);
          
          request.onsuccess = () => {
            console.log('[SW] Notification stored in IndexedDB:', notificationObj.id);
          };
          
          request.onerror = (error) => {
            console.error('[SW] Error storing notification in IndexedDB:', error);
            // Fallback to localStorage if IndexedDB fails
            try {
              let storedNotifications = [];
              const existingData = localStorage.getItem('backgroundNotifications');
              
              if (existingData) {
                storedNotifications = JSON.parse(existingData);
              }
              
              storedNotifications.push(notificationObj);
              localStorage.setItem('backgroundNotifications', JSON.stringify(storedNotifications));
              console.log('[SW] Notification stored in localStorage as fallback');
            } catch (e) {
              console.error('[SW] Failed to store notification in localStorage:', e);
            }
          };
          
          tx.oncomplete = () => {
            db.close();
          };
        };
        
        tempNotifications.onerror = (error) => {
          console.error('[SW] Error opening IndexedDB:', error);
        };
      } catch (error) {
        console.error('[SW] Error with IndexedDB operations:', error);
      }
    });
    
    // Show the notification
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[SW] Error processing push notification:', error);
  }
});

// Notification click event - open the target URL
self.addEventListener('notificationclick', (event) => {
  // Close the notification when clicked
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const url = notificationData.url || '/';
  const notificationId = notificationData.id || Date.now().toString();
  
  // Mark notification as read
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
  
  // Open the target URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with the target URL
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open with the URL, open a new one
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
  
  // Handle cache invalidation requests
  if (event.data && event.data.type === 'INVALIDATE_CACHE') {
    const urls = event.data.urls || [];
    
    if (urls.length > 0) {
      // Remove specific URLs from cache
      caches.open(CACHE_NAME).then(cache => {
        urls.forEach(url => {
          console.log('[SW] Invalidating cache for:', url);
          cache.delete(url);
        });
      });
    } else if (event.data.pattern) {
      // Remove URLs matching a pattern
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
  
  // Enhanced FORCE_NETWORK_FETCH handler
  if (event.data && event.data.type === 'FORCE_NETWORK_FETCH') {
    console.log('[SW] Forced network fetch requested');
    
    const urls = event.data.urls || [];
    
    if (urls.length > 0) {
      // For specific URLs, delete from cache and re-fetch them
      caches.open(CACHE_NAME).then(cache => {
        urls.forEach(url => {
          console.log('[SW] Forcing network fetch for:', url);
          
          // First delete the URL from the cache
          cache.delete(url).then(() => {
            // Then fetch it from the network with cache-busting
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
                // Store fresh response in cache
                cache.put(url, response.clone());
              }
            }).catch(err => {
              console.error('[SW] Error fetching fresh data:', err);
            });
          });
        });
      });
    } else {
      // If no specific URLs, invalidate all API route caches
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
  
  // Skip waiting for API routes - new handler
  if (event.data && event.data.type === 'SKIP_WAITING_ON_API_ROUTES') {
    console.log('[SW] Skip waiting on API routes requested');
    caches.open(CACHE_NAME).then(cache => {
      cache.keys().then(requests => {
        // Filter only API requests
        const apiRequests = requests.filter(request => 
          request.url.includes('/api/')
        );
        
        // Delete all API routes from cache to force fresh fetch
        apiRequests.forEach(request => {
          console.log('[SW] Deleting API cache for:', request.url);
          cache.delete(request);
        });
      });
    });
  }
  
  // Clear notification data
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
      // Fallback to localStorage
      localStorage.removeItem('backgroundNotifications');
      console.log('[SW] Notifications cleared from localStorage');
    }
  }
  
  // Mark notification as read
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
  
  // Request to sync notifications from IndexedDB to client
  if (event.data && event.data.type === 'REQUEST_NOTIFICATION_SYNC') {
    console.log('[SW] Notification sync requested by client');
    syncNotifications();
  }
});

// This will handle the sync event for ensuring notifications are delivered
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Function to sync stored notifications to the client
async function syncNotifications() {
  try {
    // Try to use IndexedDB first
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
      
      // Send to client if any is available
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
      
      // Fall back to localStorage if IndexedDB is empty
      try {
        const storedNotifications = localStorage.getItem('backgroundNotifications');
        if (storedNotifications) {
          const notifications = JSON.parse(storedNotifications);
          
          if (notifications && notifications.length > 0) {
            console.log('[SW] Found notifications in localStorage:', notifications.length);
            
            // Send to client if any is available
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
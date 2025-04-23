// Firebase Cloud Messaging Service Worker
// This file must be at the root of the domain

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');
importScripts('/firebase-config.js'); // Import the updated firebase-config.js

// Initialize Firebase with config from API
let messaging;

// Service workers don't have access to environment variables,
// so we need to fetch the config from an API endpoint
function initializeFirebaseSW() {
  fetch('/api/firebase-config')
    .then(response => response.json())
    .then(config => {
      if (!config || !config.projectId) {
        throw new Error('Invalid Firebase configuration received from API');
      }
      
      
      console.log('[Firebase SW] Initializing Firebase with config from API');
      
      // Initialize Firebase if not already initialized
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      
      // Initialize messaging
      try {
        messaging = firebase.messaging();
        
        // Handle background messages
        messaging.onBackgroundMessage((payload) => {
          console.log('[Firebase SW] Received background message', payload);
          
          const notificationTitle = payload.notification?.title || 'New Notification';
          const notificationOptions = {
            body: payload.notification?.body || '',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data: payload.data || {},
            vibrate: [100, 50, 100],
            tag: 'notification-' + Date.now(), // Unique tag to prevent duplicate notifications
          };
          
          return self.registration.showNotification(notificationTitle, notificationOptions);
        });
        
        console.log('[Firebase SW] Firebase Messaging initialized successfully');
      } catch (error) {
        console.error('[Firebase SW] Error initializing Firebase Messaging:', error);
      }
    })
    .catch(error => {
      console.error('[Firebase SW] Failed to initialize Firebase from API:', error);
    });
}

// Initialize immediately
initializeFirebaseSW();

// Service worker events
self.addEventListener('install', event => {
  console.log('[Firebase SW] Installing Service Worker...');
  self.skipWaiting(); // Ensure the newly installed SW becomes active immediately
});

self.addEventListener('activate', event => {
  console.log('[Firebase SW] Service worker activated');
  event.waitUntil(self.clients.claim());
  
  // Re-initialize Firebase if needed
  if (!messaging) {
    console.log('[Firebase SW] Messaging not initialized yet, trying again...');
    initializeFirebaseSW();
  }
});

// Handle push notifications directly
self.addEventListener('push', event => {
  console.log('[Firebase SW] Push received:', event);
  
  let notification = {};
  
  try {
    notification = event.data && event.data.json();
  } catch (e) {
    console.error('[Firebase SW] Error parsing push data:', e);
  }
  
  // Use data from the push event
  const title = notification.notification?.title || 'New Notification';
  const options = {
    body: notification.notification?.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: notification.data || {},
    vibrate: [100, 50, 100],
    tag: 'notification-' + Date.now(), // Unique tag to prevent duplicate notifications
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('[Firebase SW] Notification click:', event);
  
  // Close the notification
  event.notification.close();
  
  // Get any custom data from the notification
  const urlToOpen = event.notification.data?.url || '/dashboard/student';
  
  // Open the URL in a client window
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if a window is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
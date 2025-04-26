'use client';

import { useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';
import { initFetchWrapper } from '@/utils/fetchWrapper';
import { initBackgroundSync } from '@/utils/offlineSync';

// This component handles client-side Firebase initialization
export default function FirebaseInitializer() {
  useEffect(() => {
    // Initialize our fetch wrapper to prevent caching issues
    initFetchWrapper();
    
    // Initialize offline background sync
    initBackgroundSync();

    // Initialize Firebase in the client
    const initFirebase = async () => {
      try {
        // Check if Firebase is already initialized
        if (!window.firebaseInitialized) {
          console.log('Initializing Firebase in client...');
          
          // Get configuration from window variables (set in layout.js)
          const firebaseConfig = {
            apiKey: window.FIREBASE_API_KEY,
            authDomain: window.FIREBASE_AUTH_DOMAIN,
            projectId: window.FIREBASE_PROJECT_ID,
            storageBucket: window.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID,
            appId: window.FIREBASE_APP_ID
          };

          // Validate config - needs at least projectId to initialize properly
          if (!firebaseConfig.projectId) {
            console.error('Firebase initialization failed: Missing projectId in configuration');
            
            // Try to get config from API as a fallback
            try {
              const response = await fetch('/api/firebase-config');
              const config = await response.json();
              
              if (config && config.projectId) {
                console.log('Using firebase config from API');
                Object.assign(firebaseConfig, config);
              } else {
                console.error('Could not get valid config from API');
                return;
              }
            } catch (fetchError) {
              console.error('Failed to fetch firebase config:', fetchError);
              return;
            }
          }

          // Initialize Firebase
          const app = initializeApp(firebaseConfig);
          const auth = getAuth(app);
          
          // Initialize messaging if supported
          if (typeof window !== 'undefined' && 'Notification' in window) {
            try {
              const messaging = getMessaging(app);
              console.log('Firebase messaging initialized in client');
              
              // Request permission if not already granted
              if (Notification.permission === 'default') {
                console.log('Requesting notification permission during initialization');
                Notification.requestPermission().then(permission => {
                  console.log('Notification permission:', permission);
                });
              }
            } catch (messagingError) {
              console.error('Error initializing Firebase messaging:', messagingError);
            }
          } else {
            console.log('Notifications not supported in this browser or environment');
          }
          
          // Mark as initialized
          window.firebaseInitialized = true;
          console.log('Firebase initialized successfully in client');
          
          // Register for background sync if supported
          if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
              registration.sync.register('sync-operations')
                .then(() => console.log('Background sync registered'))
                .catch(err => console.error('Error registering background sync:', err));
            });
          }
        }
      } catch (error) {
        console.error('Firebase initialization error in client:', error);
      }
    };

    initFirebase();
  }, []);

  // This component doesn't render anything
  return null;
}
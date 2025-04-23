// This file provides Firebase configuration for scripts loaded in the browser
// It initializes Firebase for use in the public directory and service worker

// Safely access the global context (window in browser, self in service worker)
const globalContext = typeof window !== 'undefined' ? window : 
                     typeof self !== 'undefined' ? self : {};

// Create firebaseConfig object from window variables or empty strings if not available
const firebaseConfig = {
  apiKey: globalContext.FIREBASE_API_KEY || '',
  authDomain: globalContext.FIREBASE_AUTH_DOMAIN || '',
  projectId: globalContext.FIREBASE_PROJECT_ID || '',
  storageBucket: globalContext.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: globalContext.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: globalContext.FIREBASE_APP_ID || ''
};

// For debugging
console.log('Firebase config loaded from public/firebase-config.js:', 
  Object.keys(firebaseConfig).map(key => `${key}: ${firebaseConfig[key] ? '✓' : '✗'}`));

// Function to initialize Firebase
function initializeFirebase() {
  // Check if Firebase is available
  if (typeof firebase !== 'undefined') {
    // Check if we have a projectId to avoid initialization with invalid config
    if (firebaseConfig.projectId) {
      // Check if Firebase is already initialized
      if (!firebase.apps || !firebase.apps.length) {
        console.log('Initializing Firebase in firebase-config.js');
        firebase.initializeApp(firebaseConfig);
      } else {
        console.log('Firebase already initialized');
      }
    } else {
      console.error('Cannot initialize Firebase: missing projectId');
      // Try to load config from API
      tryLoadConfigFromAPI();
    }
  } else {
    console.error('Firebase libraries are not loaded yet');
  }
}

// Function to try loading config from API
function tryLoadConfigFromAPI() {
  if (typeof fetch === 'function') {
    console.log('Attempting to load Firebase config from API...');
    fetch('/api/firebase-config')
      .then(response => response.json())
      .then(config => {
        let configUpdated = false;
        
        Object.keys(config).forEach(key => {
          if (config[key]) {
            firebaseConfig[key] = config[key];
            // Update global context variables too
            if (key !== 'vapidKey') { // Don't use vapidKey in main config object
              globalContext[`FIREBASE_${key.toUpperCase()}`] = config[key];
            } else {
              globalContext.FIREBASE_VAPID_KEY = config[key];
            }
            configUpdated = true;
          }
        });
        
        console.log('Firebase config loaded from API:', 
          Object.keys(firebaseConfig).map(key => `${key}: ${firebaseConfig[key] ? '✓' : '✗'}`));
          
        if (configUpdated && firebaseConfig.projectId) {
          // Try to initialize again with the updated config
          initializeFirebase();
        }
      })
      .catch(error => {
        console.error('Failed to fetch Firebase config from API:', error);
      });
  }
}

// Execute immediately
initializeFirebase();

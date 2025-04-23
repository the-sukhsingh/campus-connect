// Import the necessary Firebase modules
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firebase Messaging - client-side only
let messaging;

// Function to check if messaging is supported in this browser/environment
export const isMessagingSupported = async () => {
  try {
    return await isSupported();
  } catch (error) {
    console.error('Error checking messaging support:', error);
    return false;
  }
};

// Function to initialize messaging if not already done
export const initializeMessaging = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const isSupported = await isMessagingSupported();
    if (!isSupported) {
      console.log('Firebase messaging is not supported in this environment');
      return null;
    }
    
    if (!messaging) {
      messaging = getMessaging(app);
      console.log('Firebase messaging initialized');
    }
    return messaging;
  } catch (error) {
    console.error('Error initializing messaging:', error);
    return null;
  }
};

// Function to request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      // Initialize messaging if needed
      await initializeMessaging();
      
      if (!messaging) {
        console.error('Failed to initialize messaging');
        return null;
      }

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Get FCM token with VAPID key
        console.log("Notification permission granted");
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
        });
        
        if (token) {
          console.log('FCM Token:', token);
          // Register the service worker if it hasn't been registered
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/firebase-messaging-sw.js')
              .then(registration => {
                console.log('Service worker registered for notifications');
              })
              .catch(err => {
                console.error('Service worker registration failed:', err);
              });
          }
          return token;
        } else {
          console.log('No registration token available.');
          return null;
        }
      } else {
        console.log('Notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }
  return null;
};

// Function to handle foreground messages
export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      initializeMessaging().then(msg => {
        if (msg) {
          onMessage(msg, (payload) => {
            console.log('Foreground message received:', payload);
            resolve(payload);
          });
        }
      });
    }
  });
};

export { app, auth, messaging };
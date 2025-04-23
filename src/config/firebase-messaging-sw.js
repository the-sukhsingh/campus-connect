// This file is used to initialize Firebase Cloud Messaging in the browser
// It's imported by the client-side components that need to receive messages

// Import required functions from Firebase
import { getMessaging, onMessage } from 'firebase/messaging';
import { app } from './firebase';

// Variable to hold the messaging instance
let messaging = null;

// Initialize Firebase Messaging
export const initMessaging = () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      messaging = getMessaging(app);
      console.log('Firebase Cloud Messaging initialized');
      return messaging;
    } catch (error) {
      console.error('Error initializing Firebase Messaging:', error);
      return null;
    }
  }
  return null;
};

// Function to listen for foreground messages
export const onForegroundMessage = (callback) => {
  if (!messaging) {
    messaging = initMessaging();
  }

  if (messaging) {
    return onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      callback(payload);
    });
  }

  return () => {}; // Return no-op function if messaging isn't available
};

export default {
  initMessaging,
  onForegroundMessage
};
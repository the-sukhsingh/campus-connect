// This script generates the firebase-config.js file with environment variables
const fs = require('fs');
const path = require('path');

// Create the firebase-config.js file content for both browser and service worker use
const firebaseConfig = `// This file is auto-generated. Do not edit directly.
// Generated on ${new Date().toISOString()}

// Make config accessible to both browser window and service worker contexts
const globalThis = self || window || {};

// Set config values as global variables for access in different contexts
globalThis.FIREBASE_API_KEY = "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}";
globalThis.FIREBASE_AUTH_DOMAIN = "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}";
globalThis.FIREBASE_PROJECT_ID = "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}";
globalThis.FIREBASE_STORAGE_BUCKET = "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}";
globalThis.FIREBASE_MESSAGING_SENDER_ID = "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}";
globalThis.FIREBASE_APP_ID = "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}";
globalThis.FIREBASE_VAPID_KEY = "${process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ''}";

// For compatibility with existing code that expects a firebaseConfig object
const firebaseConfig = {
  apiKey: globalThis.FIREBASE_API_KEY,
  authDomain: globalThis.FIREBASE_AUTH_DOMAIN,
  projectId: globalThis.FIREBASE_PROJECT_ID,
  storageBucket: globalThis.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: globalThis.FIREBASE_MESSAGING_SENDER_ID,
  appId: globalThis.FIREBASE_APP_ID
};
`;

// Write to public directory
const filePath = path.join(__dirname, '..', 'public', 'firebase-config.js');
fs.writeFileSync(filePath, firebaseConfig);

console.log('Firebase config updated successfully at: ' + filePath);
// API route to provide Firebase configuration to service worker
// This is necessary because service workers can't access window variables
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ''
  };

  return new Response(JSON.stringify(config), {
    headers: { 'Content-Type': 'application/json' }
  });
}
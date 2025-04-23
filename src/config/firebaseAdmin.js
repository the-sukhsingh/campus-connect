import admin from 'firebase-admin';
import dbConnect from '@/lib/dbConnect';
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Check if all required environment variables are available
    if (!process.env.FIREBASE_ADMIN_PROJECT_ID || 
        !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 
        !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      console.warn('Firebase Admin SDK initialization skipped: Missing environment variables');
    } else {
      const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

// Only export auth if initialization was successful
const firebaseAdmin = admin;
let auth = null;
let messaging = null;

try {
  if (admin.apps.length) {
    auth = admin.auth();
    messaging = admin.messaging();
  }
} catch (error) {
  console.error('Firebase Admin services initialization error:', error);
}

// Function to send push notification to a specific user token
const sendPushNotification = async (token, title, body, data = {}) => {
  if (!messaging) {
    console.error('Firebase Messaging not initialized');
    return false;
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        url: data.url || '/',
        createdAt: new Date().toISOString(),
      },
      token,
    };

    const response = await messaging.send(message);
    console.log('Successfully sent message:', response);
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
};

// Function to send push notification to multiple tokens
const sendMulticastPushNotification = async (tokens, title, body, data = {}) => {
  if (!messaging) {
    console.error('Firebase Messaging not initialized');
    return false;
  }

  if (!tokens || !tokens.length) {
    console.error('No tokens provided for push notification');
    return false;
  }

  try {
    // Filter out any obviously invalid tokens before sending
    const validTokens = tokens.filter(token => 
      typeof token === 'string' && token.length > 20
    );
    
    if (validTokens.length === 0) {
      console.error('No valid tokens to send notifications to');
      return false;
    }

    console.log(`Attempting to send notifications to ${validTokens.length} tokens`);
    let successCount = 0;
    let invalidTokens = [];
    
    // Process tokens in batches to avoid potential limitations
    const batchSize = 500; // Firebase has a limit on batch operations
    
    for (let i = 0; i < validTokens.length; i += batchSize) {
      const batch = validTokens.slice(i, i + batchSize);
      
      // Send messages in parallel
      const sendPromises = batch.map(token => {
        const message = {
          notification: {
            title,
            body,
          },
          data: {
            ...data,
            url: data.url || '/',
            createdAt: new Date().toISOString(),
          },
          token,
        };
        
        return messaging.send(message)
          .then(() => {
            successCount++;
            return { token, success: true };
          })
          .catch(error => {
            // Check if this is an invalid token that should be removed
            if (error.code === 'messaging/invalid-registration-token' || 
                error.code === 'messaging/registration-token-not-registered') {
              invalidTokens.push(token);
              console.log(`Invalid token detected: ${token.substring(0, 10)}...`);
            }
            return { token, success: false, error: error.message };
          });
      });
      
      const results = await Promise.all(sendPromises);
      console.log(`Batch results: ${results.filter(r => r.success).length} successes, ${results.filter(r => !r.success).length} failures`);
    }
    
    // If we detected invalid tokens, schedule them for cleanup
    if (invalidTokens.length > 0) {
      console.log(`Detected ${invalidTokens.length} invalid tokens to be removed`);
      try {
        // Import here to avoid circular dependencies
        const PushToken = (await import('../models/PushToken')).default;
        
        
        await dbConnect();
        
        // Remove the invalid tokens from the database
        const deleteResult = await PushToken.deleteMany({ token: { $in: invalidTokens } });
        console.log(`Removed ${deleteResult.deletedCount} invalid tokens from the database`);
      } catch (cleanupError) {
        console.error('Error cleaning up invalid tokens:', cleanupError);
      }
    }
    
    console.log(`${successCount} messages were sent successfully`);
    return successCount > 0;
  } catch (error) {
    console.error('Error sending multicast message:', error);
    return false;
  }
};

export { firebaseAdmin, auth, messaging, sendPushNotification, sendMulticastPushNotification };
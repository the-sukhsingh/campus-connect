import dbConnect from '@/lib/dbConnect';
import PushToken from '@/models/PushToken';
import User from '@/models/User';
import { sendMulticastPushNotification } from '@/config/firebaseAdmin';


// Save a new push notification token for a user
export async function saveUserToken(userId, token, deviceInfo = {}) {
  try {
    await dbConnect();
    
    // Get user details to store related info with the token
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Create or update token
    const tokenData = {
      userId,
      token,
      device: deviceInfo.device || 'web',
      lastUsed: new Date(),
      collegeId: user.collegeId,
      role: user.role,
      // Default topics based on user role
      topics: ['general', user.role]
    };
    
    // If user is in a college, add college-specific topic
    if (user.collegeId) {
      tokenData.topics.push(`college-${user.collegeId}`);
    }
    
    // Add or update the token
    const result = await PushToken.findOneAndUpdate(
      { userId, token },
      tokenData,
      { upsert: true, new: true }
    );
    
    return result;
  } catch (error) {
    console.error('Error saving user push token:', error);
    throw error;
  }
}

// Remove a token (when user logs out or unsubscribes)
export async function removeUserToken(userId, token) {
  try {
    await dbConnect();
    const result = await PushToken.deleteOne({ userId, token });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error removing user push token:', error);
    throw error;
  }
}

// Get all tokens for a specific user
export async function getUserTokens(userId) {
  try {
    await dbConnect();
    const tokens = await PushToken.find({ userId });
    return tokens;
  } catch (error) {
    console.error('Error getting user push tokens:', error);
    throw error;
  }
}

// Send notification to all users with a specific role
export async function sendNotificationToRole(role, title, body, data = {}) {
  try {
    await dbConnect();
    
    // Find all active tokens for the specified role
    const tokenDocs = await PushToken.find({ 
      role, 
      active: true 
    });
    
    if (!tokenDocs || tokenDocs.length === 0) {
      console.log(`No active tokens found for role: ${role}`);
      return false;
    }
    
    // Extract the token strings
    const tokens = tokenDocs.map(t => t.token);
    
    // Send the notification
    return await sendMulticastPushNotification(tokens, title, body, data);
  } catch (error) {
    console.error(`Error sending notification to role ${role}:`, error);
    return false;
  }
}

// Send notification to all users in a specific college
export async function sendNotificationToCollege(collegeId, title, body, data = {}, specificRole = null) {
  try {
    await dbConnect();
    
    // Build query based on inputs
    const query = { 
      collegeId: collegeId,
      active: true 
    };
    
    // Add role filter if specified
    if (specificRole) {
      query.role = specificRole;
    }
    
    // Find all active tokens for the specified college
    const tokenDocs = await PushToken.find(query);
    
    if (!tokenDocs || tokenDocs.length === 0) {
      console.log(`No active tokens found for college: ${collegeId}${specificRole ? ` and role: ${specificRole}` : ''}`);
      return false;
    }
    
    // Extract the token strings
    const tokens = tokenDocs.map(t => t.token);
    
    // Send the notification
    return await sendMulticastPushNotification(tokens, title, body, data);
  } catch (error) {
    console.error(`Error sending notification to college ${collegeId}:`, error);
    return false;
  }
}

// Send notification to all users in a specific class
export async function sendNotificationToClass(classId, title, body, data = {}) {
  try {
    await dbConnect();
    
    // Find class members (students and assigned faculty)
    const users = await User.find({
      $or: [
        { 'class': classId }, // Students in the class
        { 'classes': { $in: [classId] } }, // Teachers assigned to the class
      ]
    }).select('_id');
    
    if (!users || users.length === 0) {
      console.log(`No users found for class: ${classId}`);
      return false;
    }
    
    // Get the user IDs
    const userIds = users.map(u => u._id);
    
    // Find all active tokens for users in this class
    const tokenDocs = await PushToken.find({
      user: { $in: userIds },
      active: true
    });
    
    if (!tokenDocs || tokenDocs.length === 0) {
      console.log(`No active tokens found for users in class: ${classId}`);
      return false;
    }
    
    // Extract the token strings
    const tokens = tokenDocs.map(t => t.token);
    
    // Send the notification
    return await sendMulticastPushNotification(tokens, title, body, data);
  } catch (error) {
    console.error(`Error sending notification to class ${classId}:`, error);
    return false;
  }
}

// Send notification to a specific user
export async function sendNotificationToUser(userId, title, body, data = {}) {
  try {
    await dbConnect();
    
    // Find all active tokens for this user
    const tokenDocs = await PushToken.find({
      user: userId,
      active: true
    });
    
    if (!tokenDocs || tokenDocs.length === 0) {
      console.log(`No active tokens found for user: ${userId}`);
      return false;
    }
    
    // Extract the token strings
    const tokens = tokenDocs.map(t => t.token);
    
    // Send the notification
    return await sendMulticastPushNotification(tokens, title, body, data);
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
    return false;
  }
}

// Update token's last used timestamp
export async function updateTokenLastUsed(token) {
  try {
    await dbConnect();
    
    await PushToken.findOneAndUpdate(
      { token },
      { lastUsed: new Date() },
      { new: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error updating token last used:', error);
    return false;
  }
}

// Clean up inactive tokens (not used in the last 30 days)
export async function cleanupInactiveTokens(days = 30) {
  try {
    await dbConnect();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await PushToken.deleteMany({ lastUsed: { $lt: cutoffDate } });
    
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up inactive tokens:', error);
    throw error;
  }
}
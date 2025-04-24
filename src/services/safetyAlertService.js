import dbConnect from '@/lib/dbConnect';
import SafetyAlert from '@/models/SafetyAlert';
import { sendNotificationToCollege } from './notificationService';

// Create a new safety alert
export async function createSafetyAlert(data) {
  try {
    await dbConnect();
    const alert = await SafetyAlert.create(data);

    // Send immediate notification to everyone in the college
    const notificationData = {
      type: 'safety_alert',
      alertId: alert._id.toString(),
      severity: alert.severity,
      url: `/dashboard/safety-alerts`,
    };

    // Send push notification to all users in the college
    await sendNotificationToCollege(
      alert.collegeId,
      `🚨 Safety Alert: ${alert.title}`,
      alert.description,
      notificationData
    );

    return alert;
  } catch (error) {
    console.error('Error creating safety alert:', error);
    throw error;
  }
}

// Get all active safety alerts for a college
export async function getActiveSafetyAlerts(collegeId) {
  try {
    await dbConnect();
    return await SafetyAlert.find({ 
      collegeId, 
      status: 'active' 
    })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name role');
  } catch (error) {
    console.error('Error getting active safety alerts:', error);
    throw error;
  }
}

// Get all safety alerts for a college with optional status filter
export async function getSafetyAlerts(collegeId, status) {
  try {
    await dbConnect();
    const query = { collegeId };
    if (status) {
      query.status = status;
    }
    return await SafetyAlert.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'displayName role')
      .populate('resolvedBy', 'displayName role');
  } catch (error) {
    console.error('Error getting safety alerts:', error);
    throw error;
  }
}

// Get a specific safety alert by ID
export async function getSafetyAlertById(alertId) {
  try {
    await dbConnect();
    return await SafetyAlert.findById(alertId)
      .populate('createdBy', 'name role')
      .populate('resolvedBy', 'name role');
  } catch (error) {
    console.error('Error getting safety alert:', error);
    throw error;
  }
}

// Update a safety alert
export async function updateSafetyAlert(alertId, updates) {
  try {
    await dbConnect();
    const alert = await SafetyAlert.findByIdAndUpdate(
      alertId,
      updates,
      { new: true }
    ).populate('createdBy', 'name role');

    // If alert was resolved, send notification
    if (updates.status === 'resolved') {
      const notificationData = {
        type: 'safety_alert_resolved',
        alertId: alert._id.toString(),
        url: `/dashboard/safety-alerts/`,
      };

      await sendNotificationToCollege(
        alert.collegeId,
        '✅ Safety Alert Resolved',
        `The safety alert "${alert.title}" has been marked as resolved.`,
        notificationData
      );
    }

    return alert;
  } catch (error) {
    console.error('Error updating safety alert:', error);
    throw error;
  }
}
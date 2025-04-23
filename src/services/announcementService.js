import dbConnect from '@/lib/dbConnect';
import Announcement from '@/models/Announcement';
import Class from '@/models/Class';
import { 
  sendNotificationToCollege,
  sendNotificationToClass,
  sendNotificationToRole
} from './notificationService';

// Create a new announcement
export async function createAnnouncement(announcementData) {
  try {
    await dbConnect();
    const announcement = new Announcement(announcementData);
    await announcement.save();
    
    // Send push notifications based on the announcement type
    await sendAnnouncementNotifications(announcement);
    
    return announcement;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
}

// Send push notifications based on the type of announcement
async function sendAnnouncementNotifications(announcement) {
  try {
    const title = announcement.title;
    const body = announcement.content || 'New announcement available';
    const data = {
      announcementId: announcement._id.toString(),
      url: `/`,
      type: 'announcement',
      createdAt: announcement.createdAt.toISOString()
    };
    
    // Class-specific announcement
    if (announcement.classId) {
      await sendNotificationToClass(
        announcement.classId,
        title,
        body,
        data
      );
    }
    // College-specific announcement
    else if (announcement.collegeId) {
      await sendNotificationToCollege(
        announcement.collegeId,
        title,
        body,
        data
      );
    }
    // General announcement (for all users)
    else {
      // Send to all roles if no specific targeting
      const roles = ['student', 'faculty', 'admin', 'hod', 'librarian'];
      for (const role of roles) {
        await sendNotificationToRole(role, title, body, data);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending announcement notifications:', error);
    // Don't throw the error, just log it to prevent blocking the announcement creation
    return false;
  }
}

// Get all announcements (for homepage and general viewing)
export async function getAllAnnouncements(limit = 10, collegeId = null, userId = null, userRole = null) {
  try {
    await dbConnect();
    
    const currentDate = new Date();
    
    // Build query - filter by expiry date and optionally by college
    const query = {
      $or: [
        { expiryDate: { $gt: currentDate } },
        { expiryDate: { $exists: false } } // To handle announcements created before adding expiryDate
      ]
    };
    
    // If collegeId is provided, add college filter
    if (collegeId) {
      query.collegeId = collegeId;
    }
    
    // If we have userId, get the classes relevant to the user based on role
    let userClasses = [];
    if (userId) {
      if (['faculty', 'hod'].includes(userRole)) {
        // For faculty/HOD: Get classes they teach or are assigned to
        const classes = await Class.find({
          $or: [
            { teacher: userId }, // Classes they created
            { 'facultyAssignments.faculty': userId } // Classes they are assigned to
          ]
        }).select('_id');
        
        userClasses = classes.map(cls => cls._id.toString());
      } 
      else if (userRole === 'student') {
        // For students: Get classes they are enrolled in with approved status
        const classes = await Class.find({
          'students.student': userId,
          'students.status': 'approved'
        }).select('_id');
        
        userClasses = classes.map(cls => cls._id.toString());
      }
    }
    
    // Final query that combines all conditions
    let finalQuery;
    
    if (userId) {
      // For faculty/HOD users: See general announcements, their class announcements, and own announcements
      if (['faculty', 'hod'].includes(userRole) && userClasses.length > 0) {
        finalQuery = {
          $and: [
            query, // Original time/college filters
            {
              $or: [
                { classId: null }, // Announcements not specific to any class
                { classId: { $in: userClasses } }, // Announcements for their classes
                { createdBy: userId } // Announcements created by them
              ]
            }
          ]
        };
      }
      // For students: See general announcements, announcements for classes they're enrolled in, and own announcements
      else if (userRole === 'student' && userClasses.length > 0) {
        finalQuery = {
          $and: [
            query, // Original time/college filters
            {
              $or: [
                { classId: null }, // General announcements
                { classId: { $in: userClasses } }, // Announcements for their enrolled classes
                { createdBy: userId } // Announcements created by them (unlikely but possible)
              ]
            }
          ]
        };
      }
      // For other roles (librarian, etc.): Only show general announcements and own announcements
      else {
        finalQuery = {
          $and: [
            query, // Original time/college filters
            {
              $or: [
                { classId: null }, // Only general announcements
                { createdBy: userId } // Or announcements created by them
              ]
            }
          ]
        };
      }
    } else {
      // For unauthenticated users: Only show general announcements
      finalQuery = {
        $and: [
          query,
          { classId: null } // Only general announcements
        ]
      };
    }
    
    const announcements = await Announcement.find(finalQuery)
      .populate({
        path: 'createdBy',
        select: 'displayName email role department'
      })
      .populate({
        path: 'classId',
        select: 'name department semester'
      })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(limit);
    
    return announcements;
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    throw error;
  }
}

// Get announcements created by a faculty member
export async function getAnnouncementsByFaculty(facultyId) {
  try {
    await dbConnect();
    
    const currentDate = new Date();
    
    const announcements = await Announcement.find({
      createdBy: facultyId,
      $or: [
        { expiryDate: { $gt: currentDate } },
        { expiryDate: { $exists: false } }
      ]
    })
    .populate({
      path: 'createdBy',
      select: 'displayName email role department'
    })
    .sort({ createdAt: -1 }); // Most recent first
    
    return announcements;
  } catch (error ) {
    console.error('Error fetching faculty announcements:', error);
    throw error;
  }
}

// Get all announcements for a specific college (for HOD view)
export async function getAnnouncementsByCollege(collegeId){
  try {
    await dbConnect();
    const announcements = await Announcement.find({
      collegeId: collegeId
    })
    .populate({
      path: 'createdBy',
      select: 'displayName email role department'
    })
    .sort({ createdAt: -1 }); // Most recent first
    
    return announcements;
  } catch (error ) {
    console.error('Error fetching college announcements:', error);
    throw error;
  }
}

// Get announcements for a specific class
export async function getAnnouncementsByClass(classId) {
  try {
    await dbConnect();
    
    const currentDate = new Date();
    
    const announcements = await Announcement.find({
      classId: classId,
      $or: [
        { expiryDate: { $gt: currentDate } },
        { expiryDate: { $exists: false } }
      ]
    })
    .populate({
      path: 'createdBy',
      select: 'displayName email role department'
    })
    .populate({
      path: 'classId',
      select: 'name department semester batch'
    })
    .sort({ createdAt: -1 }); // Most recent first
    
    return announcements;
  } catch (error) {
    console.error('Error fetching class announcements:', error);
    throw error;
  }
}

// Get a specific announcement by ID
export async function getAnnouncementById(announcementId) {
  try {
    await dbConnect();
    
    const announcement = await Announcement.findById(announcementId)
      .populate({
        path: 'createdBy',
        select: 'displayName email role department'
      });
    
    return announcement;
  } catch (error ) {
    console.error('Error fetching announcement by ID:', error);
    throw error;
  }
}

// Delete an announcement
export async function deleteAnnouncement(announcementId, userId, isHod = false) {
  try {
    await dbConnect();
    
    // If HOD, allow deletion of any announcement in their college
    let query = { _id: announcementId };
    if (!isHod) {
      query.createdBy = userId;
    }
    
    const result = await Announcement.deleteOne(query);
    
    return result.deletedCount > 0;
  } catch (error ) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
}

// Update an announcement
export async function updateAnnouncement(
  announcementId, 
  userId, 
  updateData,
  isHod = false
) {
  try {
    await dbConnect();
    
    let query = { _id: announcementId, createdBy: userId };
    
    // If not HOD, only allow the creator to update
    if (!isHod) {
      query = { ...query, createdBy: userId };
    }
    
    const announcement = await Announcement.findOneAndUpdate(
      query,
      updateData,
      { new: true }
    );
    
    return announcement;
  } catch (error ) {
    console.error('Error updating announcement:', error);
    throw error;
  }
}

// Clean up expired announcements (can be scheduled or run manually)
export async function cleanupExpiredAnnouncements() {
  try {
    await dbConnect();
    const currentDate = new Date();
    
    const result = await Announcement.deleteMany({
      expiryDate: { $lt: currentDate }
    });
    
    return result.deletedCount;
  } catch (error ) {
    console.error('Error cleaning up expired announcements:', error);
    throw error;
  }
}
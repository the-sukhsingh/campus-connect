import dbConnect from '@/lib/dbConnect';
import Announcement, { IAnnouncement } from '@/models/Announcement';
import { Types } from 'mongoose';

// Create a new announcement
export async function createAnnouncement(announcementData) {
  try {
    await dbConnect();
    const announcement = new Announcement(announcementData);
    await announcement.save();
    return announcement;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
}

// Get all announcements (for homepage and general viewing)
export async function getAllAnnouncements(limit = 10) {
  try {
    await dbConnect();
    
    const currentDate = new Date();
    
    const announcements = await Announcement.find({
      // Only show announcements that have not expired
      $or: [
        { expiryDate: { $gt: currentDate } },
        { expiryDate: { $exists: false } } // To handle announcements created before adding expiryDate
      ]
    })
      .populate({
        path: 'createdBy',
        select: 'displayName email role department'
      })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(limit);
    
    return announcements;
  } catch (error ) {
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
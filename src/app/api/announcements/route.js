import { NextResponse } from 'next/server';
import { 
  createAnnouncement, 
  getAnnouncementsByFaculty,
  getAnnouncementsByCollege, 
  getAllAnnouncements, 
  getAnnouncementById,
  deleteAnnouncement, 
  updateAnnouncement,
  cleanupExpiredAnnouncements
} from '@/services/announcementService';
import { getUserByFirebaseUid } from '@/services/userService';

export async function GET(request) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const firebaseUid = searchParams.get('uid');
    const announcementId = searchParams.get('id');
    const collegeId = searchParams.get('collegeId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : 10;
    
    // Automatically cleanup expired announcements
    await cleanupExpiredAnnouncements();
    
    // For all announcements, we don't need to check user
    if (action === 'get-all') {
      const announcements = await getAllAnnouncements(limit);
      return NextResponse.json({ announcements });
    }
    
    // For other actions requiring user auth
    if (!firebaseUid) {
      console.log("UID is missing");
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Handle different actions
    if (action === 'get-my-announcements' && ['faculty', 'hod'].includes(dbUser.role)) {
      // Get announcements created by this faculty member
      const announcements = await getAnnouncementsByFaculty(dbUser._id.toString());
      return NextResponse.json({ announcements });
    } 
    else if (action === 'get-college-announcements' && dbUser.role === 'hod' && dbUser.college) {
      // Get all announcements for this HOD's college
      const collegeIdToUse = collegeId || dbUser.college.toString();
      const announcements = await getAnnouncementsByCollege(collegeIdToUse);
      return NextResponse.json({ announcements });
    }
    else if (action === 'get-by-id' && announcementId) {
      // Get a specific announcement by ID
      const announcement = await getAnnouncementById(announcementId);
      if (!announcement) {
        return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
      }
      return NextResponse.json({ announcement });
    }
    else {
      console.log("Invalid action or user role");
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { firebaseUid, action, announcement, announcementId } = body;
    
    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      );
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if the user is a faculty or HOD
    if (!['faculty', 'hod'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const isHod = dbUser.role === 'hod';
    
    // Handle different actions
    if (action === 'create') {
      if (!announcement || !announcement.title || !announcement.content) {
        return NextResponse.json(
          { error: 'Announcement title and content are required' }, 
          { status: 400 }
        );
      }
      
      // Create new announcement
      const newAnnouncement = await createAnnouncement({
        title: announcement.title,
        content: announcement.content,
        createdBy: dbUser._id.toString(),
        collegeId: dbUser.college || null,
        expiryDate: announcement.expiryDate || undefined
      });
      
      return NextResponse.json({ 
        success: true, 
        announcement: newAnnouncement 
      });
    } 
    else if (action === 'update') {
      if (!announcementId || !announcement || !announcement.title || !announcement.content) {
        return NextResponse.json(
          { error: 'Announcement ID, title, and content are required' }, 
          { status: 400 }
        );
      }
      
      // Update announcement
      const updatedAnnouncement = await updateAnnouncement(
        announcementId,
        dbUser._id.toString(),
        {
          title: announcement.title,
          content: announcement.content,
          expiryDate: announcement.expiryDate
        },
        isHod
      );
      
      if (!updatedAnnouncement) {
        return NextResponse.json(
          { error: 'Announcement not found or you do not have permission to update it' }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        announcement: updatedAnnouncement 
      });
    } 
    else if (action === 'delete') {
      if (!announcementId) {
        return NextResponse.json(
          { error: 'Announcement ID is required' }, 
          { status: 400 }
        );
      }

      
      // Delete announcement (HOD can delete any announcement in their college)
      const deleted = await deleteAnnouncement(
        announcementId,
        dbUser._id.toString(),
        isHod
      );
      
      if (!deleted) {
        return NextResponse.json(
          { error: 'Announcement not found or you do not have permission to delete it' }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true
      });
    }
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { getCollegeByUser, getTeachersByCollege, getPendingTeachersByCollege, updateTeacherStatus } from '@/services/collegeService';
import { getClassesByFaculty } from '@/services/classService';

// GET: Fetch teachers for a college
export async function GET(request) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    const collegeId = request.nextUrl.searchParams.get('collegeId');
    const action = request.nextUrl.searchParams.get('action');
    
    if (!uid) {
      return NextResponse.json(
        { error: 'UID is required' },
        { status: 400 }
      );
    }

    const user = await getUserByFirebaseUid(uid);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'hod' && user.role !== 'faculty') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // If action is to fetch assigned classes for a faculty
    if (action === 'assigned-classes') {
      // Get assigned classes for the faculty
      const result = await getClassesByFaculty(uid);
      return NextResponse.json(result);
    }

    // If no collegeId is provided, fetch the HOD's college
    let college;
    if (!collegeId) {
      college = await getCollegeByUser(user._id.toString());
      if (!college) {
        return NextResponse.json(
          { error: 'College not found' },
          { status: 404 }
        );
      }
    }

    // Use provided collegeId or the one from the HOD's college
    const finalCollegeId = collegeId || college._id.toString();
    
    if (action === 'pending') {
      // Fetch pending teacher requests
      const pendingRequests = await getPendingTeachersByCollege(finalCollegeId);
      return NextResponse.json({ pendingRequests });
    } else {
      // Fetch all approved teachers
      const teachers = await getTeachersByCollege(finalCollegeId);
      return NextResponse.json({ teachers });
    }
    
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

// PATCH: Approve or reject a teacher's request to join a college
export async function PATCH(request) {
  try {
    const { firebaseUid, collegeId, teacherId, action, department, isLibrarian } = await request.json();
    
    if (!firebaseUid || !collegeId || !teacherId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    const user = await getUserByFirebaseUid(firebaseUid);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    };

    if (user.role !== 'hod') {
      return NextResponse.json(
        { error: 'Unauthorized. Only HODs can manage teacher requests' },
        { status: 403 }
      );
    }

    // Verify the HOD has permission for this college
    const hodCollege = await getCollegeByUser(user._id.toString());
    if (!hodCollege || hodCollege._id.toString() !== user.college.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized. You are not the HOD of this college' },
        { status: 403 }
      );
    }

    // Update teacher's status in the college
    const status = action === 'approve' ? 'approve' : 'reject';
    
    // Only pass department and isLibrarian when approving a teacher
    const result = action === 'approve' 
      ? await updateTeacherStatus(collegeId, teacherId, status, department, isLibrarian)
      : await updateTeacherStatus(collegeId, teacherId, status);
    
    return NextResponse.json({
      success: true,
      message: `Teacher ${action}d successfully${isLibrarian ? ' and assigned as librarian' : ''}`,
      result
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to update teacher status' },
      { status: 500 }
    );
  }
}
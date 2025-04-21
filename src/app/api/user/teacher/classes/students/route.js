import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { getClassById, updateStudentStatus } from '@/services/classService';

// GET: Fetch pending student requests for a class
export async function GET(request) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    const classId = request.nextUrl.searchParams.get('classId');
    const status = request.nextUrl.searchParams.get('status') || 'pending';
    
    if (!uid || !classId) {
      return NextResponse.json(
        { error: 'User ID and Class ID are required' },
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

    if (user.role !== 'faculty' && user.role !== 'hod') {
      return NextResponse.json(
        { error: 'Unauthorized. Only teachers can view student requests' },
        { status: 403 }
      );
    }

    // Get class info to verify teacher is associated with the class
    const classInfo = await getClassById(classId);
    if (!classInfo) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }
    
    // Check if teacher is associated with this class
    if (classInfo.teacher._id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized. You are not the teacher for this class' },
        { status: 403 }
      );
    }

    // Get student requests for this class with the specified status
    const students = await getStudentRequestsForClass(classId, status);
    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error('Error fetching student requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch student requests' },
      { status: 500 }
    );
  }
}

// PATCH: Approve or reject a student's request to join a class
export async function PATCH(request) {
  try {
    const { firebaseUid, classId, studentId, action } = await request.json();
    
    if (!firebaseUid || !classId || !studentId || !action) {
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
    }

    if (user.role !== 'faculty' && user.role !== 'hod') {
      return NextResponse.json(
        { error: 'Unauthorized. Only teachers can manage student requests' },
        { status: 403 }
      );
    }

    // Get class info to verify teacher is associated with the class
    const classInfo = await getClassById(classId);
    if (!classInfo) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }


    // Check if teacher created this class
    if (classInfo.teacher._id.toString() != user._id.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized. You are not the teacher for this class' },
        { status: 403 }
      );
    }

    // Update student status in the class
    const status = action === 'approve' ? 'approve' : 'reject';
    const result = await updateStudentStatus(classId, studentId, status);
    
    return NextResponse.json({
      success: true,
      message: `Student ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      result
    });
    
  } catch (error) {
    console.error('Error updating student status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update student status' },
      { status: 500 }
    );
  }
}
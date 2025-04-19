import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { getCollegeByUniqueId } from '@/services/collegeService';
import { registerTeacher, getTeacherCollegeStatus } from '@/services/teacherService';

// GET: Get college information for a teacher
export async function GET(request) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    
    if (!uid) {
      return NextResponse.json(
        { error: 'Firebase UID is required' },
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
        { error: 'Unauthorized. Only teachers can access this endpoint' },
        { status: 403 }
      );
    }

    // Get the teacher's college information and status
    const { college, status } = await getTeacherCollegeStatus(user._id.toString());
    
    return NextResponse.json({
      success: true,
      college,
      status
    });
    
  } catch (error) {
    console.error('Error fetching teacher college information:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch college information' },
      { status: 500 }
    );
  }
}

// POST: Join a college using a college unique ID
export async function POST(request) {
  try {
    const { firebaseUid, collegeUniqueId } = await request.json();
    
    if (!firebaseUid || !collegeUniqueId) {
      return NextResponse.json(
        { error: 'User ID and college ID are required' },
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
        { error: 'Unauthorized. Only teachers can join colleges' },
        { status: 403 }
      );
    }

    // Check if the college exists with this unique ID
    const college = await getCollegeByUniqueId(collegeUniqueId);
    if (!college) {
      return NextResponse.json(
        { error: 'College not found. Please check the college ID and try again' },
        { status: 404 }
      );
    }

    // Register the teacher with this college
    const result = await registerTeacher(user._id.toString(), collegeUniqueId);
    
    return NextResponse.json({
      success: true,
      message: 'Request to join college submitted. Waiting for HOD approval.',
      college: {
        _id: college._id,
        name: college.name,
        uniqueId: college.uniqueId
      }
    });
    
  } catch (error) {
    console.error('Error joining college:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join college' },
      { status: 500 }
    );
  }
}
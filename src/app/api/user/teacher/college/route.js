import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
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

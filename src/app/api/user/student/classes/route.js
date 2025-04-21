import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { getClassesForStudent } from '@/services/studentService';

// GET: Fetch classes that a student is enrolled in
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
    
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized. Only students can access this endpoint' },
        { status: 403 }
      );
    }

    const classes = await getClassesForStudent(user._id.toString());
    return NextResponse.json({ success: true, classes });
  } catch (error) {
    console.error('Error fetching student classes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

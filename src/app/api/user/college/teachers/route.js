import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { getCollegeByUser, getTeachersByCollege} from '@/services/collegeService';
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
    

      // Fetch all approved teachers
      const teachers = await getTeachersByCollege(finalCollegeId);
      return NextResponse.json({ teachers });
  
    
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}


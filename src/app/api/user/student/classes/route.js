import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { getClassByUniqueId, requestToJoinClass } from '@/services/classService';
import { joinClass, getClassesForStudent } from '@/services/studentService';

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

// POST: Join a class using unique ID
export async function POST(request) {
  try {
    const { firebaseUid, classUniqueId } = await request.json();
    
    if (!firebaseUid || !classUniqueId) {
      return NextResponse.json(
        { error: 'User ID and class ID are required' },
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

    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized. Only students can join classes' },
        { status: 403 }
      );
    }

    // Check if student is already enrolled or has pending requests in any class
    const existingClasses = await getClassesForStudent(user._id.toString());
    
    // If the student is already in a class or has a pending request, prevent joining another one
    if (existingClasses && existingClasses.length > 0) {
      return NextResponse.json(
        { error: 'You can only join one class. You are already enrolled in or have a pending request for a class.' },
        { status: 400 }
      );
    }

    const result = await requestToJoinClass(user._id.toString(), classUniqueId);
    
    return NextResponse.json({
      success: true,
      message: 'Request to join class submitted. Waiting for teacher approval.',
      class: result
    });
    
  } catch (error) {
    console.error('Error joining class:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join class' },
      { status: 500 }
    );
  }
}
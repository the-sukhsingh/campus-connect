import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Class from '@/models/Class';
import User from '@/models/User';
import College from '@/models/College';
import { getUserByFirebaseUid } from '@/services/userService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const collegeId = searchParams.get('collegeId');

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!collegeId) {
      return NextResponse.json({ error: 'College ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Verify the user is a HOD and belongs to the college
    const user = await getUserByFirebaseUid(uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'hod') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if user is HOD of this college
    const college = await College.findOne({ 
      _id: collegeId
    });

    if (!college) {
      return NextResponse.json({ error: 'College not found or user is not authorized' }, { status: 403 });
    }

    // Get all classes for the college
    const classes = await Class.find({ college: collegeId })
      .populate({
        path: 'students.student',
        select: 'displayName rollNo email',
      })
      .populate('teacher', 'displayName email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ classes });
  } catch (error ) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { getUserByFirebaseUid, getUsersByCollege } from '@/services/userService';
import { getCollegeByUser } from '@/services/collegeService';

export async function GET(request) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    
    if (!uid) {
      return NextResponse.json(
        { error: 'HOD ID is required' },
        { status: 400 }
      );
    }

    const userDb = await getUserByFirebaseUid(uid);
    if (!userDb) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    
    const college = await getCollegeByUser(uid);
    return NextResponse.json({
      success: true,
      college,
      message: 'College fetched successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { collegeId, role } = await request.json();
    
    if (!collegeId) {
      return NextResponse.json(
        { error: 'College ID is required' },
        { status: 400 }
      );
    }
    
    const users = await getUsersByCollege(collegeId, role);
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
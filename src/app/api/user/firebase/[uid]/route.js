import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';

export async function GET(request, { params }) {
  try {
    const { uid } = await params;
    const user = await getUserByFirebaseUid(uid);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Format the response properly to include all user fields
    return NextResponse.json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      firebaseUid: user.firebaseUid,
      college: user.college,
      isVerified: user.isVerified,
      isFirstLogin: user.isFirstLogin,
      passwordChanged: user.passwordChanged,
      // Include all other relevant fields
      department: user.department,
      rollNo: user.rollNo,
      studentId: user.studentId,
      currentSemester: user.currentSemester,
      batch: user.batch,
      collegeStatus: user.collegeStatus,
      verificationMethod: user.verificationMethod,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
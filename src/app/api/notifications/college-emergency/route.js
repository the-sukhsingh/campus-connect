import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { sendNotificationToCollege } from '@/services/notificationService';

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { firebaseUid, collegeId, title, body: messageBody, data } = body;

    // Check required fields
    if (!firebaseUid || !collegeId || !title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }


    // Get the user from the database
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the user is a faculty or HOD
    if (user.role !== 'faculty' && user.role !== 'hod') {
      return NextResponse.json(
        { error: 'Unauthorized. Only faculty members can send emergency notifications' },
        { status: 403 }
      );
    }

    // Check if this user belongs to the specified college
    if (!user.college || user.college.toString() !== collegeId) {
      return NextResponse.json(
        { error: 'You are not authorized to send notifications to this college' },
        { status: 403 }
      );
    }

    // Send notification to all users in the college
    const result = await sendNotificationToCollege(collegeId, title, messageBody, data);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'College-wide emergency notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending college-wide emergency notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
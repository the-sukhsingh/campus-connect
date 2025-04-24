import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { sendNotificationToClass } from '@/services/notificationService';

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { firebaseUid, classId, title, body: messageBody, data } = body;

    // Check required fields
    if (!firebaseUid || !classId || !title || !messageBody) {
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
        { error: 'Unauthorized. Only faculty members can send notifications to classes' },
        { status: 403 }
      );
    }

    // Check if the class exists in the user's classes
    const isAssociated = user.classes && user.classes.some(c => c.toString() === classId);
    if (!isAssociated) {
      return NextResponse.json(
        { error: 'You are not associated with this class' },
        { status: 403 }
      );
    }

    // Send notification to all users in the class
    const result = await sendNotificationToClass(classId, title, messageBody, data);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Custom notification sent successfully to the class'
    });
  } catch (error) {
    console.error('Error sending custom class notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
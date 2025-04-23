import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getUserByFirebaseUid } from '@/services/userService';
import PushToken from '@/models/PushToken';

// GET endpoint to check subscription status
export async function GET(request) {
  try {
    // Get the firebaseUid from query params
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get('firebaseUid');

    if (!firebaseUid) {
      return NextResponse.json({ error: 'Firebase UID is required' }, { status: 400 });
    }

    // Connect to DB
    await dbConnect();

    // Get user from Firebase UID
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is faculty or HOD
    if (!['faculty', 'hod', 'librarian', 'student'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if user has an active token
    const tokenExists = await PushToken.exists({
      user: user._id,
      active: true
    });

    return NextResponse.json({ subscribed: !!tokenExists });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json({ 
      error: 'Failed to check subscription status',
      details: error.message
    }, { status: 500 });
  }
}

// POST endpoint to subscribe/unsubscribe
export async function POST(request) {
  try {
    const { firebaseUid, token, role, action } = await request.json();
    console.log('Received data:', { firebaseUid, token, role, action });
    if (!firebaseUid || !token || !role || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate action
    if (!['subscribe', 'unsubscribe'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Use "subscribe" or "unsubscribe"' 
      }, { status: 400 });
    }

    // Connect to DB
    await dbConnect();

    // Get user from Firebase UID
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is faculty, HOD, librarian, or student
    if (!['faculty', 'hod', 'librarian', 'student'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Process the subscription action
    if (action === 'subscribe') {
      // Check if token already exists
      const existingToken = await PushToken.findOne({ token });
      
      if (existingToken) {
        // Update existing token to associate with this user
        existingToken.user = user._id;
        existingToken.role = user.role;
        existingToken.collegeId = user.college;
        existingToken.active = true;
        existingToken.updatedAt = new Date();
        await existingToken.save();
      } else {
        // Create new token
        await PushToken.create({
          token,
          user: user._id,
          role: user.role,
          collegeId: user.college,
          active: true
        });
      }
      
      return NextResponse.json({ 
        message: 'Successfully subscribed to notifications',
        subscribed: true
      });
    } else {
      // Unsubscribe - deactivate all tokens for this user
      await PushToken.updateMany(
        { user: user._id },
        { $set: { active: false, updatedAt: new Date() } }
      );
      
      return NextResponse.json({ 
        message: 'Successfully unsubscribed from notifications',
        subscribed: false
      });
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to update subscription',
      details: error.message
    }, { status: 500 });
  }
}
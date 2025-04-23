import { auth } from '@/config/firebaseAdmin';
import { NextResponse } from 'next/server';
import { saveUserToken, removeUserToken, getUserTokens } from '@/services/notificationService';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

// POST - Save a new FCM token
export async function POST(request) {
  try {
    const { token, device } = await request.json();
    console.log("TOkenand device", token, device);
    if (!token) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      );
    }
    
    // Get Firebase ID token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token format' },
        { status: 401 }
      );
    }
    
    const firebaseToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(firebaseToken);
    
    if (!decodedToken || !decodedToken.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Find the user in database
    await dbConnect();
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Save the FCM token
    const savedToken = await saveUserToken(user._id, token, { device });
    
    return NextResponse.json({
      message: 'Push token saved successfully',
      token: savedToken
    });
  } catch (error) {
    console.error('Error saving push token:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove FCM token
export async function DELETE(request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      );
    }
    
    // Get Firebase ID token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token format' },
        { status: 401 }
      );
    }
    
    const firebaseToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(firebaseToken);
    
    if (!decodedToken || !decodedToken.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Find the user in database
    await dbConnect();
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove the FCM token
    const removed = await removeUserToken(user._id, token);
    
    return NextResponse.json({
      message: removed ? 'Push token removed successfully' : 'Push token not found',
      success: removed
    });
  } catch (error) {
    console.error('Error removing push token:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get all registered tokens for the user
export async function GET(request) {
  try {
    // Get Firebase ID token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token format' },
        { status: 401 }
      );
    }
    
    const firebaseToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(firebaseToken);
    
    if (!decodedToken || !decodedToken.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Find the user in database
    await dbConnect();
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get all tokens for this user
    const tokens = await getUserTokens(user._id);
    
    return NextResponse.json({
      tokens: tokens.map(t => ({
        id: t._id,
        token: t.token,
        device: t.device,
        lastUsed: t.lastUsed
      }))
    });
  } catch (error) {
    console.error('Error getting push tokens:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
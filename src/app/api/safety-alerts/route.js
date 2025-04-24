import { auth } from '@/config/firebaseAdmin';
import { NextResponse } from 'next/server';
import { createSafetyAlert, getSafetyAlerts } from '@/services/safetyAlertService';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

// POST - Create a new safety alert
export async function POST(request) {
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
    const decodedToken = await auth.verifyIdToken(firebaseToken);
    
    if (!decodedToken || !decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find the user in database
    await dbConnect();
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to create safety alerts
    if (!['faculty', 'hod', 'librarian'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized - Insufficient permissions' }, { status: 403 });
    }

    const { title, description, severity } = await request.json();

    // Validate required fields
    if (!title || !description || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the safety alert
    const alert = await createSafetyAlert({
      title,
      description,
      severity,
      createdBy: user._id,
      collegeId: user.college
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error creating safety alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get all safety alerts for the user's college
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
    const decodedToken = await auth.verifyIdToken(firebaseToken);
    
    if (!decodedToken || !decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find the user in database
    await dbConnect();
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get status from query params if provided
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get safety alerts
    const alerts = await getSafetyAlerts(user.college, status);

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error getting safety alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
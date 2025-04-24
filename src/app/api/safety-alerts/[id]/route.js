import { auth } from '@/config/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getSafetyAlertById, updateSafetyAlert } from '@/services/safetyAlertService';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

// GET - Get a specific safety alert
export async function GET(request, { params }) {
  try {
    const id = (await params).id;
    
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

    // Get the alert
    const alert = await getSafetyAlertById(id);
    
    if (!alert) {
      return NextResponse.json({ error: 'Safety alert not found' }, { status: 404 });
    }

    // Verify the user belongs to the same college
    if (alert.collegeId.toString() !== user.college.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error getting safety alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update a safety alert
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    
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

    // Check if user has permission to update safety alerts
    if (!['faculty', 'hod', 'librarian'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized - Insufficient permissions' }, { status: 403 });
    }

    // Get the alert first
    const existingAlert = await getSafetyAlertById(id);
    
    if (!existingAlert) {
      return NextResponse.json({ error: 'Safety alert not found' }, { status: 404 });
    }

    // Verify the user belongs to the same college
    if (existingAlert.collegeId.toString() !== user.college.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updates = await request.json();
    
    // If marking as resolved, add resolver info
    if (updates.status === 'resolved') {
      updates.resolvedAt = new Date();
      updates.resolvedBy = user._id;
    }

    // Update the alert
    const updatedAlert = await updateSafetyAlert(id, updates);

    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error('Error updating safety alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
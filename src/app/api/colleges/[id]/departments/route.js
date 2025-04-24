import { NextResponse } from 'next/server';
import { auth } from '@/config/firebaseAdmin';
import dbConnect from '@/lib/dbConnect';
import College from '@/models/College';

/**
 * @route GET /api/colleges/:id/departments
 * @desc Get departments of a specific college
 * @access Private
 */
export async function GET(request, { params }) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    try {
      await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Connect to database
    await dbConnect();
    
    // Get college ID from params
    const { id } = params;
    
    // Find college
    const college = await College.findById(id);
    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      departments: college.departments || [] 
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
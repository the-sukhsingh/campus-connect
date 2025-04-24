import { NextResponse } from 'next/server';
import { auth } from '@/config/firebaseAdmin';
import dbConnect from '@/lib/dbConnect';
import College from '@/models/College';
import Class from '@/models/Class';

/**
 * @route GET /api/colleges/:id/classes
 * @desc Get classes of a specific college with optional department filter
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
    const { id } = await params;
    
    // Check if department filter is provided
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    
    // Build query
    const query = { college: id, active: true };
    if (department) {
      query.department = department;
    }
    
    // Find classes
    const classes = await Class.find(query)
      .select('_id name department semester course batch')
      .lean();
    
    return NextResponse.json({ 
      success: true, 
      classes 
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting classes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
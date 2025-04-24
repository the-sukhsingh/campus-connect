import { auth } from '@/config/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { getNotes } from '@/services/noteService';
import dbConnect from '@/lib/dbConnect';

// GET - Fetch notes with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    
    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract token
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token and get Firebase user
    const decodedToken = await auth.verifyIdToken(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const firebaseUid = decodedToken.uid;
    
    // Get the user from our database
    await dbConnect();
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get optional filters from query params
    const department = searchParams.get('department');
    const semester = searchParams.get('semester');
    const subject = searchParams.get('subject');
    const college = searchParams.get('college') || dbUser.college;
    const uploadedBy = searchParams.get('uploadedBy');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Create filters object
    const filters = {
      college,
      department,
      semester,
      subject,
      uploadedBy,
      search
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === null) {
        delete filters[key];
      }
    });
    
    // Get notes
    const result = await getNotes(filters, page, limit);
    
    // Return notes
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: error.message || 'Error fetching notes' }, { status: 500 });
  }
}
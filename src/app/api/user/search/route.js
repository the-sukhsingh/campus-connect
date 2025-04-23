import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';

export async function GET(request) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const firebaseUid = searchParams.get('uid');
    const query = searchParams.get('query');
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Only admin, faculty, librarian, or hod can search users
    if (!['admin', 'faculty', 'hod', 'librarian'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Unauthorized to search users' }, { status: 403 });
    }
    
    // Connect to the database
    await dbConnect();
    
    // Build search query
    const searchQuery = {};
    
    // If role is specified, filter by role
    if (role) {
      searchQuery.role = role;
    }
    
    // Search by name, email, or rollNo
    searchQuery.$or = [
      { displayName: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { rollNo: { $regex: query, $options: 'i' } },
    ];
    
    // Execute the search
    const users = await User.find(searchQuery)
      .select('_id displayName email rollNo department role')
      .limit(limit);
    
    // Return the results
    return NextResponse.json({
      users
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
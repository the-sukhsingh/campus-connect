import { auth } from '@/config/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { getNoteById, getNoteViewUrl, isNoteFavorited } from '@/services/noteService';
import dbConnect from '@/lib/dbConnect';

// GET - Get a note by ID with view URL
export async function GET(request, { params }) {
  try {
    const noteId = (await params).id;
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
    
    // Get note
    const note = await getNoteById(noteId);
    
    // Get view URL
    const viewUrl = await getNoteViewUrl(noteId);
    
    // Check if note is favorited by the user
    const isFavorited = await isNoteFavorited(dbUser._id, noteId);
    
    // Return note with view URL
    return NextResponse.json({
      note,
      viewUrl,
      isFavorited
    });
  } catch (error) {
    console.error('Error getting note:', error);
    return NextResponse.json({ error: error.message || 'Error getting note' }, { status: 500 });
  }
}
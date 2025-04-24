import { auth } from '@/config/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { getUserFavoriteNotes, addNoteToFavorites, removeNoteFromFavorites } from '@/services/noteService';
import dbConnect from '@/lib/dbConnect';

// GET - Get user's favorite notes
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
    
    // Get pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Get favorite notes
    const result = await getUserFavoriteNotes(dbUser._id, page, limit);
    
    // Return favorite notes
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting favorite notes:', error);
    return NextResponse.json({ error: error.message || 'Error getting favorite notes' }, { status: 500 });
  }
}

// POST - Add a note to favorites
export async function POST(request) {
  try {
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
    
    // Get note ID from request body
    const { noteId } = await request.json();
    
    // Validate note ID
    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }
    
    // Add note to favorites
    const favorite = await addNoteToFavorites(dbUser._id, noteId);
    
    return NextResponse.json({ 
      message: 'Note added to favorites',
      favorite 
    });
  } catch (error) {
    console.error('Error adding note to favorites:', error);
    return NextResponse.json({ error: error.message || 'Error adding note to favorites' }, { status: 500 });
  }
}

// DELETE - Remove a note from favorites
export async function DELETE(request) {
  try {
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
    
    // Get note ID from query params
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');
    
    // Validate note ID
    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }
    
    // Remove note from favorites
    await removeNoteFromFavorites(dbUser._id, noteId);
    
    return NextResponse.json({ message: 'Note removed from favorites' });
  } catch (error) {
    console.error('Error removing note from favorites:', error);
    return NextResponse.json({ error: error.message || 'Error removing note from favorites' }, { status: 500 });
  }
}
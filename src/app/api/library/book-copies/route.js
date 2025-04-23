import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { addBookCopies, getBookCopies } from '@/services/bookCopyService';

// GET handler for retrieving book copies
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const firebaseUid = url.searchParams.get('firebaseUid');
    const bookId = url.searchParams.get('bookId');
    
    if (!firebaseUid || !bookId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // Get user from firebaseUid
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get book copies
    const result = await getBookCopies(bookId, firebaseUid);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST handler for adding book copies
export async function POST(request) {
  try {
    const body = await request.json();
    const { firebaseUid, bookId, numberOfCopies, initialData } = body;
    
    if (!firebaseUid || !bookId || !numberOfCopies) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Get user from firebaseUid
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user is authorized (librarian, hod, or admin)
    if (!['librarian', 'hod', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only librarians, HODs, and admins can manage book copies' }, 
        { status: 403 }
      );
    }
    
    // Add book copies
    const result = await addBookCopies(
      bookId, 
      parseInt(numberOfCopies, 10), 
      initialData || {}, 
      firebaseUid
    );
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Added ${numberOfCopies} new book copies`,
      copies: result.copies
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
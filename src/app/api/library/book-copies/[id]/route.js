import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { getBookCopy, updateBookCopy, deleteBookCopy } from '@/services/bookCopyService';

// GET handler for retrieving a specific book copy
export async function GET(request, { params }) {
  try {
    const copyId = params.id;
    const url = new URL(request.url);
    const firebaseUid = url.searchParams.get('firebaseUid');
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Missing firebaseUid parameter' }, { status: 400 });
    }
    
    // Get user from firebaseUid
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get book copy details
    const result = await getBookCopy(copyId, firebaseUid);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH handler for updating a book copy
export async function PATCH(request, { params }) {
  try {
    const copyId = params.id;
    const body = await request.json();
    const { firebaseUid, ...copyData } = body;
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Missing firebaseUid' }, { status: 400 });
    }
    
    // Get user from firebaseUid
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user is authorized (librarian, hod, or admin)
    if (!['librarian', 'hod', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only librarians, HODs, and admins can update book copies' }, 
        { status: 403 }
      );
    }
    
    // Update book copy
    const result = await updateBookCopy(copyId, copyData, firebaseUid);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Book copy updated successfully',
      bookCopy: result.bookCopy
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE handler for removing a book copy
export async function DELETE(request, { params }) {
  try {
    const copyId = params.id;
    const url = new URL(request.url);
    const firebaseUid = url.searchParams.get('firebaseUid');
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Missing firebaseUid parameter' }, { status: 400 });
    }
    
    // Get user from firebaseUid
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user is authorized (librarian, hod, or admin)
    if (!['librarian', 'hod', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only librarians, HODs, and admins can delete book copies' }, 
        { status: 403 }
      );
    }
    
    // Delete book copy
    const result = await deleteBookCopy(copyId, firebaseUid);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Book copy deleted successfully'
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
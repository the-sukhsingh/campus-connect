import { NextResponse } from 'next/server';
import { createBorrowing, createBorrowingByCode } from '@/services/bookBorrowingService';
import { getUserByFirebaseUid } from '@/services/userService';
import Book from '@/models/Book';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';

export async function POST(request) {
  try {
    const body = await request.json();
    const { firebaseUid, bookId, studentId, dueDate, uniqueCode } = body;
    
    // Check if we're using uniqueCode or bookId
    const isUsingUniqueCode = !!uniqueCode;

    if (!firebaseUid || !studentId || !dueDate || (!bookId && !uniqueCode)) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Get the MongoDB user document for the Firebase user (librarian)
    const librarianUser = await getUserByFirebaseUid(firebaseUid);
    if (!librarianUser) {
      return NextResponse.json({ error: 'Librarian not found' }, { status: 404 });
    }
    
    // Check if user is authorized to lend books (librarian or hod)
    if (!['librarian', 'hod'].includes(librarianUser.role)) {
      return NextResponse.json({ error: 'Unauthorized. Only librarians and HODs can lend books' }, { status: 403 });
    }
    
    await dbConnect();
    
    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    if (student.role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 400 });
    }
    
    let borrowing;
    
    if (isUsingUniqueCode) {
      // Lend book by unique code
      borrowing = await createBorrowingByCode(
        uniqueCode, 
        student._id.toString(), 
        new Date(dueDate),
        librarianUser.college?.toString() || ''
      );
    } else {
      // Check if book exists and is available
      const book = await Book.findById(bookId);
      if (!book) {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 });
      }
      
      if (book.availableCopies <= 0) {
        return NextResponse.json({ error: 'No available copies of this book' }, { status: 400 });
      }
      
      // Create a new borrowing using book ID
      borrowing = await createBorrowing(bookId, student._id.toString(), new Date(dueDate));
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Book successfully lent to ${student.displayName || student.email}`,
      borrowing 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
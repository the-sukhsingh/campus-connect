import { NextResponse } from 'next/server';
import { createBorrowing, createBorrowingByCode } from '@/services/bookBorrowingService';
import { getUserByFirebaseUid } from '@/services/userService';
import Book from '@/models/Book';
import BookCopy from '@/models/BookCopy';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';

export async function POST(request) {
  try {
    const body = await request.json();
    const { firebaseUid, bookId, bookCopyId, copyNumber, studentId, dueDate, uniqueCode } = body;
    
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
    
    if (student.role !== 'student' && student.role !== 'faculty') {
      return NextResponse.json({ error: 'User must be a student or faculty member' }, { status: 400 });
    }
    
    let borrowing;
    
    if (isUsingUniqueCode) {
      // Lend book by unique code and copy number
      if (!copyNumber) {
        return NextResponse.json({ error: 'Copy number is required when lending by book code' }, { status: 400 });
      }
      
      borrowing = await createBorrowingByCode(
        uniqueCode,
        parseInt(copyNumber, 10), 
        student._id.toString(), 
        new Date(dueDate),
        librarianUser.college?.toString() || ''
      );
    } else {
      // Using bookId approach
      if (!bookCopyId) {
        return NextResponse.json({ error: 'Book copy ID is required' }, { status: 400 });
      }
      
      // Check if book exists
      const book = await Book.findById(bookId);
      if (!book) {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 });
      }
      
      // Check if book copy exists and is available
      const bookCopy = await BookCopy.findById(bookCopyId);
      if (!bookCopy) {
        return NextResponse.json({ error: 'Book copy not found' }, { status: 404 });
      }
      
      if (bookCopy.status !== 'available') {
        return NextResponse.json({ error: 'This copy of the book is not available for borrowing' }, { status: 400 });
      }
      
      // Create a new borrowing using book ID and book copy ID
      borrowing = await createBorrowing(
        bookId,
        bookCopyId,
        student._id.toString(),
        new Date(dueDate)
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Book copy successfully lent to ${student.displayName || student.email}`,
      borrowing 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
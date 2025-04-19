import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Book from '@/models/Book';
import BookBorrowing from '@/models/BookBorrowing';
import { getUserByFirebaseUid } from '@/services/userService';

export async function GET(request) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const firebaseUid = searchParams.get('uid');
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Only HOD and librarians can access library stats
    if (!['hod', 'librarian', 'admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Unauthorized to access library statistics' }, { status: 403 });
    }

    await dbConnect();
    
    // Get the college ID from the user
    const collegeId = dbUser.college;
    
    if (!collegeId) {
      return NextResponse.json({ error: 'User is not associated with a college' }, { status: 400 });
    }

    // Get total number of books in the college
    const totalBooks = await Book.countDocuments({ college: collegeId });
    
    // Get total available books
    const availableBooksCount = await Book.aggregate([
      { $match: { college: collegeId } },
      { $group: { _id: null, total: { $sum: "$availableCopies" } } }
    ]);
    
    const availableBooks = availableBooksCount.length > 0 ? availableBooksCount[0].total : 0;
    
    // Get borrowed books count (books - available books)
    const totalCopiesCount = await Book.aggregate([
      { $match: { college: collegeId } },
      { $group: { _id: null, total: { $sum: "$copies" } } }
    ]);
    
    const totalCopies = totalCopiesCount.length > 0 ? totalCopiesCount[0].total : 0;
    const borrowedBooks = totalCopies - availableBooks;
    
    // Get overdue books count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueBooks = await BookBorrowing.countDocuments({
      status: { $in: ['borrowed', 'return-requested'] },
      dueDate: { $lt: today }
    });

    return NextResponse.json({ 
      totalBooks,
      availableBooks,
      borrowedBooks,
      overdueBooks
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
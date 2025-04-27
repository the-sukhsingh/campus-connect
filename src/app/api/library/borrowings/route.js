import { NextResponse } from 'next/server';
import { 
  getBorrowings,
  getStudentBorrowings,
  getFacultyBorrowings,
  getPendingReturnRequests,
  createBorrowing,
  requestBookReturn,
  approveBookReturn
} from '@/services/bookBorrowingService';
import { getUserByFirebaseUid } from '@/services/userService';
import BookBorrowing from '@/models/BookBorrowing';
import Book from '@/models/Book';

export async function GET(request) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const firebaseUid = searchParams.get('uid');
    const borrowingId = searchParams.get('borrowingId');
    
    // Parameters for list queries
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // For simple borrowings fetch without specific action
    if (!action) {
      // Allow students, faculty, librarians and HODs to view their own borrowings
      if (['student', 'faculty', 'librarian', 'hod'].includes(dbUser.role)) {
        const borrowings = await getBorrowings({ user: dbUser._id }, page, limit);
        return NextResponse.json(borrowings);
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Handle different actions
    if (action === 'get-student-borrowings') {
      if (dbUser.role !== 'student' && dbUser.role !== 'hod' && dbUser.role !== 'librarian') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Get borrowings for the student
      const result = await getStudentBorrowings(dbUser._id.toString(), status, page, limit);
      return NextResponse.json(result);
    }
    else if (action === 'get-faculty-borrowings') {
      if (dbUser.role !== 'faculty' && dbUser.role !== 'hod' && dbUser.role !== 'librarian') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Get borrowings for the faculty
      const result = await getFacultyBorrowings(dbUser._id.toString(), status, page, limit);
      return NextResponse.json(result);
    } 
    else if (action === 'get-pending-returns' && (dbUser.role === 'librarian' || dbUser.role === 'hod')) {
      // Get pending return requests for librarians
      const result = await getPendingReturnRequests(page, limit);
      return NextResponse.json(result);
    }
    else if (action === 'get-all-borrowings' && (dbUser.role === 'librarian' || dbUser.role === 'hod')) {
      // Get all borrowings for librarians but only from their college
      const query = status ? { status } : {};
      
      // Add college filter if the librarian is associated with a college
      if (dbUser.college) {
        // We need to find books that belong to librarian's college
        // First, query all books from the librarian's college
        const bookIds = await Book.find({ college: dbUser.college }).distinct('_id');
        
        // Then filter the borrowings to only include those books
        query.book = { $in: bookIds };
      }
      
      const result = await getBorrowings(query, page, limit);
      return NextResponse.json(result);
    }
    else if (action === 'count-current' && dbUser){
      // Count current borrowings for the user
      const total = await BookBorrowing.countDocuments({
        student: dbUser._id,
        status: 'borrowed'
      });
      return NextResponse.json({ count: total });
    }
    else if (action === 'get-borrowed-books' && dbUser) {

      const result = await getBorrowings({ user: dbUser._id, status: 'borrowed' });
      return NextResponse.json(result);
    } else if (status === 'all'){
        // Get all borrowings for librarians but only from their college
        const query = status ? { status } : {};
      
        // Add college filter if the librarian is associated with a college
        if (dbUser.college) {
          // We need to find books that belong to librarian's college
          // First, query all books from the librarian's college
          const bookIds = await Book.find({ college: dbUser.college }).distinct('_id');
          
          // Then filter the borrowings to only include those books
          query.book = { $in: bookIds };
        }
        
        const result = await getBorrowings(query, page, limit);
        return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, bookId, dueDate } = body;
    
    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      );
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(uid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Faculty, HODs, and librarians can borrow books directly
    if (['faculty', 'librarian', 'hod'].includes(dbUser.role)) {
      if (!bookId || !dueDate) {
        return NextResponse.json({ error: 'Book ID and due date are required' }, { status: 400 });
      }
      
      // Create a new borrowing with the faculty as the borrower
      const borrowing = await createBorrowing(bookId, dbUser._id.toString(), new Date(dueDate));
      
      return NextResponse.json({ 
        success: true, 
        borrowing 
      });
    } 
    else {
      return NextResponse.json({ error: 'Unauthorized. Only faculty members, librarians, and HODs can borrow books' }, { status: 403 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { uid, borrowingId, action, fine } = body;
    
    if (!uid || !borrowingId) {
      return NextResponse.json(
        { error: 'User ID and borrowing ID are required' }, 
        { status: 400 }
      );
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(uid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Handle return request action
    if (action === 'return-request' || !action) {
      // Faculty, students, and librarians can request returns for their books
      if (!['student', 'faculty', 'librarian', 'hod'].includes(dbUser.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Request book return
      const borrowing = await requestBookReturn(borrowingId, dbUser._id.toString());
      
      return NextResponse.json({ 
        success: true, 
        borrowing 
      });
    }
    // Handle approve return action
    else if (action === 'approve-return') {
      // Only librarians and HODs can approve returns
      if (!['librarian', 'hod'].includes(dbUser.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Approve book return
      const borrowing = await approveBookReturn(borrowingId, dbUser._id.toString(), fine);
      
      return NextResponse.json({ 
        success: true, 
        borrowing 
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
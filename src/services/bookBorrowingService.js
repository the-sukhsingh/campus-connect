import dbConnect from '@/lib/dbConnect';
import BookBorrowing from '@/models/BookBorrowing';
import Book from '@/models/Book';

// Get all borrowings with filtering and pagination
export async function getBorrowings(
  query = {},
  page = 1,
  limit= 10,
) {
  try {
    await dbConnect();
    
    // Count total matching documents
    const total = await BookBorrowing.countDocuments(query);
    
    // Calculate pagination
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    
    // Fetch borrowings with pagination
    const borrowings = await BookBorrowing.find(query)
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(limit)
      .populate('book', 'title author ISBN genre')
      .populate('student', 'displayName email')
      .populate('approvedBy', 'displayName email');
    
    return { borrowings, total, pages };
  } catch (error ) {
    console.error('Error fetching borrowings:', error);
    throw error;
  }
}

// Get borrowings for a specific student
export async function getStudentBorrowings(
  studentId,
  status,
  page = 1,
  limit = 10
) {
  try {
    const query = { student: studentId };
    
    if (status) {
      query.status = status;
    }
    
    return getBorrowings(query, page, limit);
  } catch (error ) {
    console.error('Error fetching student borrowings:', error);
    throw error;
  }
}

// Get borrowings for a specific faculty member
export async function getFacultyBorrowings(
  facultyId,
  status,
  page = 1,
  limit = 10
){
  try {
    const query = { student: facultyId }; // Using student field for faculty as well
    
    if (status) {
      query.status = status;
    }
    
    return getBorrowings(query, page, limit);
  } catch (error ) {
    console.error('Error fetching faculty borrowings:', error);
    throw error;
  }
}

// Get borrowings for a specific book
export async function getBookBorrowings(
  bookId,
  status
) {
  try {
    await dbConnect();
    
    const query = { book: bookId };
    
    if (status) {
      query.status = status;
    }
    
    const borrowings = await BookBorrowing.find(query)
      .populate('student', 'displayName email')
      .populate('approvedBy', 'displayName email');
    
    return borrowings;
  } catch (error ) {
    console.error('Error fetching book borrowings:', error);
    throw error;
  }
}

// Get pending return requests
export async function getPendingReturnRequests(
  page = 1,
  limit = 10
) {
  try {
    const query = { status: 'return-requested' };
    return getBorrowings(query, page, limit);
  } catch (error ) {
    console.error('Error fetching pending return requests:', error);
    throw error;
  }
}

// Create a new borrowing
export async function createBorrowing(
  bookId,
  studentId,
  dueDate
) {
  try {
    await dbConnect();
    
    // Check if book is available
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }
    
    if (book.availableCopies <= 0) {
      throw new Error('No available copies of this book');
    }
    
    // Check if student already has an active borrowing for this book
    const existingBorrowing = await BookBorrowing.findOne({
      book: bookId,
      student: studentId,
      status: { $in: ['borrowed', 'return-requested'] }
    });
    
    if (existingBorrowing) {
      throw new Error('Student already has an active borrowing for this book');
    }
    
    // Create new borrowing
    const borrowing = new BookBorrowing({
      book: bookId,
      student: studentId,
      issueDate: new Date(),
      dueDate,
      status: 'borrowed'
    });
    
    await borrowing.save();
    
    // Update available copies
    await Book.findByIdAndUpdate(bookId, {
      $inc: { availableCopies: -1 }
    });
    
    return borrowing;
  } catch (error ) {
    console.error('Error creating borrowing:', error);
    throw error;
  }
}

// Create a new borrowing using book's unique code
export async function createBorrowingByCode(
  uniqueCode,
  studentId,
  dueDate,
  collegeId
) {
  try {
    await dbConnect();
    
    // Find the book by its unique code within the college
    const book = await Book.findOne({
      uniqueCode,
      college: collegeId
    });
    
    if (!book) {
      throw new Error('Book not found with this unique code in your college');
    }
    
    if (book.availableCopies <= 0) {
      throw new Error('No available copies of this book');
    }
    
    // Check if student already has an active borrowing for this book
    const existingBorrowing = await BookBorrowing.findOne({
      book: book._id,
      student: studentId,
      status: { $in: ['borrowed', 'return-requested'] }
    });
    
    if (existingBorrowing) {
      throw new Error('Student already has an active borrowing for this book');
    }
    
    // Create new borrowing
    const borrowing = new BookBorrowing({
      book: book._id,
      student: studentId,
      issueDate: new Date(),
      dueDate,
      status: 'borrowed'
    });
    
    await borrowing.save();
    
    // Update available copies
    await Book.findByIdAndUpdate(book._id, {
      $inc: { availableCopies: -1 }
    });
    
    return borrowing;
  } catch (error ) {
    console.error('Error creating borrowing by code:', error);
    throw error;
  }
}

// Request return of a book
export async function requestBookReturn(
  borrowingId,
  studentId
)  {
  try {
    await dbConnect();
    
    // Find borrowing and check if it belongs to the student
    const borrowing = await BookBorrowing.findOne({
      _id: borrowingId,
      student: studentId,
      status: 'borrowed'
    });
    
    if (!borrowing) {
      throw new Error('Borrowing not found or not in borrowed status');
    }
    
    // Update borrowing status
    borrowing.status = 'return-requested';
    borrowing.returnRequested = new Date();
    await borrowing.save();
    
    return borrowing;
  } catch (error ) {
    console.error('Error requesting book return:', error);
    throw error;
  }
}

// Approve book return by librarian
export async function approveBookReturn(
  borrowingId,
  librarianId,
  fine
) {
  try {
    await dbConnect();
    
    // Find borrowing
    const borrowing = await BookBorrowing.findOne({
      _id: borrowingId,
      status: 'return-requested'
    });
    
    if (!borrowing) {
      throw new Error('Borrowing not found or not in return-requested status');
    }
    
    // Update borrowing
    borrowing.status = 'returned';
    borrowing.returnDate = new Date();
    borrowing.returnApproved = new Date();
    borrowing.approvedBy = librarianId;
    
    if (fine !== undefined) {
      borrowing.fine = fine;
    }
    
    await borrowing.save();
    
    // Update available copies
    await Book.findByIdAndUpdate(borrowing.book, {
      $inc: { availableCopies: 1 }
    });
    
    return borrowing;
  } catch (error ) {
    console.error('Error approving book return:', error);
    throw error;
  }
}

// Calculate overdue books and potential fines
export async function calculateOverdueBooks() {
  try {
    await dbConnect();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find all active borrowings with due dates in the past
    const overdueBooks = await BookBorrowing.find({
      status: { $in: ['borrowed', 'return-requested'] },
      dueDate: { $lt: today }
    })
      .populate('book', 'title author ISBN')
      .populate('student', 'displayName email');
    
    return overdueBooks;
  } catch (error ) {
    console.error('Error calculating overdue books:', error);
    throw error;
  }
}
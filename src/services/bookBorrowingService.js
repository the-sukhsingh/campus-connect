import dbConnect from '@/lib/dbConnect';
import BookBorrowing from '@/models/BookBorrowing';
import Book from '@/models/Book';
import BookCopy from '@/models/BookCopy';

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
    console.log('Total borrowings:', total);
    // Calculate pagination
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    
    // Fetch borrowings with pagination
    const borrowings = await BookBorrowing.find(query)
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(limit)
      .populate('book', 'title author ISBN genre')
      .populate('bookCopy', 'copyNumber status condition')
      .populate('student', 'displayName email role department')
      .populate('approvedBy', 'displayName email');
    console.log('Borrowings:', borrowings);
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
    console.log("Query is", query);
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
      .populate('bookCopy', 'copyNumber status condition')
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
  bookCopyId,
  studentId,
  dueDate
) {
  try {
    await dbConnect();
    
    // Check if book copy exists and is available
    const bookCopy = await BookCopy.findById(bookCopyId);
    if (!bookCopy) {
      throw new Error('Book copy not found');
    }
    
    if (bookCopy.status !== 'available') {
      throw new Error('This copy of the book is not available for borrowing');
    }
    
    // Get book information
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }
    
    // Check if student already has an active borrowing for this book copy
    const existingBorrowing = await BookBorrowing.findOne({
      bookCopy: bookCopyId,
      status: { $in: ['borrowed', 'return-requested'] }
    });
    
    if (existingBorrowing) {
      throw new Error('This copy is already borrowed by someone else');
    }
    
    // Create new borrowing
    const borrowing = new BookBorrowing({
      book: bookId,
      bookCopy: bookCopyId,
      student: studentId,
      issueDate: new Date(),
      dueDate,
      status: 'borrowed'
    });
    
    await borrowing.save();
    
    // Update book copy status
    bookCopy.status = 'borrowed';
    await bookCopy.save();
    
    // Update available copies count in the book record
    await Book.findByIdAndUpdate(bookId, {
      $inc: { availableCopies: -1 }
    });
    
    return borrowing;
  } catch (error ) {
    console.error('Error creating borrowing:', error);
    throw error;
  }
}

// Create a new borrowing using book's unique code and copy number
export async function createBorrowingByCode(
  uniqueCode,
  copyNumber,
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
    
    // Find the specific book copy
    const bookCopy = await BookCopy.findOne({
      book: book._id,
      copyNumber: copyNumber,
      status: 'available'
    });
    
    if (!bookCopy) {
      throw new Error(`Copy #${copyNumber} is not available for borrowing`);
    }
    
    // Check if student already has an active borrowing for this book copy
    const existingBorrowing = await BookBorrowing.findOne({
      bookCopy: bookCopy._id,
      status: { $in: ['borrowed', 'return-requested'] }
    });
    
    if (existingBorrowing) {
      throw new Error('This copy is already borrowed by someone else');
    }
    
    // Create new borrowing
    const borrowing = new BookBorrowing({
      book: book._id,
      bookCopy: bookCopy._id,
      student: studentId,
      issueDate: new Date(),
      dueDate,
      status: 'borrowed'
    });
    
    await borrowing.save();
    
    // Update book copy status
    bookCopy.status = 'borrowed';
    await bookCopy.save();
    
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
    }).populate('bookCopy');
    
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
    
    // Update book copy status
    if (borrowing.bookCopy) {
      await BookCopy.findByIdAndUpdate(borrowing.bookCopy._id, {
        status: 'available'
      });
    }
    
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
      .populate('bookCopy', 'copyNumber')
      .populate('student', 'displayName email');
    
    return overdueBooks;
  } catch (error ) {
    console.error('Error calculating overdue books:', error);
    throw error;
  }
}
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import BookCopy from '@/models/BookCopy';
import Book from '@/models/Book';
import User from '@/models/User';
import BookBorrowing from '@/models/BookBorrowing';

// Get all copies of a book
export const getBookCopies = async (bookId, firebaseUid) => {
  try {
    await dbConnect();
    
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return { success: false, error: 'Invalid book ID' };
    }
    
    // Find the book
    const book = await Book.findById(bookId);
    if (!book) {
      return { success: false, error: 'Book not found' };
    }
    
    // Check if the user can access this book
    if (user.role !== 'admin' && user.college?.toString() !== book?.college?.toString()) {
      return { success: false, error: 'You do not have permission to view this book' };
    }
    
    // Get all copies of the book
    const bookCopies = await BookCopy.find({ book: bookId }).sort({ copyNumber: 1 }).lean();
    
    return {
      success: true,
      bookCopies
    };
  } catch (error) {
    console.error('Error in getBookCopies service:', error);
    return { success: false, error: error.message };
  }
};

// Get a single book copy by ID
export const getBookCopy = async (copyId, firebaseUid) => {
  try {
    await dbConnect();
    
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(copyId)) {
      return { success: false, error: 'Invalid book copy ID' };
    }
    
    // Find the book copy with book details
    const bookCopy = await BookCopy.findById(copyId).populate('book').lean();
    
    if (!bookCopy) {
      return { success: false, error: 'Book copy not found' };
    }
    
    // Check if the user can access this book copy
    if (user.role !== 'admin' && user.college?.toString() !== bookCopy?.college?.toString()) {
      return { success: false, error: 'You do not have permission to view this book copy' };
    }
    
    return {
      success: true,
      bookCopy
    };
  } catch (error) {
    console.error('Error in getBookCopy service:', error);
    return { success: false, error: error.message };
  }
};

// Add book copies
export async function addBookCopies(bookId, count, options = {}, firebaseUid) {
  try {
    await dbConnect();

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return { success: false, error: 'Book not found' };
    }

    const copies = [];
    const errors = [];

    // Get the current highest copy number for this book
    const highestCopy = await BookCopy.findOne({ book: bookId })
      .sort({ copyNumber: -1 })
      .limit(1);
    
    let startNumber = highestCopy ? highestCopy.copyNumber + 1 : 1;

    for (let i = 0; i < count; i++) {
      try {
        let uniqueCode = null;
        
        // If it's the first copy and a unique code was provided, use it
        if (i === 0 && options.uniqueCode) {
          uniqueCode = options.uniqueCode;
        } else if (i > 0) {
          // For additional copies, generate a unique code based on the book title
          const baseCode = book.title
            .substring(0, 3)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');
          
          let isUnique = false;
          let attempts = 0;
          
          while (!isUnique && attempts < 100) {
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            const potentialCode = `${baseCode}${randomNum}`;
            
            // Check if this code is already in use
            const existingCopy = await BookCopy.findOne({ uniqueCode: potentialCode });
            if (!existingCopy) {
              uniqueCode = potentialCode;
              isUnique = true;
            }
            attempts++;
          }
          
          if (!isUnique) {
            errors.push(`Failed to generate unique code for copy ${startNumber + i}`);
            continue;
          }
        }

        const copy = new BookCopy({
          book: bookId,
          copyNumber: startNumber + i,
          status: options.status || 'available',
          condition: options.condition || 'good',
          college: book.college,
          uniqueCode
        });

        await copy.save();
        copies.push(copy);
      } catch (error) {
        console.error(`Error creating copy ${startNumber + i}:`, error);
        errors.push(`Failed to create copy ${startNumber + i}: ${error.message}`);
      }
    }

    // Update the book's copy count and available copies
    const totalCopies = await BookCopy.countDocuments({ book: bookId });
    const availableCopies = await BookCopy.countDocuments({ 
      book: bookId,
      status: 'available'
    });

    book.copies = totalCopies;
    book.availableCopies = availableCopies;
    await book.save();

    return {
      success: errors.length === 0,
      copies,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('Error in addBookCopies:', error);
    return { success: false, error: error.message };
  }
}

// Update a book copy
export const updateBookCopy = async (copyId, copyData, firebaseUid) => {
  try {
    await dbConnect();
    
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(copyId)) {
      return { success: false, error: 'Invalid book copy ID' };
    }
    
    // Find the book copy
    const bookCopy = await BookCopy.findById(copyId);
    if (!bookCopy) {
      return { success: false, error: 'Book copy not found' };
    }
    
    // Check permissions
    if (user.role !== 'admin' && user.college?.toString() !== bookCopy.college.toString()) {
      return { success: false, error: 'You do not have permission to update this book copy' };
    }
    
    // Prevent updating the book reference or copy number
    delete copyData.book;
    delete copyData.copyNumber;
    delete copyData.college;
    
    // If changing status from 'borrowed' to something else, we need to check if it's currently borrowed
    if (bookCopy.status === 'borrowed' && copyData.status && copyData.status !== 'borrowed') {
      const activeBorrowing = await BookBorrowing.findOne({
        bookCopy: copyId,
        status: { $in: ['borrowed', 'return-requested'] }
      });
      
      if (activeBorrowing) {
        return { 
          success: false, 
          error: 'Cannot change status of a currently borrowed book. The book must be returned first.'
        };
      }
    }
    
    // If changing status to 'available', update the book's availableCopies count
    const book = await Book.findById(bookCopy.book);
    if (book) {
      if (bookCopy.status !== 'available' && copyData.status === 'available') {
        book.availableCopies += 1;
        await book.save();
      } else if (bookCopy.status === 'available' && copyData.status && copyData.status !== 'available') {
        book.availableCopies = Math.max(0, book.availableCopies - 1);
        await book.save();
      }
    }
    
    // Update the book copy
    Object.assign(bookCopy, copyData);
    await bookCopy.save();
    
    return {
      success: true,
      bookCopy
    };
  } catch (error) {
    console.error('Error in updateBookCopy service:', error);
    return { success: false, error: error.message };
  }
};

// Delete a book copy
export const deleteBookCopy = async (copyId, firebaseUid) => {
  try {
    await dbConnect();
    
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(copyId)) {
      return { success: false, error: 'Invalid book copy ID' };
    }
    
    // Find the book copy
    const bookCopy = await BookCopy.findById(copyId);
    if (!bookCopy) {
      return { success: false, error: 'Book copy not found' };
    }
    
    // Check permissions
    if (user.role !== 'admin' && user.college?.toString() !== bookCopy.college.toString()) {
      return { success: false, error: 'You do not have permission to delete this book copy' };
    }
    
    // Check if the copy is currently borrowed
    const activeBorrowing = await BookBorrowing.findOne({
      bookCopy: copyId,
      status: { $in: ['borrowed', 'return-requested'] }
    });
    
    if (activeBorrowing) {
      return { 
        success: false, 
        error: 'Cannot delete a currently borrowed book copy. The book must be returned first.'
      };
    }
    
    // Update the book's copies count
    const book = await Book.findById(bookCopy.book);
    if (book) {
      book.copies = Math.max(0, book.copies - 1);
      if (bookCopy.status === 'available') {
        book.availableCopies = Math.max(0, book.availableCopies - 1);
      }
      await book.save();
    }
    
    // Delete the book copy
    await BookCopy.findByIdAndDelete(copyId);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error in deleteBookCopy service:', error);
    return { success: false, error: error.message };
  }
};
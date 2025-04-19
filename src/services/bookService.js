import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Book, { IBook } from '@/models/Book';
import User from '@/models/User';
import College from '@/models/College';
import { nanoid } from 'nanoid';

// Generate unique book code
const generateBookCode = async (collegeId) => {
  // Create a 6-character alphanumeric code
  let uniqueCode = nanoid(6).toUpperCase();
  
  // Keep generating until we find an unused code for this college
  let codeExists = true;
  let attempts = 0;
  
  while (codeExists && attempts < 10) {
    attempts++;
    
    // Check if code already exists in this college
    const existingBook = await Book.findOne({
      college: collegeId,
      uniqueCode: uniqueCode
    });
    
    if (!existingBook) {
      codeExists = false;
    } else {
      // Generate a new code and try again
      uniqueCode = nanoid(6).toUpperCase();
    }
  }
  
  if (attempts >= 10) {
    throw new Error('Failed to generate unique book code after multiple attempts');
  }
  
  return uniqueCode;
};

// Get all books with pagination and search
export const getBooks = async (
  firebaseUid,
  page = 1,
  limit = 10,
  searchQuery = '',
  sortField = '',
  genre = '',
  collegeId = '',
  searchField = ''
) => {
  try {
    await dbConnect();
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Check if user has a college associated
    let userCollegeId = '';
    
    if (user.role === 'admin') {
      userCollegeId = collegeId || '';
    } else {
      if (!user.college) {
        return { success: false, error: 'User is not associated with a college' };
      }
      userCollegeId = user.college.toString();
    }
    // Build query
    const query = {};
    
    if (userCollegeId) {
      query.college = userCollegeId;
    }
    
    if (genre) {
      query.genre = genre;
    }
    
    if (searchQuery) {
      if (searchField === 'uniqueCode') {
        query.uniqueCode = { $regex: searchQuery, $options: 'i' };
      } else if (searchField === 'ISBN') {
        query.ISBN = { $regex: searchQuery, $options: 'i' };
      } else {
        query.$or = [
          { title: { $regex: searchQuery, $options: 'i' } },
          { author: { $regex: searchQuery, $options: 'i' } },
          { genre: { $regex: searchQuery, $options: 'i' } },
          { publisher: { $regex: searchQuery, $options: 'i' } },
        ];
        
        // Only search for uniqueCode if it's explicitly selected or as part of a general search
        if (!searchField || searchField === 'all') {
          query.$or.push({ uniqueCode: { $regex: searchQuery, $options: 'i' } });
        }
      }
    }
    
    // Build sort
    const sortOptions = {};
    
    if (sortField) {
      const [field, direction] = sortField.split(':');
      sortOptions[field] = direction === 'desc' ? -1 : 1;
    } else {
      sortOptions.updatedAt = -1;
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const books = await Book.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('college', 'name')
      .lean();
    
    // Get total count for pagination
    const total = await Book.countDocuments(query);
    
    const pages = Math.ceil(total / limit);
    
    return {
      success: true,
      books,
      total,
      pages,
      currentPage: page
    };
  } catch (error) {
    console.error('Error in getBooks service:', error);
    return { success: false, error: error.message };
  }
};

// Get a single book by ID
export const getBook = async (bookId, firebaseUid) => {
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
    const book = await Book.findById(bookId)
      .populate('college', 'name')
      .lean();
    
    if (!book) {
      return { success: false, error: 'Book not found' };
    }
    
    // Check if the user can access this book
    if (user.role !== 'admin' && user.college?.toString() !== book?.college?._id.toString()) {
      return { success: false, error: 'You do not have permission to view this book' };
    }
    
    return {
      success: true,
      book
    };
  } catch (error) {
    console.error('Error in getBook service:', error);
    return { success: false, error: error.message };
  }
};

// Get a book by its unique code
export const getBookByCode = async (code, firebaseUid) => {
  try {
    await dbConnect();
    
    const user = await User.findOne({ firebaseUid });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (!user.college && user.role !== 'admin') {
      return { success: false, error: 'User is not associated with a college' };
    }
    
    // Query for the book with the given code
    // For non-admin users, restrict to their college
    const query = { uniqueCode: code };
    
    if (user.role !== 'admin' && user.college) {
      query.college = user.college;
    }
    
    const book = await Book.findOne(query)
      .populate('college', 'name')
      .lean();
    
    if (!book) {
      return { success: false, error: 'Book not found with this code' };
    }
    
    return {
      success: true,
      book
    };
  } catch (error) {
    console.error('Error in getBookByCode service:', error);
    return { success: false, error: error.message };
  }
};

// Add a new book
export const addBook = async (bookData, firebaseUid) => {
  try {
    await dbConnect();
    
    const user = await User.findOne({ firebaseUid });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (!user.college && user.role !== 'admin' && !bookData.college) {
      return { success: false, error: 'User is not associated with a college' };
    }
    
    // Find the college
    let collegeId = bookData.college || user.college;
    
    if (!collegeId) {
      return { success: false, error: 'College ID is required' };
    }
    
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      return { success: false, error: 'Invalid college ID' };
    }
    
    const college = await College.findById(collegeId);
    
    if (!college) {
      return { success: false, error: 'College not found' };
    }
    
    // Check if user can add books to this college
    if (user.role !== 'admin' && user.college?.toString() !== collegeId.toString()) {
      return { success: false, error: 'You do not have permission to add books to this college' };
    }
    
    // Ensure available copies doesn't exceed total copies
    if (bookData.availableCopies > bookData.copies) {
      bookData.availableCopies = bookData.copies;
    }
    
    // Generate unique code if not provided
    if (!bookData.uniqueCode) {
      bookData.uniqueCode = await generateBookCode(collegeId);
    }
    // Create the book
    const newBook = new Book({
      ...bookData,
      college: collegeId,
      createdBy: user._id,
    });

    
    await newBook.save();
    
    return {
      success: true,
      book: newBook
    };
  } catch (error) {
    console.error('Error in addBook service:', error);
    
    // Handle duplicate code error
    if (error.code === 11000 && error.keyPattern && error.keyPattern['college_uniqueCode']) {
      return { success: false, error: 'A book with this unique code already exists in this college' };
    }
    
    return { success: false, error: error.message };
  }
};

// Update a book
export const updateBook = async (bookId, bookData, firebaseUid) => {
  try {
    await dbConnect();
    
    const user = await User.findOne({ firebaseUid });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return { success: false, error: 'Invalid book ID' };
    }
    
    // Find the book
    const book = await Book.findById(bookId);
    
    if (!book) {
      return { success: false, error: 'Book not found' };
    }
    
    // Check permissions
    if (
      user.role !== 'admin' &&
      user.college?.toString() !== book.college.toString()
    ) {
      return { success: false, error: 'You do not have permission to update this book' };
    }
    
    // Ensure available copies doesn't exceed total copies
    if (bookData.availableCopies > bookData.copies) {
      bookData.availableCopies = bookData.copies;
    }
    
    // Update the book
    Object.assign(book, bookData);
    await book.save();
    
    return {
      success: true,
      book
    };
  } catch (error) {
    console.error('Error in updateBook service:', error);
    
    // Handle duplicate code error
    if (error.code === 11000 && error.keyPattern && error.keyPattern['college_uniqueCode']) {
      return { success: false, error: 'A book with this unique code already exists in this college' };
    }
    
    return { success: false, error: error.message };
  }
};

// Delete a book
export const deleteBook = async (bookId, firebaseUid) => {
  try {
    await dbConnect();
    
    const user = await User.findOne({ firebaseUid });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return { success: false, error: 'Invalid book ID' };
    }
    
    // Find the book
    const book = await Book.findById(bookId);
    
    if (!book) {
      return { success: false, error: 'Book not found' };
    }
    
    // Check permissions
    if (
      user.role !== 'admin' &&
      user.role !== 'hod' &&
      user.college?.toString() !== book.college.toString()
    ) {
      return { success: false, error: 'You do not have permission to delete this book' };
    }
    
    // Check if book has borrowings
    // This would require importing the BookBorrowing model and checking if there are active borrowings
    // For now, we'll just delete the book
    
    await Book.findByIdAndDelete(bookId);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error in deleteBook service:', error);
    return { success: false, error: error.message };
  }
};

// Get all genres
export const getGenres = async (firebaseUid) => {
  try {
    await dbConnect();
    
    const user = await User.findOne({ firebaseUid });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Build query to find books the user can access
    const query = {};
    
    if (user.role !== 'admin' && user.college) {
      query.college = user.college;
    }
    
    // Get unique genres
    const genres = await Book.distinct('genre', query);
    
    return {
      success: true,
      genres
    };
  } catch (error) {
    console.error('Error in getGenres service:', error);
    return { success: false, error: error.message };
  }
};

// Generate a unique code for an existing book
export const generateUniqueCodeForExistingBook = async (bookId, firebaseUid) => {
  try {
    await dbConnect();
    
    const user = await User.findOne({ firebaseUid });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return { success: false, error: 'Invalid book ID' };
    }
    
    // Find the book
    const book = await Book.findById(bookId);
    
    if (!book) {
      return { success: false, error: 'Book not found' };
    }
    
    // Check permissions
    if (
      user.role !== 'admin' &&
      user.role !== 'librarian' &&
      user.role !== 'hod' &&
      user.college?.toString() !== book.college.toString()
    ) {
      return { success: false, error: 'You do not have permission to update this book' };
    }
    
    // Generate a new unique code
    const uniqueCode = await generateBookCode(book.college.toString());
    
    // Update the book
    book.uniqueCode = uniqueCode;
    await book.save();
    
    return {
      success: true,
      book,
      uniqueCode
    };
  } catch (error) {
    console.error('Error generating unique code:', error);
    return { success: false, error: error.message };
  }
};
import { NextResponse } from 'next/server';
import { 
  addBook, 
  updateBook, 
  generateBookCode,
  deleteBook, 
  getBook, 
  getBooks,
  getGenres,
  getBookByCode,
  generateUniqueCodeForExistingBook,
  validateUniqueCode
} from '@/services/bookService';

import {addBookCopies} from '@/services/bookCopyService'

export async function GET(req) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');
    const uid = searchParams.get('uid');
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    if (action === 'get-book') {
      const bookId = searchParams.get('bookId');
      if (!bookId) {
        return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
      }
      
      const result = await getBook(bookId, uid);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json(result);
    } 
    else if (action === 'get-book-by-code') {
      const code = searchParams.get('uniqueCode');
      if (!code) {
        return NextResponse.json({ error: 'Book code is required' }, { status: 400 });
      }
      
      const result = await getBookByCode(code, uid);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json(result);
    }
    else if (action === 'get-books') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const query = searchParams.get('query') || '';
      const sort = searchParams.get('sort') || '';
      const genre = searchParams.get('genre') || '';
      const collegeId = searchParams.get('collegeId') || '';
      const searchField = searchParams.get('searchField') || '';
      
      const result = await getBooks(uid, page, limit, query, sort, genre, collegeId, searchField);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json(result);
    }
    else if (action === 'get-genres') {
      const result = await getGenres(uid);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in books API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { firebaseUid, action, bookData, bookId, books, collegeId } = body;

    console.log('Request body:', body);
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    if (action === 'add-book' || action === 'add-books') {
      if (!bookData && !books) {
        return NextResponse.json({ error: 'Book data is required' }, { status: 400 });
      }

      // Handle multiple books
      if (action === 'add-books' && Array.isArray(books)) {
        const results = [];
        const errors = [];

        // Process each book
        for (const book of books) {
          try {
            // Validate unique code if provided
            if (book.uniqueCode) {
              const isValid = await validateUniqueCode(book.uniqueCode, firebaseUid);
              if (!isValid) {
                errors.push({ book: book.title, error: `Unique code ${book.uniqueCode} is already in use` });
                book.uniqueCode = await generateBookCode(collegeId); // Generate a new unique code
              }
            } else {
              book.uniqueCode = await generateBookCode(collegeId);
            }

            // Add the book
            const result = await addBook(book, firebaseUid);
            if (result.success) {
              // Add copies for the book
              const copiesResult = await addBookCopies(
                result.book._id.toString(),
                book.copies,
                {
                  status: 'available',
                  condition: 'good',
                  uniqueCode: book.uniqueCode // Pass the custom unique code if provided
                },
                firebaseUid
              );
              
              results.push({
                book: result.book,
                copies: copiesResult.success ? copiesResult.copies : [],
                success: true
              });
            } else {
              errors.push({ book: book.title, error: result.error });
            }
          } catch (error) {
            errors.push({ book: book.title, error: error.message });
          }
        }

        return NextResponse.json({
          success: errors.length === 0,
          results,
          errors,
          message: errors.length > 0 ? 'Some books failed to add' : 'All books added successfully'
        });
      }

      // Handle single book
      if (bookData) {
        // Validate unique code if provided
        if (bookData.uniqueCode) {
          const isValid = await validateUniqueCode(bookData.uniqueCode, firebaseUid);
          if (!isValid) {
            return NextResponse.json({ 
              success: false, 
              error: `Unique code ${bookData.uniqueCode} is already in use` 
            }, { status: 400 });
          }
        }

        const result = await addBook(bookData, firebaseUid);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        const copiesResult = await addBookCopies(
          result.book._id.toString(),
          bookData.copies,
          {
            status: 'available',
            condition: 'good',
            uniqueCode: bookData.uniqueCode // Pass the custom unique code if provided
          },
          firebaseUid
        );

        return NextResponse.json({
          ...result,
          copies: copiesResult.success ? copiesResult.copies : []
        });
      }
    }
    else if (action === 'update-book') {
      if (!bookId || !bookData) {
        return NextResponse.json({ error: 'Book ID and data are required' }, { status: 400 });
      }
      
      const result = await updateBook(bookId, bookData, firebaseUid);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json(result);
    }
    else if (action === 'delete-book') {
      if (!bookId) {
        return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
      }
      console.log('Deleting book with ID:', bookId);
      const result = await deleteBook(bookId, firebaseUid);
      console.log('Delete result:', result);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json(result);
    }
    else if (action === 'generate-code') {
      if (!bookId) {
        return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
      }
      
      const result = await generateUniqueCodeForExistingBook(bookId, firebaseUid);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in books API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
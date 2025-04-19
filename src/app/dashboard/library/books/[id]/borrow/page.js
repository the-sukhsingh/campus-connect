'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';


export default function BorrowBookPage() {
  const { user, userRole } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dueDate, setDueDate] = useState('');

  const bookId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Set default due date (14 days from now)
  useEffect(() => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
  }, []);

  // Fetch book details
  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!user || !bookId) return;

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/library/books/${bookId}?uid=${user?.uid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch book details');
        }

        const data = await response.json();
        
        if (!data.book) {
          throw new Error('Book not found');
        }
        
        if (data.book.availableCopies < 1) {
          throw new Error('This book is not available for borrowing');
        }

        setBook(data.book);
      } catch (err) {
        console.error('Error fetching book details:', err);
        setError(err.message || 'Failed to load book details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [user, bookId]);

  // Check if user can borrow books (faculty members, librarians, hod)
  const canBorrowBooks = ['faculty', 'librarian', 'hod'].includes(userRole || '');

  // Handle form submission
  const handleBorrowBook = async (e) => {
    e.preventDefault();
    
    if (!user || !book || !canBorrowBooks) {
      return;
    }

    try {
      setBorrowing(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/library/borrowings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uid: user?.uid,
          bookId: book._id,
          dueDate: new Date(dueDate).toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to borrow book');
      }

      const data = await response.json();
      setSuccess('Book borrowed successfully. You can view your borrowings in your dashboard.');
      
      // Redirect to borrowings list after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/library/borrowings');
      }, 2000);
    } catch (err) {
      console.error('Error borrowing book:', err);
      setError(err.message || 'Failed to borrow book. Please try again.');
    } finally {
      setBorrowing(false);
    }
  };

  // If user is not authorized to borrow books, redirect
  useEffect(() => {
    if (user && !canBorrowBooks) {
      router.push(`/dashboard/library/books/${bookId}`);
    }
  }, [user, canBorrowBooks, bookId, router]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/dashboard/library/books/${bookId}`}
          className="text-indigo-600 hover:text-indigo-900 flex items-center"
        >
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Book Details
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8 h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4" role="alert">
              <p className="text-red-700">{error}</p>
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/library/books"
                className="text-indigo-600 hover:text-indigo-900"
              >
                Return to Books Listing
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="p-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4" role="alert">
              <p className="text-green-700">{success}</p>
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/library/borrowings"
                className="text-indigo-600 hover:text-indigo-900"
              >
                View My Borrowings
              </Link>
            </div>
          </div>
        ) : book && canBorrowBooks ? (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Borrow Book</h1>
            
            <div className="mb-6 bg-gray-50 p-4 rounded-md">
              <h2 className="text-lg font-medium text-gray-900 mb-2">{book.title}</h2>
              <p className="text-gray-600 mb-2">by {book.author}</p>
              <div className="text-sm text-gray-500">
                <span className="font-medium">Available Copies:</span> {book.availableCopies} of {book.copies}
              </div>
            </div>

            <form onSubmit={handleBorrowBook}>
              <div className="mb-6">
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Please select when you plan to return the book (maximum 30 days).
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        By borrowing this book, you agree to return it by the due date. Late returns may incur fines.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  href={`/dashboard/library/books/${bookId}`}
                  className="mr-4 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={borrowing}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {borrowing ? 'Processing...' : 'Borrow Book'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4" role="alert">
              <p className="text-blue-700">You do not have permission to borrow books.</p>
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/library/books"
                className="text-indigo-600 hover:text-indigo-900"
              >
                Return to Books Listing
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
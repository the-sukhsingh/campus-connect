'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';



export default function BookDetailsPage() {
  const { user, userRole } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bookId = Array.isArray(params.id) ? params.id[0] : params.id;
  console.log('Book ID:', bookId);
  // Fetch book details
  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!user || !bookId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/library/books?bookId=${bookId}&uid=${user?.uid}&action=get-book`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch book details');
        }

        const data = await response.json();
        setBook(data.book);
      } catch (err) {
        console.error('Error fetching book details:', err);
        setError('Failed to load book details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [user, bookId]);

  // Check if user can borrow books (faculty members and librarians)
  const canBorrowBooks = userRole === 'librarian';

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/library/books"
          className="text-indigo-600 hover:text-indigo-900 flex items-center"
        >
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Book Listing
        </Link>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6" role="alert">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Book details */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : book ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
              <span 
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  book.availableCopies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {book.availableCopies > 0 ? 'Available' : 'Unavailable'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Book Information</h2>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Author</dt>
                      <dd className="mt-1 text-sm text-gray-900">{book.author}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Genre</dt>
                      <dd className="mt-1 text-sm text-gray-900">{book.genre}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Unique Code</dt>
                      <dd className="mt-1 text-sm text-gray-900">{book.uniqueCode}</dd>
                    </div>
                    {book.publishedYear && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Published Year</dt>
                        <dd className="mt-1 text-sm text-gray-900">{book.publishedYear}</dd>
                      </div>
                    )}
                    {book.ISBN && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">ISBN</dt>
                        <dd className="mt-1 text-sm text-gray-900">{book.ISBN}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Availability</h2>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">Total Copies:</div>
                      <div className="text-sm font-medium">{book.copies}</div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm text-gray-500">Available Copies:</div>
                      <div className="text-sm font-medium">{book.availableCopies}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                {book.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Book Description</h2>
                    <div className="text-sm text-gray-700 prose max-w-none">
                      <p>{book.description}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6">
                  {canBorrowBooks && book.availableCopies > 0 ? (
                    <Link 
                      href={`/dashboard/librarian/lend?uniqueCode=${book.uniqueCode}&bookId=${book._id}`}
                      className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Lend This Book
                    </Link>
                  ) : book.availableCopies === 0 ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">This book is currently unavailable. All copies have been borrowed.</p>
                        </div>
                      </div>
                    </div>
                  ) : !canBorrowBooks ? (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">Only Librarian can lend this book.</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">Book not found.</p>
        </div>
      )}
    </div>
  );
}
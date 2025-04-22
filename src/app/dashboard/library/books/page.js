'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';


export default function BooksListingPage() {
  const { user, userRole } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genres, setGenres] = useState([]);

  // Fetch all books
  useEffect(() => {
    const fetchBooks = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/library/books?uid=${user?.uid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch books');
        }

        const data = await response.json();
        setBooks(data.books || []);

        // Extract unique genres for filtering
        const uniqueGenres = Array.from(new Set(data.books.map((book) => book.genre)));
        setGenres(uniqueGenres);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Failed to load books. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [user]);

  // Filter books based on search term and genre
  const filteredBooks = books.filter(book => {
    const matchesSearch = searchTerm ? 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.ISBN?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      : true;
      
    const matchesGenre = selectedGenre ? book.genre === selectedGenre : true;
    
    return matchesSearch && matchesGenre;
  });

  // Check if user can borrow books (faculty members and librarians)
  const canBorrowBooks = userRole === 'faculty' || userRole === 'librarian' || userRole === 'hod';

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Library Books</h1>
          <p className="text-gray-600 mt-1">Browse our collection of books</p>
        </div>
        <div className="mt-4 sm:mt-0">
          
        </div>
      </div>

      {/* Search and filter section */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                id="search"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search by title, author, or ISBN"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">Filter by Genre</label>
            <select
              id="genre"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6" role="alert">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Books listing */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No books found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <div key={book._id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">{book.title}</h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    book.availableCopies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {book.availableCopies > 0 ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">by {book.author}</p>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Genre:</span> {book.genre}
                </p>
                {book.publishedYear && (
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Published:</span> {book.publishedYear}
                  </p>
                )}
                <div className="text-sm text-gray-700 mb-4">
                  <span className="font-medium">Availability:</span> {book.availableCopies} of {book.copies} copies
                </div>
                
                {book.description && (
                  <div className="mt-2 mb-4">
                    <p className="text-sm text-gray-600 line-clamp-3">{book.description}</p>
                  </div>
                )}
                
                <div className="mt-4 flex justify-between items-center">
                  <Link
                    href={`/dashboard/library/books/${book._id}`}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    View Details
                  </Link>
                  
                  {canBorrowBooks && book.availableCopies > 0 && (
                    <Link
                      href={`/dashboard/library/books/${book._id}/borrow`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Borrow Book
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book count */}
      {!loading && filteredBooks.length > 0 && (
        <div className="mt-6 text-sm text-gray-500">
          Showing {filteredBooks.length} of {books.length} books
        </div>
      )}
    </div>
  );
}
'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function BooksListingPage() {
  const { user, userRole } = useAuth();
  const { theme } = useTheme();
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Fetch books
        const response = await fetch(`/api/library/books?uid=${user?.uid}&action=get-books`);
        console.log('Response:', response);
        if (!response.ok) {
          throw new Error('Failed to fetch books');
        }
        
        const data = await response.json();
        setBooks(data.books || []);
        
        // Extract unique genres
        const uniqueGenres = [...new Set(data.books.map(book => book.genre))].filter(Boolean);
        setGenres(uniqueGenres.sort());
        
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
  const filteredBooks = books.filter((book) => {
    const matchesSearch = searchTerm
      ? book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.ISBN?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false
      : true;
      
    const matchesGenre = selectedGenre ? book.genre === selectedGenre : true;
    
    return matchesSearch && matchesGenre;
  });

  return (
    <div className={`p-6 bg-[var(--background)] text-[var(--foreground)]`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Library Books</h1>
          <p className={`text-[var(--muted-foreground)] mt-1`}>Browse and manage the books in your college library</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard/hod/library"
            className={`${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} text-[var(--foreground)] py-2 px-4 rounded transition-colors`}
          >
            Back to Library Management
          </Link>
        </div>
      </div>
      
      {error && (
        <div className={`${theme === 'dark' ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-500 text-red-700'} border-l-4 p-4 mb-6`} role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="w-full md:w-1/2">
            <label htmlFor="search" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Search Books
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 py-2 px-3 border rounded-md w-full focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Search by title, author or ISBN..."
              />
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <label htmlFor="genre" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Filter by Genre
            </label>
            <select
              id="genre"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className={`py-2 px-3 border rounded-md w-full focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchTerm || selectedGenre ? 'No books match your search criteria.' : 'No books found in the library.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Title
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Author
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Genre
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    ISBN
                  </th>
                  <th scope="col" className={`px-6 py-3 text-center text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Available / Total
                  </th>
                </tr>
              </thead>
              <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                {filteredBooks.map((book) => (
                  <tr key={book._id} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium text-[var(--foreground)]`}>{book.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{book.author}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{book.genre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{book.ISBN || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`text-sm ${
                        book.availableCopies === 0 
                          ? (theme === 'dark' ? 'text-red-400 font-semibold' : 'text-red-600 font-semibold') 
                          : (theme === 'dark' ? 'text-gray-300' : 'text-gray-500')
                      }`}>
                        {book.availableCopies} / {book.copies}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default withRoleProtection(BooksListingPage, ['hod']);
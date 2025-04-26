'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function BookCatalogPage() {
  const { user, dbUser } = useAuth();
  const { theme } = useTheme();
  const [books, setBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genres, setGenres] = useState([]);
  const [view, setView] = useState('grid');

  // Fetch books from API
  const fetchBooks = async () => {
    try {
      setIsLoading(true);

      let url = `/api/library/books?action=get-books&uid=${user?.uid}&page=${currentPage}`;

      if (searchTerm) {
        url += `&query=${encodeURIComponent(searchTerm)}`;
      }

      if (selectedGenre) {
        url += `&genre=${encodeURIComponent(selectedGenre)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }

      const data = await response.json();
      setBooks(data.books || []);
      setTotalBooks(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Error fetching books is:', err);
      setError('Failed to load books. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch genres for filter dropdown
  const fetchGenres = async () => {
    try {
      if (!user) return;

      const response = await fetch(`/api/library/books?action=get-genres&uid=${user?.uid}`);

      if (!response.ok) {
        throw new Error('Failed to fetch genres');
      }

      const data = await response.json();

      setGenres(data.genres || []);
    } catch (err) {
      console.error('Error fetching genres:', err);
    }
  };

  // Fetch books on component mount and when dependencies change
  useEffect(() => {
    if (!dbUser) return;

    fetchBooks();
    fetchGenres();
  }, [dbUser, currentPage, searchTerm, selectedGenre]);

  // Handle search input
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle genre filter change
  const handleGenreChange = (e) => {
    setSelectedGenre(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedGenre('');
    setCurrentPage(1);
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} min-h-screen transition-colors duration-200`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Library Book Catalog</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Browse all books available in the library</p>
        </div>
      </div>

      {error && (
        <div className={`${theme === 'dark' ? 'bg-red-900 border-red-700 text-red-100' : 'bg-red-100 border-red-500 text-red-700'} border-l-4 p-4 mb-6`} role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 shadow-xl' : 'bg-white shadow-md'} rounded-lg p-4 mb-6`}>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="md:w-1/2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, or ISBN"
                className={`flex-1 px-3 py-2 rounded-md shadow-sm focus:outline-none ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-400 focus:border-indigo-400' 
                    : 'border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
              <button
                type="submit"
                className={`px-4 py-2 rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-indigo-700 text-white hover:bg-indigo-800'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Search
              </button>
            </form>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div>
              <select
                value={selectedGenre}
                onChange={handleGenreChange}
                className={`px-3 py-2 rounded-md shadow-sm focus:outline-none ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-400 focus:border-indigo-400' 
                    : 'border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
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

            {(searchTerm || selectedGenre) && (
              <button
                onClick={handleClearFilters}
                className={`px-3 py-2 text-sm transition-colors ${
                  theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Clear Filters
              </button>
            )}

            <div className={`border-l pl-2 ml-2 flex items-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded ${
                  view === 'grid' 
                    ? theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200' 
                    : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                aria-label="Grid view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded ${
                  view === 'list' 
                    ? theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200' 
                    : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                aria-label="List view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Books List */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 shadow-xl' : 'bg-white shadow-md'} rounded-lg overflow-hidden`}>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
          </div>
        ) : books.length === 0 ? (
          <div className="p-8 text-center">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>No books found matching your criteria.</p>
          </div>
        ) : (
          <>
            {view === 'grid' ? (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books && books.map((book) => (
                  <Link
                    key={book._id}
                    href={`/dashboard/library/books/${book._id}`}
                    className="block"
                  >
                    <div
                      className={`border rounded-lg overflow-hidden transition-shadow hover:shadow-md ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="p-4">
                        <h3 className={`font-semibold text-lg mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{book.title}</h3>
                        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm mb-2`}>by {book.author}</p>

                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {book.genre}
                          </span>

                          <span className={`text-xs px-2 py-1 rounded ${
                            book.availableCopies > 0 
                              ? theme === 'dark' ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'
                              : theme === 'dark' ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'
                          }`}>
                            {book.availableCopies} / {book.copies} available
                          </span>
                        </div>

                        {book.ISBN && (
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-2`}>ISBN: {book.ISBN}</p>
                        )}

                        {book.description && (
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mt-2 line-clamp-2`}>
                            {book.description}
                          </p>
                        )}

                        {book.uniqueCode && (
                          <div className={`mt-3 pt-3 border-t flex justify-between items-center ${
                            theme === 'dark' ? 'border-gray-600' : 'border-gray-100'
                          }`}>
                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Code: <span className="font-mono font-medium">{book.uniqueCode}</span>
                            </div>

                            {book.availableCopies > 0 && (
                              <div className={`text-xs ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'}`}>Available</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${
                  theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                }`}>
                  <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Book Details
                      </th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Genre
                      </th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Code
                      </th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Availability
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${
                    theme === 'dark' ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'
                  }`}>
                    {books.map((book) => (
                      <tr key={book._id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4">
                          <Link href={`/dashboard/library/books/${book._id}`}>
                            <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{book.title}</div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>by {book.author}</div>
                            {book.ISBN && (
                              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ISBN: {book.ISBN}</div>
                            )}
                            {book.publishedYear && (
                              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Published: {book.publishedYear}</div>
                            )}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-xs px-2 py-1 rounded ${
                            theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {book.genre}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap font-mono text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {book.uniqueCode || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            book.availableCopies > 0
                              ? theme === 'dark' ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'
                              : theme === 'dark' ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'
                          }`}>
                            {book.availableCopies} / {book.copies} copies
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`px-6 py-4 flex items-center justify-between border-t ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                      Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * 10, totalBooks)}
                      </span>{' '}
                      of <span className="font-medium">{totalBooks}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                          currentPage === 1
                            ? theme === 'dark' 
                              ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
                              : 'border-gray-300 bg-white text-gray-300 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
                              : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Page numbers - show limited numbers with ellipsis */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? theme === 'dark'
                                  ? 'z-10 bg-gray-700 border-indigo-500 text-indigo-300'
                                  : 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : theme === 'dark'
                                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                          currentPage === totalPages
                            ? theme === 'dark' 
                              ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
                              : 'border-gray-300 bg-white text-gray-300 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
                              : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing hod, librarian, and student access
export default withRoleProtection(BookCatalogPage, ['hod', 'librarian', 'student', 'faculty']);
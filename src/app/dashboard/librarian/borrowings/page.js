'use client';

import { useState, useEffect } from 'react';
import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

function BorrowingHistoryPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [borrowings, setBorrowings] = useState([]);
  const [totalBorrowings, setTotalBorrowings] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch borrowings from API
  useEffect(() => {
    const fetchBorrowings = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError('');

        const response = await fetch(
          `/api/library/borrowings?uid=${user?.uid}&status=${activeTab}&page=${currentPage}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch borrowing history');
        }

        const data = await response.json();

        setBorrowings(data.borrowings || []);
        setTotalBorrowings(data.total || 0);
        setTotalPages(data.pages || 1);
      } catch (err) {
        console.error('Error fetching borrowing history:', err);
        setError('Failed to load borrowing history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBorrowings();
  }, [user, activeTab, currentPage]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate if book is overdue
  const isOverdue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookDueDate = new Date(dueDate);
    bookDueDate.setHours(0, 0, 0, 0);
    return bookDueDate < today;
  };

  // Filter borrowings based on search term
  const filteredBorrowings = borrowings.filter((borrowing) => {
    if (!searchTerm.trim()) return true;

    const searchTermLower = searchTerm.toLowerCase();

    return (
      borrowing.book.title.toLowerCase().includes(searchTermLower) ||
      borrowing.book.author.toLowerCase().includes(searchTermLower) ||
      borrowing.student.displayName.toLowerCase().includes(searchTermLower) ||
      (borrowing.book.uniqueCode &&
        borrowing.book.uniqueCode.toLowerCase().includes(searchTermLower))
    );
  });

  return (
    <div
      className={`p-6 min-h-screen ${
        theme === 'dark'
          ? 'bg-gray-900 text-gray-100'
          : 'bg-gray-50 text-gray-800'
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1
            className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
            }`}
          >
            Borrowing History
          </h1>
          <p
            className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            } mt-1`}
          >
            View and manage all book borrowings
          </p>
        </div>

        <div className="flex space-x-2">
          <Link
            href="/dashboard/librarian/lend"
            className={`px-4 py-2 ${
              theme === 'dark'
                ? 'bg-green-800 hover:bg-green-700'
                : 'bg-green-600 hover:bg-green-700'
            } text-white rounded-md shadow-sm flex items-center`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Lend Book
          </Link>

          <Link
            href="/dashboard/librarian/returns"
            className={`px-4 py-2 ${
              theme === 'dark'
                ? 'bg-indigo-800 hover:bg-indigo-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white rounded-md shadow-sm flex items-center`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Returns
          </Link>
        </div>
      </div>

      {error && (
        <div
          className={`p-4 mb-6 ${
            theme === 'dark'
              ? 'bg-red-900 border-red-700 text-red-200'
              : 'bg-red-50 border-red-400 text-red-700'
          } border-l-4 rounded`}
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      <div
        className={`mb-6 p-4 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded-lg shadow-md`}
      >
        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* Borrowing Status Tabs */}
          <div className="flex space-x-1 p-1 rounded-lg bg-opacity-20 flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'all'
                  ? `${
                      theme === 'dark'
                        ? 'bg-indigo-900 text-white'
                        : 'bg-indigo-600 text-white'
                    }`
                  : `${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'active'
                  ? `${
                      theme === 'dark'
                        ? 'bg-green-900 text-white'
                        : 'bg-green-600 text-white'
                    }`
                  : `${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('returned')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'returned'
                  ? `${
                      theme === 'dark'
                        ? 'bg-blue-900 text-white'
                        : 'bg-blue-600 text-white'
                    }`
                  : `${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
              }`}
            >
              Returned
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'overdue'
                  ? `${
                      theme === 'dark'
                        ? 'bg-red-900 text-white'
                        : 'bg-red-600 text-white'
                    }`
                  : `${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
              }`}
            >
              Overdue
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className={`h-5 w-5 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search borrowings..."
              className={`pl-10 w-full py-2 px-3 border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 placeholder-gray-400 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            />
          </div>
        </div>
      </div>

      {/* Borrowings Table */}
      <div
        className={`${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded-lg shadow-md overflow-hidden`}
      >
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div
              className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
                theme === 'dark' ? 'border-indigo-500' : 'border-indigo-500'
              }`}
            ></div>
          </div>
        ) : filteredBorrowings.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-12 w-12 mx-auto ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h3
              className={`mt-2 text-lg font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
              }`}
            >
              No borrowings found
            </h3>
            <p
              className={`mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {searchTerm
                ? 'Try adjusting your search.'
                : 'No borrowings in this category.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead
                  className={`${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <tr>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      Book Details
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      Student
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      Issue Date
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      Due Date
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-right text-xs font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`${
                    theme === 'dark'
                      ? 'bg-gray-800 divide-gray-700'
                      : 'bg-white divide-gray-200'
                  }`}
                >
                  {filteredBorrowings.map((borrowing) => (
                    <tr
                      key={borrowing._id}
                      className={`${
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`shrink-0 h-10 w-3 rounded-sm ${
                              borrowing.book.genre
                                ? theme === 'dark'
                                  ? 'bg-indigo-800'
                                  : 'bg-indigo-600'
                                : theme === 'dark'
                                ? 'bg-gray-700'
                                : 'bg-gray-400'
                            }`}
                          ></div>
                          <div className="ml-4">
                            <div
                              className={`text-sm font-medium ${
                                theme === 'dark'
                                  ? 'text-gray-100'
                                  : 'text-gray-900'
                              }`}
                            >
                              {borrowing.book.title}
                            </div>
                            <div
                              className={`text-sm ${
                                theme === 'dark'
                                  ? 'text-gray-400'
                                  : 'text-gray-500'
                              }`}
                            >
                              by {borrowing.book.author}
                            </div>
                            {borrowing.book.uniqueCode && (
                              <div
                                className={`text-xs ${
                                  theme === 'dark'
                                    ? 'text-gray-500'
                                    : 'text-gray-500'
                                }`}
                              >
                                Code: {borrowing.book.uniqueCode}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            theme === 'dark'
                              ? 'text-gray-100'
                              : 'text-gray-900'
                          }`}
                        >
                          {borrowing.student.displayName}
                        </div>
                        <div
                          className={`text-sm ${
                            theme === 'dark'
                              ? 'text-gray-400'
                              : 'text-gray-500'
                          }`}
                        >
                          {borrowing.student.email}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        {formatDate(borrowing.issueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            borrowing.returnDate
                              ? theme === 'dark'
                                ? 'bg-green-900 text-green-200'
                                : 'bg-green-100 text-green-800'
                              : isOverdue(borrowing.dueDate)
                              ? theme === 'dark'
                                ? 'bg-red-900 text-red-200'
                                : 'bg-red-100 text-red-800'
                              : theme === 'dark'
                              ? 'bg-blue-900 text-blue-200'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {formatDate(borrowing.dueDate)}
                          {!borrowing.returnDate &&
                            isOverdue(borrowing.dueDate) &&
                            ' (Overdue)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {borrowing.returnDate ? (
                          <div>
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                theme === 'dark'
                                  ? 'bg-green-900 text-green-200'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              Returned
                            </span>
                            <div
                              className={`text-xs mt-1 ${
                                theme === 'dark'
                                  ? 'text-gray-400'
                                  : 'text-gray-500'
                              }`}
                            >
                              {formatDate(borrowing.returnDate)}
                            </div>
                          </div>
                        ) : borrowing.returnRequested ? (
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              theme === 'dark'
                                ? 'bg-yellow-900 text-yellow-200'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            Return Requested
                          </span>
                        ) : isOverdue(borrowing.dueDate) ? (
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              theme === 'dark'
                                ? 'bg-red-900 text-red-200'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            Overdue
                          </span>
                        ) : (
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              theme === 'dark'
                                ? 'bg-blue-900 text-blue-200'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/library/books/${borrowing.book._id}`}
                          className={`${
                            theme === 'dark'
                              ? 'text-indigo-400 hover:text-indigo-300'
                              : 'text-indigo-600 hover:text-indigo-900'
                          }`}
                        >
                          View Book
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className={`px-6 py-3 flex items-center justify-between border-t ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? `${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                          }`
                        : `${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? `${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                          }`
                        : `${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p
                      className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                      }`}
                    >
                      Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * 10, totalBorrowings)}
                      </span>{' '}
                      of <span className="font-medium">{totalBorrowings}</span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                          currentPage === 1
                            ? `${
                                theme === 'dark'
                                  ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                              }`
                            : `${
                                theme === 'dark'
                                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      {/* Page numbers */}
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
                                ? `${
                                    theme === 'dark'
                                      ? 'z-10 bg-indigo-900 border-indigo-500 text-indigo-300'
                                      : 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                  }`
                                : `${
                                    theme === 'dark'
                                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`
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
                            ? `${
                                theme === 'dark'
                                  ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                              }`
                            : `${
                                theme === 'dark'
                                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
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

// Wrap the component with role protection, allowing admin and librarian access
export default withRoleProtection(BorrowingHistoryPage, ['hod', 'librarian']);
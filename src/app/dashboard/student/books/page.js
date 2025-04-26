'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';



function MyBooksPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [borrowings, setBorrowings] = useState([]);
  const [totalBorrowings, setTotalBorrowings] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('borrowed');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch borrowings based on active tab
  useEffect(() => {
    if (!user) return;
    
    fetchBorrowings();
  }, [user, activeTab, currentPage]);
  
  // Fetch borrowings from API
  const fetchBorrowings = async () => {
    try {
      setIsLoading(true);
      
      let status;
      if (activeTab === 'borrowed') status = 'borrowed';
      else if (activeTab === 'requested') status = 'return-requested';
      else if (activeTab === 'returned') status = 'returned';
      
      const response = await fetch(
        `/api/library/borrowings?action=get-student-borrowings&uid=${user?.uid}&page=${currentPage}&status=${status || ''}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch book borrowings');
      }
      
      const data = await response.json();
      setBorrowings(data.borrowings || []);
      setTotalBorrowings(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Error fetching borrowings:', err);
      setError('Failed to load your books. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Request book return
  const handleReturnRequest = async (borrowingId) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/library/borrowings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user?.uid,
          borrowingId,
          action: 'return-request'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to request book return');
      }
      
      // Refresh the borrowings list
      await fetchBorrowings();
      
      // Show success notification (could be improved with a toast)
      alert('Return request submitted successfully');
    } catch (err) {
      console.error('Error requesting book return:', err);
      setError('Failed to request book return. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
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

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-[var(--background)] text-white' : 'bg-gray-50 text-gray-800'} min-h-svh`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>My Books</h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Manage your borrowed books and returns</p>
        </div>
        <div className="flex space-x-2">
          <Link 
            href="/dashboard/student/books/catalog" 
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              theme === 'dark' 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
            }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Browse Library
          </Link>
        </div>
      </div>

      {error && (
        <div className={`border-l-4 border-red-500 p-4 mb-6 ${
          theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-700'
        }`} role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className={`rounded-lg shadow-md mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <nav className="flex -mb-px">
            <button
              onClick={() => {
                setActiveTab('borrowed');
                setCurrentPage(1);
              }}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'borrowed'
                  ? `border-indigo-500 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`
                  : `border-transparent ${
                      theme === 'dark' 
                        ? 'text-gray-400 hover:text-gray-300 hover:border-gray-600' 
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`
              }`}
            >
              Borrowed
            </button>
            <button
              onClick={() => {
                setActiveTab('requested');
                setCurrentPage(1);
              }}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'requested'
                  ? `border-indigo-500 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`
                  : `border-transparent ${
                      theme === 'dark' 
                        ? 'text-gray-400 hover:text-gray-300 hover:border-gray-600' 
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`
              }`}
            >
              Return Requested
            </button>
            <button
              onClick={() => {
                setActiveTab('returned');
                setCurrentPage(1);
              }}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'returned'
                  ? `border-indigo-500 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`
                  : `border-transparent ${
                      theme === 'dark' 
                        ? 'text-gray-400 hover:text-gray-300 hover:border-gray-600' 
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`
              }`}
            >
              Returned
            </button>
          </nav>
        </div>
      </div>

      {/* Books list */}
      <div className={`rounded-lg shadow-md overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
              theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'
            }`}></div>
          </div>
        ) : borrowings.length === 0 ? (
          <div className="p-8 text-center">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              {activeTab === 'borrowed'
                ? 'You have no borrowed books.'
                : activeTab === 'requested'
                ? 'You have no pending return requests.'
                : 'You have no returned books history.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Book
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Issue Date
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Due Date
                    </th>
                    {activeTab === 'returned' && (
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Return Date
                      </th>
                    )}
                    {activeTab === 'returned' && (
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Fine
                      </th>
                    )}
                    {activeTab === 'borrowed' && (
                      <th scope="col" className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
                }`}>
                  {borrowings.map((borrowing) => (
                    <tr key={borrowing._id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                        }`}>{borrowing.book.title}</div>
                        <div className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          By: {borrowing.book.author} | {borrowing.book.genre}
                        </div>
                        {borrowing.book.ISBN && (
                          <div className={`text-xs ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                          }`}>ISBN: {borrowing.book.ISBN}</div>
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {formatDate(borrowing.issueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isOverdue(borrowing.dueDate) && borrowing.status !== 'returned'
                            ? theme === 'dark' ? 'bg-red-900/60 text-red-200' : 'bg-red-100 text-red-800'
                            : theme === 'dark' ? 'bg-green-900/60 text-green-200' : 'bg-green-100 text-green-800'
                        }`}>
                          {formatDate(borrowing.dueDate)}
                          {isOverdue(borrowing.dueDate) && borrowing.status !== 'returned' && ' (Overdue)'}
                        </span>
                      </td>
                      
                      {activeTab === 'returned' && (
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {borrowing.returnDate ? formatDate(borrowing.returnDate) : 'N/A'}
                        </td>
                      )}
                      
                      {activeTab === 'returned' && (
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {borrowing.fine ? `₹${borrowing.fine.toFixed(2)}` : 'None'}
                        </td>
                      )}
                      
                      {activeTab === 'borrowed' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleReturnRequest(borrowing._id)}
                            className={`${
                              theme === 'dark' 
                                ? 'text-indigo-400 hover:text-indigo-300' 
                                : 'text-indigo-600 hover:text-indigo-900'
                            }`}
                          >
                            Request Return
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`px-6 py-3 flex items-center justify-between border-t ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? theme === 'dark' 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-700' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                        : theme === 'dark'
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? theme === 'dark' 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-700' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                        : theme === 'dark'
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                      Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * 10, totalBorrowings)}
                      </span>{' '}
                      of <span className="font-medium">{totalBorrowings}</span> results
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
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-700' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                            : theme === 'dark'
                              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border-gray-700'
                              : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
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
                                ? theme === 'dark'
                                  ? 'z-10 bg-indigo-900/50 border-indigo-500 text-indigo-300'
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
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-700' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                            : theme === 'dark'
                              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border-gray-700'
                              : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4-4a1 1 0 01-1.414 0z" clipRule="evenodd" />
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

// Wrap the component with role protection, allowing admin, librarian, and student access
export default withRoleProtection(MyBooksPage, ['hod', 'librarian', 'student']);
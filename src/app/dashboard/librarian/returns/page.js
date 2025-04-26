'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function ReturnRequestsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [borrowings, setBorrowings] = useState([]);
  const [totalBorrowings, setTotalBorrowings] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [currentBorrowing, setCurrentBorrowing] = useState(null);
  const [fine, setFine] = useState(undefined);
  
  // Fetch return requests from API
  const fetchReturnRequests = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(
        `/api/library/borrowings?action=get-pending-returns&uid=${user?.uid}&page=${currentPage}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch return requests');
      }
      
      const data = await response.json();
      setBorrowings(data.borrowings || []);
      setTotalBorrowings(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Error fetching return requests:', err);
      setError('Failed to load return requests. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch return requests when component mounts
  useEffect(() => {
    if (!user) return;
    
    fetchReturnRequests();
  }, [user, currentPage]);
  
  // Open approval modal
  const openApproveModal = (borrowing) => {
    setCurrentBorrowing(borrowing);
    
    // Calculate fine if book is overdue
    if (isOverdue(borrowing.dueDate)) {
      const dueDate = new Date(borrowing.dueDate);
      const returnRequested = new Date(borrowing.returnRequested || new Date());
      const diffTime = Math.abs(returnRequested.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // ₹5 per day overdue
      setFine(diffDays * 5);
    } else {
      setFine(undefined);
    }
    
    setShowApproveModal(true);
  };
  
  // Handle return approval
  const handleApproveReturn = async () => {
    if (!user || !currentBorrowing) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/library/borrowings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user?.uid,
          borrowingId: currentBorrowing._id,
          action: 'approve-return',
          fine: currentBorrowing.fine || 0
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve return');
      }
      
      // Refresh the list
      await fetchReturnRequests();
      
      // Close modal
      setShowApproveModal(false);
    } catch (err) {
      console.error('Error approving return:', err);
      setError('Failed to approve return. Please try again later.');
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
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Return Requests</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage book return requests</p>
        </div>
        
      </div>

      {error && (
        <div className={`p-4 mb-6 ${theme === 'dark' ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-500 text-red-700'} border-l-4 rounded`} role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Return Requests Table */}
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden`}>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-500' : 'border-indigo-500'}`}></div>
          </div>
        ) : borrowings.length === 0 ? (
          <div className="p-8 text-center">
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No pending return requests.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Book
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Student
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Issue Date
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Due Date
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Request Date
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Status
                    </th>
                    <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                  {borrowings.map((borrowing) => (
                    <tr key={borrowing._id} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{borrowing.book.title}</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          By: {borrowing.book.author}
                        </div>
                        {borrowing.book.ISBN && (
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>ISBN: {borrowing.book.ISBN}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{borrowing.student.displayName}</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{borrowing.student.email}</div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(borrowing.issueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isOverdue(borrowing.dueDate)
                            ? `${theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`
                            : `${theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`
                        }`}>
                          {formatDate(borrowing.dueDate)}
                          {isOverdue(borrowing.dueDate) && ' (Overdue)'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {borrowing.returnRequested && formatDate(borrowing.returnRequested)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`}>
                          Return Requested
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openApproveModal(borrowing)}
                          className={`${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-900'}`}
                        >
                          Approve Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`px-6 py-3 flex items-center justify-between border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? `${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}`
                        : `${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? `${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}`
                        : `${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`
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
                            ? `${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}`
                            : `${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`
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
                                ? `${theme === 'dark' ? 'z-10 bg-indigo-900 border-indigo-500 text-indigo-300' : 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'}`
                                : `${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`
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
                            ? `${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}`
                            : `${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`
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

      {/* Approve Return Modal */}
      {showApproveModal && currentBorrowing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full`}>
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Approve Book Return</h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className={`mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-semibold">Book:</span> {currentBorrowing.book.title}
                </p>
                <p className={`mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-semibold">Student:</span> {currentBorrowing.student.displayName}
                </p>
                <p className={`mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-semibold">Due Date:</span> {formatDate(currentBorrowing.dueDate)}
                </p>
                <p className={`mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-semibold">Return Requested:</span> {formatDate(currentBorrowing.returnRequested || new Date().toISOString())}
                </p>
              </div>
              
              {isOverdue(currentBorrowing.dueDate) && (
                <div className={`border-l-4 p-4 ${theme === 'dark' ? 'bg-yellow-900 border-yellow-600' : 'bg-yellow-50 border-yellow-400'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className={`h-5 w-5 ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm ${theme === 'dark' ? 'text-yellow-100' : 'text-yellow-700'}`}>
                        This book is overdue. Consider applying a fine.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="fine" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fine Amount (₹)
                </label>
                <input
                  type="number"
                  id="fine"
                  name="fine"
                  value={fine || ''}
                  onChange={(e) => setFine(e.target.value ? Number(e.target.value) : undefined)}
                  min="0"
                  step="5"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                />
                <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Leave empty for no fine, or enter an amount in rupees.
                </p>
              </div>
            </div>
            
            <div className={`px-6 py-4 flex justify-end space-x-3 rounded-b-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  setCurrentBorrowing(null);
                  setFine(undefined);
                }}
                className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${theme === 'dark' ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} focus:outline-none`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveReturn}
                disabled={isLoading}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${theme === 'dark' ? 'bg-indigo-700 hover:bg-indigo-600' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Approve Return'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing admin and librarian access
export default withRoleProtection(ReturnRequestsPage, ['hod', 'librarian']);
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';


export default function BorrowingsListingPage() {
  const { user, userRole } = useAuth();
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [returnRequesting, setReturnRequesting] = useState(null);

  // Fetch borrowings
  useEffect(() => {
    const fetchBorrowings = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/library/borrowings?uid=${user?.uid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch borrowings');
        }

        const data = await response.json();
        setBorrowings(data.borrowings || []);
      } catch (err) {
        console.error('Error fetching borrowings:', err);
        setError(err.message || 'Failed to load borrowings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowings();
  }, [user]);

  // Handle return request
  const handleReturnRequest = async (borrowingId) => {
    if (!user) return;

    try {
      setReturnRequesting(borrowingId);
      setError(null);
      
      const response = await fetch(`/api/library/borrowings/${borrowingId}/return-request`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uid: user?.uid
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request return');
      }

      // Update the borrowing status in the state
      setBorrowings(prevBorrowings => 
        prevBorrowings.map(b => 
          b._id === borrowingId 
            ? { ...b, status: 'return-requested', returnRequested} 
            : b
        )
      );
    } catch (err) {
      console.error('Error requesting return:', err);
      setError(err.message || 'Failed to request return. Please try again.');
    } finally {
      setReturnRequesting(null);
    }
  };

  // Filter borrowings based on tab
  const currentBorrowings = borrowings.filter(b => b.status !== 'returned');
  const borrowingHistory = borrowings.filter(b => b.status === 'returned');

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if a book is overdue
  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Borrowings</h1>
          <p className="text-gray-600 mt-1">View and manage your borrowed books</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            href="/dashboard/library/books"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Browse Books
          </Link>
          
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6" role="alert">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('current')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'current'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Current Borrowings
              {currentBorrowings.length > 0 && (
                <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {currentBorrowings.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Borrowing History
              {borrowingHistory.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {borrowingHistory.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : activeTab === 'current' ? (
        currentBorrowings.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">You don&apos;t have any current borrowings.</p>
            <Link 
              href="/dashboard/library/books"
              className="mt-4 inline-block text-indigo-600 hover:text-indigo-900"
            >
              Browse Books to Borrow
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Book
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentBorrowings.map((borrowing) => (
                    <tr key={borrowing._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {borrowing.book.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          by {borrowing.book.author}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(borrowing.issueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isOverdue(borrowing.dueDate) && borrowing.status === 'borrowed' ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {formatDate(borrowing.dueDate)}
                          {isOverdue(borrowing.dueDate) && borrowing.status === 'borrowed' && (
                            <span className="block text-xs font-bold text-red-600 mt-1">
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          borrowing.status === 'borrowed' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {borrowing.status === 'borrowed' ? 'Borrowed' : 'Return Requested'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {borrowing.status === 'borrowed' ? (
                          <button
                            onClick={() => handleReturnRequest(borrowing._id)}
                            disabled={returnRequesting === borrowing._id}
                            className={`text-indigo-600 hover:text-indigo-900 ${
                              returnRequesting === borrowing._id ? 'opacity-50 cursor-wait' : ''
                            }`}
                          >
                            {returnRequesting === borrowing._id ? 'Processing...' : 'Request Return'}
                          </button>
                        ) : (
                          <span className="text-gray-500">Return Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        borrowingHistory.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">You don&apos;t have any borrowing history.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Book
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Borrowed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Returned
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fine (if any)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {borrowingHistory.map((borrowing) => (
                    <tr key={borrowing._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {borrowing.book.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          by {borrowing.book.author}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(borrowing.issueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {borrowing.returnDate ? formatDate(borrowing.returnDate) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {borrowing.fine ? (
                          <span className="text-sm font-medium text-red-600">
                            ₹{borrowing.fine.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Borrowing guidelines */}
      <div className="mt-8 bg-blue-50 p-4 rounded-md border border-blue-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Borrowing Guidelines</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Books are typically issued for 14 days.</li>
                <li>You can request a return from this page when you&apos;re ready to return the book.</li>
                <li>Return the physical book to the library after requesting a return.</li>
                <li>Late returns may incur fines (₹10 per day).</li>
                <li>Contact the librarian if you need assistance with your borrowings.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
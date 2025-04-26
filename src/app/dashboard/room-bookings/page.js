'use client';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MyBookingsPage() {
  const { user, dbUser } = useAuth();
  const { theme } = useTheme();
  const [bookings, setBookings] = useState([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch bookings on component mount
  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError('');
        
        let url = `/api/room-bookings?action=get-my-bookings&uid=${user?.uid}&page=${currentPage}`;
        
        // Add status filter if not showing all
        if (activeTab !== 'all') {
          url += `&status=${activeTab}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        
        const data = await response.json();
        setBookings(data.bookings || []);
        setTotalBookings(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, currentPage, activeTab]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSuccessMessage('');
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId) => {
    try {
      setCancellingId(bookingId);
      
      const response = await fetch('/api/room-bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          bookingId: bookingId,
          action: 'cancel',
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel booking');
      }
      
      const data = await response.json();
      
      // Update booking in list
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { ...booking, status: 'cancelled' } 
          : booking
      ));
      
      setSuccessMessage(data.message || 'Booking cancelled successfully');
    } catch (err) {
      console.error('Error canceling booking:', err);
      setError(err.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{status}</span>;
    }
  };

  // Add a dark mode version of the status badge function
  const getStatusBadgeDark = (status) => {
    switch(status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900 text-yellow-200">Pending</span>;
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200">Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-200">Rejected</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400">{status}</span>;
    }
  };

  // Check if booking is in the past
  const isPastBooking = (date) => {
    const bookingDate = new Date(date);
    bookingDate.setHours(23, 59, 59);
    return bookingDate < new Date();
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-[var(--background)] text-gray-100' : 'bg-white text-gray-800'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>My Room Bookings</h1>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Manage your room reservations</p>
        </div>
        <div className="flex space-x-2">
          <Link
            href="/dashboard/rooms"
            className={`${
              theme === 'dark' 
                ? 'bg-indigo-700 hover:bg-indigo-800' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white py-2 px-4 rounded transition-colors`}
          >
            Book a Room
          </Link>
          
        </div>
      </div>

      {successMessage && (
        <div className={`${
          theme === 'dark'
            ? 'bg-green-900 border-green-700'
            : 'bg-green-100 border-green-500'
        } border-l-4 text-${theme === 'dark' ? 'green-200' : 'green-700'} p-4 mb-6`} role="alert">
          <p>{successMessage}</p>
        </div>
      )}

      {error && (
        <div className={`${
          theme === 'dark'
            ? 'bg-red-900 border-red-700'
            : 'bg-red-100 border-red-500'
        } border-l-4 text-${theme === 'dark' ? 'red-200' : 'red-700'} p-4 mb-6`} role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Status tabs */}
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden mb-6`}>
        <div className={`flex border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => handleTabChange('all')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'all'
                ? theme === 'dark'
                  ? 'border-b-2 border-indigo-400 text-indigo-400'
                  : 'border-b-2 border-indigo-500 text-indigo-600'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleTabChange('pending')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'pending'
                ? theme === 'dark'
                  ? 'border-b-2 border-indigo-400 text-indigo-400'
                  : 'border-b-2 border-indigo-500 text-indigo-600'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => handleTabChange('approved')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'approved'
                ? theme === 'dark'
                  ? 'border-b-2 border-indigo-400 text-indigo-400'
                  : 'border-b-2 border-indigo-500 text-indigo-600'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => handleTabChange('rejected')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'rejected'
                ? theme === 'dark'
                  ? 'border-b-2 border-indigo-400 text-indigo-400'
                  : 'border-b-2 border-indigo-500 text-indigo-600'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => handleTabChange('cancelled')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'cancelled'
                ? theme === 'dark'
                  ? 'border-b-2 border-indigo-400 text-indigo-400'
                  : 'border-b-2 border-indigo-500 text-indigo-600'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Bookings listing */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
              theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'
            }`}></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className={`p-6 text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
            <p>No bookings found.</p>
            {activeTab !== 'all' && (
              <button
                onClick={() => handleTabChange('all')}
                className={`mt-2 ${
                  theme === 'dark' 
                    ? 'text-indigo-400 hover:text-indigo-300' 
                    : 'text-indigo-600 hover:text-indigo-800'
                }`}
              >
                View all bookings
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    } uppercase tracking-wider`}
                  >
                    Room
                  </th>
                  <th
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    } uppercase tracking-wider`}
                  >
                    Date & Time
                  </th>
                  <th
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    } uppercase tracking-wider`}
                  >
                    Purpose
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
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    } uppercase tracking-wider`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                {bookings.map((booking) => (
                  <tr key={booking._id} className={
                    isPastBooking(booking.date) 
                      ? theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50' 
                      : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{booking.room.name}</div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {booking.room.building}, Room {booking.room.roomNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{formatDate(booking.date)}</div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {booking.startTime} - {booking.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        {booking.title}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} capitalize`}>
                        {booking.purpose}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {theme === 'dark' ? (
                        getStatusBadgeDark(booking.status)
                      ) : (
                        getStatusBadge(booking.status)
                      )}
                      {booking.status === 'rejected' && booking.rejectionReason && (
                        <div className={`text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mt-1`}>
                          Reason: {booking.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {booking.status === 'pending' && !isPastBooking(booking.date) && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          disabled={cancellingId === booking._id}
                          className={`${
                            theme === 'dark'
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-red-600 hover:text-red-900'
                          } ${
                            cancellingId === booking._id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {cancellingId === booking._id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                      {booking.status === 'approved' && !isPastBooking(booking.date) && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          disabled={cancellingId === booking._id}
                          className={`${
                            theme === 'dark'
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-red-600 hover:text-red-900'
                          } ${
                            cancellingId === booking._id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {cancellingId === booking._id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        } border-t pt-4`}>
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border rounded-md ${
                currentPage === 1
                  ? theme === 'dark'
                    ? "bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                  : theme === 'dark'
                    ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border rounded-md ${
                currentPage === totalPages
                  ? theme === 'dark'
                    ? "bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                  : theme === 'dark'
                    ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Showing <span className="font-medium">{bookings.length > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * 10, totalBookings)}
                </span>{" "}
                of <span className="font-medium">{totalBookings}</span> results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                    currentPage === 1
                      ? theme === 'dark'
                        ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-white border-gray-300 text-gray-300 cursor-not-allowed"
                      : theme === 'dark'
                        ? "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Page numbers */}
                {[...Array(totalPages).keys()].map((x) => {
                  const pageNumber = x + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    Math.abs(pageNumber - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? theme === 'dark'
                              ? "z-10 bg-gray-700 border-indigo-500 text-indigo-300"
                              : "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                            : theme === 'dark'
                              ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <span
                        key={pageNumber}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          theme === 'dark'
                            ? "bg-gray-800 border-gray-700 text-gray-400"
                            : "bg-white border-gray-300 text-gray-700"
                        }`}
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                    currentPage === totalPages
                      ? theme === 'dark'
                        ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-white border-gray-300 text-gray-300 cursor-not-allowed"
                      : theme === 'dark'
                        ? "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
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
    </div>
  );
}
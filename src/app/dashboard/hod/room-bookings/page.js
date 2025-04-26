'use client';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function HODRoomBookingsPage() {
  const { theme } = useTheme();
  const { user, dbUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    availableRooms: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
  });
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('pending');
  const [dateFilter, setDateFilter] = useState('');
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (!user || !dbUser || dbUser.role !== 'hod') return;
    
    fetchRooms();
    fetchBookings();
  }, [user, dbUser, statusFilter]);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`/api/rooms?action=get-rooms&uid=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch rooms');
      
      const data = await response.json();
      setRooms(data.rooms || []);
      setStats(prev => ({...prev, availableRooms: data.rooms?.length || 0}));
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load rooms. Please try again later.');
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Build the query with filters
      let query = `/api/room-bookings?uid=${user?.uid}`;
      if (statusFilter) {
        query += `&status=${statusFilter}`;
      }
      if (dateFilter) {
        query += `&date=${dateFilter}`;
      }
      
      const response = await fetch(query);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      
      const data = await response.json();
      setBookings(data.bookings || []);
      
      // Update statistics
      const pendingCount = data.bookings.filter(booking => booking.status === 'pending').length;
      const approvedCount = data.bookings.filter(booking => booking.status === 'approved').length;
      
      setStats(prev => ({
        ...prev, 
        totalBookings: data.bookings.length,
        pendingBookings: pendingCount,
        approvedBookings: approvedCount
      }));
      
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      setLoadingAction(true);
      const response = await fetch('/api/room-bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          bookingId,
          status: 'approved',
          reason:'Approved by HOD',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve booking');
      }
      
      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      console.error('Error approving booking:', err);
      setError(err.message || 'Failed to approve booking. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  const openRejectModal = (bookingId) => {
    setCurrentBookingId(bookingId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectBooking = async () => {
    try {
      if (!currentBookingId) return;
      
      setLoadingAction(true);
      const response = await fetch('/api/room-bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          bookingId: currentBookingId,
          status: 'rejected',
          rejectionReason,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject booking');
      }
      
      // Close the modal and refresh bookings
      setShowRejectModal(false);
      setCurrentBookingId(null);
      setRejectionReason('');
      await fetchBookings();
    } catch (err) {
      console.error('Error rejecting booking:', err);
      setError(err.message || 'Failed to reject booking. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('pending');
    setDateFilter('');
    fetchBookings();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd');
  };

  const displayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // Convert 24-hour format to 12-hour format with AM/PM
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatTimeRange = (startTime, endTime) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      {/* Admin Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1">Manage and approve room booking requests</p>
      </div>

      {/* Filters Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium mb-1">Status</label>
            <select 
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
          </div>
          <div>
            <label htmlFor="date-filter" className="block text-sm font-medium mb-1">Date</label>
            <input 
              type="date" 
              id="date-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={`block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
            />
          </div>
        </div>
        <button
          onClick={handleResetFilters}
          className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm ${theme === 'dark' ? 'border-gray-600 text-white bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset Filters
        </button>
      </div>

      {/* Booking Count Indicator */}
      <div className="flex items-center mb-6 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Showing {bookings.length} of {stats.totalBookings} bookings
      </div>

      {error && (
        <div className={`mb-6 p-4 ${theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-50 border-l-4 border-red-400 text-red-700'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-300' : 'border-indigo-500'}`}></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className={`rounded-lg shadow-sm p-6 text-center ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-900'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium">No bookings found</h3>
          <p className="mt-1">No room bookings match your current filters.</p>
          {(statusFilter !== 'all' || dateFilter) && (
            <button 
              onClick={handleResetFilters}
              className={`mt-3 inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md ${theme === 'dark' ? 'border-gray-600 text-white bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking._id} className={`rounded-lg shadow-sm overflow-hidden border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'}`}>
              <div className="flex flex-wrap md:flex-nowrap">
                {/* Left side with booking details */}
                <div className="w-full md:w-3/4 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold">{booking.room?.name || 'Unnamed Room'}</h2>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium 
                      ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        booking.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Date</p>
                        <p className="text-sm">{displayDate(booking.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Time</p>
                        <p className="text-sm">{formatTimeRange(booking.startTime, booking.endTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Requested By</p>
                        <p className="text-sm">{booking.requestedBy?.displayName || 'Unknown'}</p>
                        <p className="text-xs">({booking.requestedBy?.role || 'user'})</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-1">Purpose:</h3>
                    <p className="text-sm">{booking.purpose || 'No purpose specified'}</p>
                  </div>
                  
                  <div className="text-xs">
                    Requested on {displayDate(booking.createdAt)}
                  </div>
                </div>
                
                {/* Right side with actions */}
                <div className={`w-full md:w-1/4 p-6 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                  {booking.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApproveBooking(booking._id)}
                        disabled={loadingAction}
                        className={`w-full mb-3 inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm ${theme === 'dark' ? 'text-white bg-indigo-600 hover:bg-indigo-700' : 'text-white bg-indigo-600 hover:bg-indigo-700'}`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(booking._id)}
                        disabled={loadingAction}
                        className={`w-full inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm ${theme === 'dark' ? 'text-white bg-red-600 hover:bg-red-700' : 'text-white bg-red-600 hover:bg-red-700'}`}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center h-12 w-12 rounded-full mb-3 
                        ${booking.status === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {booking.status === 'approved' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm">
                        {booking.status === 'approved' ? 'Approved' : 'Rejected'} by {booking.approvedBy?.displayName || booking.rejectedBy?.displayName || 'Admin'}
                      </p>
                      {booking.rejectionReason && (
                        <p className="mt-2 text-sm text-red-600">{booking.rejectionReason}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRejectModal(false)}></div>

            <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium mb-4">Reject Booking Request</h3>
                <div>
                  <label htmlFor="rejectionReason" className="block text-sm font-medium mb-1">
                    Reason for Rejection
                  </label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border rounded-md ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                    placeholder="Please provide a reason for rejection"
                  ></textarea>
                </div>
              </div>
              <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={handleRejectBooking}
                  className={`w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium sm:ml-3 sm:w-auto sm:text-sm ${theme === 'dark' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                >
                  {loadingAction ? 'Processing...' : 'Reject'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600 border-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
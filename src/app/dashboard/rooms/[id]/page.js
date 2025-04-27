'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function RoomDetailPage() {
  const { user, dbUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roomId = params.id;
  const { theme } = useTheme();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availabilityCalendar, setAvailabilityCalendar] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today

  // For time slot selection
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]); // Changed to array for multiple selection

  const [bookingData, setBookingData] = useState({
    title: '',
    description: '',
    startTime: '', // Will be set when user selects a time slot
    endTime: '', // Will be set when user selects a time slot
    date: new Date(), // Default to today
    attendees: 1,
    purpose: 'meeting',
  });
  const [bookingError, setBookingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Time slots display - with start and end time in 12h format and 24h format for API
  const [timeSlots, setTimeSlots] = useState([
    { id: 1, display: '08:00 AM - 09:00 AM', start: '08:00 AM', end: '09:00 AM', startTime24: '08:00', endTime24: '09:00', isAvailable: true, isSelected: false },
    { id: 2, display: '09:00 AM - 10:00 AM', start: '09:00 AM', end: '10:00 AM', startTime24: '09:00', endTime24: '10:00', isAvailable: true, isSelected: false },
    { id: 3, display: '10:00 AM - 11:00 AM', start: '10:00 AM', end: '11:00 AM', startTime24: '10:00', endTime24: '11:00', isAvailable: true, isSelected: false },
    { id: 4, display: '11:00 AM - 12:00 PM', start: '11:00 AM', end: '12:00 PM', startTime24: '11:00', endTime24: '12:00', isAvailable: true, isSelected: false },
    { id: 5, display: '12:00 PM - 01:00 PM', start: '12:00 PM', end: '01:00 PM', startTime24: '12:00', endTime24: '13:00', isAvailable: true, isSelected: false },
    { id: 6, display: '01:00 PM - 02:00 PM', start: '01:00 PM', end: '02:00 PM', startTime24: '13:00', endTime24: '14:00', isAvailable: true, isSelected: false },
    { id: 7, display: '02:00 PM - 03:00 PM', start: '02:00 PM', end: '03:00 PM', startTime24: '14:00', endTime24: '15:00', isAvailable: true, isSelected: false },
    { id: 8, display: '03:00 PM - 04:00 PM', start: '03:00 PM', end: '04:00 PM', startTime24: '15:00', endTime24: '16:00', isAvailable: true, isSelected: false },
    { id: 9, display: '04:00 PM - 05:00 PM', start: '04:00 PM', end: '05:00 PM', startTime24: '16:00', endTime24: '17:00', isAvailable: true, isSelected: false },
  ]);

  // Fetch room details on component mount
  useEffect(() => {
    if (!user || !roomId) return;

    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `/api/rooms?action=get-room&uid=${user?.uid}&roomId=${roomId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch room details');
        }

        const data = await response.json();
        setRoom(data.room);

        // Get next 14 days availability (only future dates)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
        let calendar = [];

        for (let i = 0; i < 14; i++) {
          const date = new Date();
          date.setDate(today.getDate() + i);
          calendar.push({
            date,
            dateString: formatDateForDisplay(date),
            isAvailable: true, // Default to available, will be updated with bookings
            isPast: date < today, // Mark if date is in the past
            bookings: [] // Will be populated with bookings
          });
        }

        // Fetch bookings for this room for the next 14 days
        const startDate = today.toISOString().split('T')[0];
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 14);

        const bookingsResponse = await fetch(
          `/api/room-bookings?action=get-room-bookings&uid=${user?.uid}&room=${roomId}&startDate=${startDate}&endDate=${endDate.toISOString().split('T')[0]}`
        );

        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();

          // Update calendar with bookings
          bookingsData.bookings.forEach(booking => {
            const bookingDate = new Date(booking.date);
            const calendarEntry = calendar.find(
              day => day.date.toDateString() === bookingDate.toDateString()
            );

            if (calendarEntry) {
              calendarEntry.bookings.push(booking);
              // Check if calendar day is fully booked
              if (isFullyBooked(calendarEntry.bookings)) {
                calendarEntry.isAvailable = false;
              }
            }
          });
        }

        setAvailabilityCalendar(calendar);
        console.log("Availability Calendar:", calendar);


        // Set initial date in booking data
        setBookingData(prev => ({
          ...prev,
          date: today.toISOString().split('T')[0]
        }));

        // Generate time slot availability based on bookings
        updateTimeSlotsForDate(calendar[0]);
      } catch (err) {
        console.error('Error fetching room details:', err);
        setError('Failed to load room details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [user, roomId]);

  // Update time slots based on bookings for selected date
  const updateTimeSlotsForDate = (day) => {
    if (!day) return;

    // Reset selections
    setSelectedTimeSlots([]);

    // Clone default time slots
    const updatedTimeSlots = [...timeSlots].map(slot => ({ ...slot, isAvailable: true, isSelected: false }));

    // Mark slots as unavailable based on bookings
    if (day.bookings && day.bookings.length > 0) {
      day.bookings.forEach(booking => {
        // Parse booking times to match our 24h format
        const startHour = parseInt(booking.startTime.split(':')[0]);
        const endHour = parseInt(booking.endTime.split(':')[0]);

        // Mark all time slots in the booking range as unavailable
        updatedTimeSlots.forEach((slot, index) => {
          const slotStartHour = parseInt(slot.startTime24.split(':')[0]);
          if (slotStartHour >= startHour && slotStartHour < endHour) {
            updatedTimeSlots[index].isAvailable = false;
          }
        });
      });
    }

    setTimeSlots(updatedTimeSlots);

    // Reset booking form time fields
    setBookingData(prev => ({
      ...prev,
      startTime: '',
      endTime: '',
    }));
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot) => {
    if (!slot.isAvailable) return;

    // If we're starting a new selection
    if (selectedTimeSlots.length === 0) {
      setSelectedTimeSlots([slot]);

      // Update booking form with this time slot
      setBookingData(prev => ({
        ...prev,
        startTime: slot.start,
        endTime: slot.end
      }));
      return;
    }

    // Get the current slots in ascending order by ID
    const currentSelectedIds = selectedTimeSlots.map(s => s.id).sort((a, b) => a - b);
    const firstSelectedId = currentSelectedIds[0];
    const lastSelectedId = currentSelectedIds[currentSelectedIds.length - 1];

    // If selecting a slot that's already selected, deselect it and adjust selection
    if (selectedTimeSlots.some(s => s.id === slot.id)) {
      let newSelectedSlots = [];

      // If deselecting the first or last slot
      if (slot.id === firstSelectedId || slot.id === lastSelectedId) {
        newSelectedSlots = selectedTimeSlots.filter(s => s.id !== slot.id);
      }
      // If deselecting a middle slot, reset selection to just this slot
      else {
        newSelectedSlots = [slot];
      }

      setSelectedTimeSlots(newSelectedSlots);

      // Update booking form
      if (newSelectedSlots.length > 0) {
        const newSelectedIds = newSelectedSlots.map(s => s.id).sort((a, b) => a - b);
        const firstSlot = timeSlots.find(s => s.id === newSelectedIds[0]);
        const lastSlot = timeSlots.find(s => s.id === newSelectedIds[newSelectedIds.length - 1]);

        setBookingData(prev => ({
          ...prev,
          startTime: firstSlot.start,
          endTime: lastSlot.end
        }));
      } else {
        setBookingData(prev => ({
          ...prev,
          startTime: '',
          endTime: ''
        }));
      }
      return;
    }

    // Check if slot is adjacent to existing selection
    if (slot.id === firstSelectedId - 1 || slot.id === lastSelectedId + 1) {
      // Add adjacent slot to selection
      const newSelectedSlots = [...selectedTimeSlots, slot];
      setSelectedTimeSlots(newSelectedSlots);

      // Update booking form
      const newSelectedIds = newSelectedSlots.map(s => s.id).sort((a, b) => a - b);
      const firstSlot = timeSlots.find(s => s.id === newSelectedIds[0]);
      const lastSlot = timeSlots.find(s => s.id === newSelectedIds[newSelectedIds.length - 1]);

      setBookingData(prev => ({
        ...prev,
        startTime: firstSlot.start,
        endTime: lastSlot.end
      }));
    } else {
      // If not adjacent, start a new selection with just this slot
      setSelectedTimeSlots([slot]);

      setBookingData(prev => ({
        ...prev,
        startTime: slot.start,
        endTime: slot.end
      }));
    }
  };

  // Format date function
  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if a day is fully booked (simple implementation)
  const isFullyBooked = (bookings) => {
    // This is a simplified check - in reality, you would check time slots
    return bookings.length >= 9; // Assuming 9 hours of availability per day
  };

  // Format room type for display
  const formatRoomType = (type) => {
    if (!type) return '';

    if (type === 'other' && room.otherType) {
      return room.otherType.charAt(0).toUpperCase() + room.otherType.slice(1);
    }

    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Handle booking form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));

    // If date changes through the input, update the calendar selection
    if (name === 'date' && availabilityCalendar.length > 0) {
      const dateValue = new Date(value);
      const selectedDay = availabilityCalendar.find(
        day => day.date.toDateString() === dateValue.toDateString()
      );
      if (selectedDay) {
        setSelectedDate(selectedDay.date);
        updateTimeSlotsForDate(selectedDay);
      }
    }
  };

  // Validate booking form
  const validateBookingForm = () => {
    if (!bookingData.title?.trim()) {
      setBookingError('Please enter a title for your booking');
      return false;
    }

    if (!bookingData.startTime || !bookingData.endTime) {
      setBookingError('Please select a time slot');
      return false;
    }

    if (bookingData.attendees < 1) {
      setBookingError('Number of attendees must be at least 1');
      return false;
    }

    if (room && room.capacity < bookingData.attendees) {
      setBookingError(`Room capacity is ${room.capacity} people`);
      return false;
    }

    // Terms checkbox validation
    const termsChecked = document.getElementById('terms').checked;
    if (!termsChecked) {
      setBookingError('You must agree to the booking terms and conditions');
      return false;
    }

    return true;
  };

  // Handle booking submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!validateBookingForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Find the selected time slots to get the 24h format times for API
      if (selectedTimeSlots.length === 0) {
        throw new Error('Please select a time slot');
      }

      const formattedDate = bookingData.date;

      const response = await fetch('/api/room-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          room: roomId,
          title: bookingData.title || 'Room Booking',
          purpose: bookingData.purpose || 'meeting',
          date: formattedDate,
          startTime: selectedTimeSlots[0].startTime24, // Use 24h format for API
          endTime: selectedTimeSlots[selectedTimeSlots.length - 1].endTime24, // Use 24h format for API
          attendees: parseInt(bookingData.attendees) || 1,
          additionalNotes: bookingData.description || ''
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create booking');
      }

      // Show success message and reset form
      setBookingSuccess(true);
      setBookingData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        attendees: 1,
        purpose: 'meeting'
      });

      // After 3 seconds, redirect to my bookings page
      setTimeout(() => {
        router.push('/dashboard/room-bookings');
      }, 3000);

    } catch (err) {
      console.error('Error creating booking:', err);
      setBookingError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Min date for the date input (prevent selecting dates in the past)
  const today = new Date();
  const minDateString = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString().split('T')[0];

  if (loading) {
    return (
      <div className={`p-6 min-h-[50vh] flex justify-center items-center ${theme === 'dark' ? 'bg-[var(--background)] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-500' : 'border-indigo-600'}`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${theme === 'dark' ? 'bg-[var(--background)] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`${theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-100 border-red-500 text-red-700'} border-l-4 p-4 mb-6`} role="alert">
          <p>{error}</p>
        </div>
        <Link
          href="/dashboard/rooms"
          className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm font-medium ${theme === 'dark'
              ? 'bg-indigo-700 text-white hover:bg-indigo-800'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            } focus:outline-none transition-colors duration-300`}
        >
          Back to Rooms
        </Link>
      </div>
    );
  }

  if (!room) {
    return (
      <div className={`p-6 ${theme === 'dark' ? 'bg-[var(--background)] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`p-4 mb-6 ${theme === 'dark' ? 'bg-yellow-900/30 border-yellow-700 text-yellow-200 border-l-4' : 'bg-yellow-50 border-yellow-400 text-yellow-800 border-l-4'}`}>
          <p className="text-sm">Room not found.</p>
        </div>
        <Link
          href="/dashboard/rooms"
          className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm font-medium ${theme === 'dark'
              ? 'bg-indigo-700 text-white hover:bg-indigo-800'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            } focus:outline-none transition-colors duration-300`}
        >
          Back to Rooms
        </Link>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'bg-[var(--background)] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header with back link */}
      <div className={`flex items-center justify-between border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} py-4 px-6`}>
        <div className="flex items-center">
          <Link
            href="/dashboard/rooms"
            className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} mr-4 transition-colors duration-200`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
          <div className={`flex-shrink-0 text-2xl font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-700'}`}>
            Book a Room
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room details and form - Left side */}
          <div className="lg:col-span-2">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg overflow-hidden`}>
              {/* Room image header */}
              <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${room.viewUrl ||
                      'https://images.unsplash.com/photo-1517164850305-99a3e65bb47e?auto=format&fit=crop&q=80&w=1000'
                      })`
                  }}
                ></div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h1 className="text-2xl font-bold text-white">{room.name}</h1>
                  <p className="text-gray-200">{room.building}, Floor {room.floor}</p>
                </div>
              </div>

              {/* Room details */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center mb-6 gap-4 justify-between">
                  <div>
                    <h2 className={`text-xl font-semibold mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Room Details</h2>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {room.description || "Versatile space for meetings, presentations, and group activities."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className={`flex items-center text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded-full`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Capacity: {room.capacity} people
                    </div>
                    <div className={`flex items-center text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded-full`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {formatRoomType(room.type)}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase mb-3`}>Equipment & Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {room.facilities && room.facilities.map((amenity, index) => (
                      <span key={index} className={`inline-flex items-center rounded-full ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'} px-2.5 py-1 text-xs`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {amenity}
                      </span>
                    ))}
                    {(!room.facilities || room.facilities.length === 0) && (
                      <>
                        <span className={`inline-flex items-center rounded-full ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'} px-2.5 py-1 text-xs`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Projector
                        </span>
                        <span className={`inline-flex items-center rounded-full ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'} px-2.5 py-1 text-xs`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Whiteboard
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Error and success messages */}
                {bookingError && (
                  <div className={`mb-6 p-4 border-l-4 ${theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-500 text-red-700'}`} role="alert">
                    <p className="text-sm">{bookingError}</p>
                  </div>
                )}

                {bookingSuccess ? (
                  <div className={`p-4 border rounded-md ${theme === 'dark' ? 'bg-green-900/30 border-green-800 text-green-300' : 'bg-green-50 border-green-200 text-green-800'}`}>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className={`h-5 w-5 ${theme === 'dark' ? 'text-green-300' : 'text-green-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-800'}`}>Booking successful!</h3>
                        <div className={`mt-2 text-sm ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                          <p>Your room booking has been confirmed. Redirecting to your bookings...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit}>
                    <div className="space-y-6">
                      {/* Booking Details */}
                      <div>
                        <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Booking Details</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="title" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                              Booking Title
                            </label>
                            <input
                              type="text"
                              id="title"
                              name="title"
                              value={bookingData.title}
                              onChange={handleInputChange}
                              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${theme === 'dark'
                                  ? 'border-gray-600 bg-gray-700 text-white focus:ring-indigo-500 focus:border-indigo-500'
                                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                              placeholder="E.g., Project Team Meeting"
                            />
                          </div>

                          <div>
                            <label htmlFor="attendees" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                              Number of Attendees
                            </label>
                            <input
                              type="number"
                              id="attendees"
                              name="attendees"
                              min="1"
                              max={room.capacity}
                              value={bookingData.attendees}
                              onChange={handleInputChange}
                              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${theme === 'dark'
                                  ? 'border-gray-600 bg-gray-700 text-white focus:ring-indigo-500 focus:border-indigo-500'
                                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                              placeholder={`Maximum capacity: ${room.capacity}`}
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label htmlFor="description" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                            Purpose of Booking
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            rows="3"
                            value={bookingData.description}
                            onChange={handleInputChange}
                            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${theme === 'dark'
                                ? 'border-gray-600 bg-gray-700 text-white focus:ring-indigo-500 focus:border-indigo-500'
                                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                              }`}
                            placeholder="Please describe the purpose of your booking"
                          ></textarea>
                        </div>

                      </div>
                      {/* Date and Time Selector */}
                      <div>
                        <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Select Date & Time</h3>

                        {/* Date Input Field */}
                        <div className="mb-4">
                          <label htmlFor="date" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                            Date
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              id="date"
                              name="date"
                              value={bookingData.date}
                              min={minDateString}
                              onChange={handleInputChange}
                              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${theme === 'dark'
                                  ? 'border-gray-600 bg-gray-700 text-white focus:ring-indigo-500 focus:border-indigo-500'
                                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                            />
                          </div>
                        </div>

                        {/* Time Slots Grid */}
                        <div>
                          <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            Available Time Slots
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                            {timeSlots.map((slot) => (
                              <div
                                key={slot.id}
                                className={`text-center py-3 px-3 rounded-md text-sm transition-colors ${!slot.isAvailable
                                    ? theme === 'dark'
                                      ? "bg-red-900/30 text-red-300 border border-red-800 cursor-not-allowed"
                                      : "bg-red-50 text-red-400 border border-red-100 cursor-not-allowed"
                                    : selectedTimeSlots.some(s => s.id === slot.id)
                                      ? theme === 'dark'
                                        ? "bg-indigo-900/50 text-indigo-300 border border-indigo-700 font-medium"
                                        : "bg-indigo-100 text-indigo-800 border border-indigo-400 font-medium"
                                      : theme === 'dark'
                                        ? "bg-green-900/30 text-green-300 border border-green-800 hover:bg-green-800/30 cursor-pointer"
                                        : "bg-green-50 text-green-800 border border-green-200 hover:bg-green-100 cursor-pointer"
                                  }`}
                                onClick={() => handleTimeSlotSelect(slot)}
                              >
                                {slot.display}
                              </div>
                            ))}
                          </div>
                          <div className={`flex items-center text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <div className="flex items-center mr-4">
                              <div className={`w-3 h-3 rounded-full mr-1 ${theme === 'dark' ? 'bg-green-900/30 border-green-800 border' : 'bg-green-50 border border-green-200'}`}></div>
                              <span>Available</span>
                            </div>
                            <div className="flex items-center mr-4">
                              <div className={`w-3 h-3 rounded-full mr-1 ${theme === 'dark' ? 'bg-indigo-900/50 border border-indigo-700' : 'bg-indigo-100 border border-indigo-400'}`}></div>
                              <span>Selected</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-1 ${theme === 'dark' ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-100'}`}></div>
                              <span>Booked</span>
                            </div>
                          </div>
                        </div>
                      </div>


                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Booking Summary - Right Side */}
          <div className="lg:col-span-1">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg overflow-hidden`}>
              <div className="p-6">
                <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Booking Summary</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Room</h4>
                    <p className={`text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{room.name}</p>
                  </div>

                  <div>
                    <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Location</h4>
                    <p className={`text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{room.building}, Floor {room.floor}</p>
                  </div>

                  <div>
                    <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Date</h4>
                    <p className={`text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {new Date(bookingData.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit'
                      })}
                    </p>
                  </div>

                  <div>
                    <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Time</h4>
                    {selectedTimeSlots.length === 0 ? (
                      <p className={`text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Not selected</p>
                    ) : selectedTimeSlots.length === 1 ? (
                      <p className={`text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{selectedTimeSlots[0].display}</p>
                    ) : (
                      <div>
                        <p className={`text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                          {`${selectedTimeSlots[0].start} - ${selectedTimeSlots[selectedTimeSlots.length - 1].end}`}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                          {selectedTimeSlots.length} hour{selectedTimeSlots.length > 1 ? 's' : ''} selected
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Attendees</h4>
                    <p className={`text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{bookingData.attendees} people</p>
                  </div>
                </div>

                <div className={`mt-6 p-4 rounded-md border ${theme === 'dark' ? 'bg-yellow-900/30 border-yellow-800 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                  <h4 className={`text-sm font-medium flex items-center ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-800'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Approval Required
                  </h4>
                  <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    Your booking request will need approval before it&apos;s confirmed. You&apos;ll receive a notification when processed.
                  </p>
                </div>

                <div className="mt-4 flex items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className={`h-4 w-4 ${theme === 'dark'
                        ? 'border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500'
                        : 'border-gray-300 text-indigo-600 focus:ring-indigo-500'
                      } rounded`}
                  />
                  <label htmlFor="terms" className={`ml-2 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    I agree to the booking terms and conditions
                  </label>
                </div>
                {!bookingSuccess && (
                  <button
                    type="submit"
                    form="booking-form"
                    disabled={isSubmitting || selectedTimeSlots.length === 0 || bookingData.attendees < 1 || !bookingData.title?.trim() || !document.getElementById('terms')?.checked}
                    onClick={handleBookingSubmit}
                    className={`mt-6 w-full inline-flex justify-center py-3 px-4 shadow-sm text-base font-medium rounded-md 
                      ${theme === 'dark'
                        ? 'bg-green-700 text-white hover:bg-green-800 disabled:bg-green-900 disabled:text-green-300 disabled:opacity-50'
                        : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300 disabled:opacity-50'
                      }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : 'Book this Room'}
                  </button>
                )}

                <Link
                  href="/dashboard/rooms"
                  className={`mt-3 w-full inline-flex justify-center py-2 px-4 border shadow-sm text-sm font-medium rounded-md 
                    ${theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    } transition-colors`}
                >
                  Back to All Rooms
                </Link>
              </div>
            </div>
          </div>

          {/* Booking Terms & Conditions */}
          {/* Booking Terms & Conditions */}
          <div className="lg:col-span-3 mt-6">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg overflow-hidden`}>
              <div className="p-6">
                <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-4 flex items-center`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Booking Terms & Conditions
                </h3>
                
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} space-y-4`}>
                  <p>By booking this room, you acknowledge and agree to the following terms:</p>
                  
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Bookings are subject to approval by the facility management team.</li>
                    <li>Please arrive on time and leave the room in the same condition you found it.</li>
                    <li>Cancellations must be made at least 24 hours in advance.</li>
                    <li>Do not exceed the maximum capacity of the room ({room.capacity} people).</li>
                    <li>Food and drinks are permitted, but you must clean up afterward.</li>
                    <li>Report any technical issues or damage to the facility management immediately.</li>
                    <li>The organization is not responsible for any personal items left in the meeting rooms.</li>
                    <li>Repeated no-shows may result in booking privileges being suspended.</li>
                  </ol>
                  
                  <div className={`mt-4 p-3 rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Need Help?</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      For assistance with your booking, please contact the facility management team at{' '}
                      <a href="mailto:facilities@example.com" className={`${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} hover:underline`}>
                        facilities@example.com
                      </a>
                      {' '}or call extension 2145.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
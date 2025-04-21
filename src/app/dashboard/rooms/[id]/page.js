'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function RoomDetailPage() {
  const { user, dbUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roomId = params.id;
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availabilityCalendar, setAvailabilityCalendar] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  
  // For time slot selection
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  
  const [bookingData, setBookingData] = useState({
    title: '',
    description: '',
    startTime: '',  // Will be set when user selects a time slot
    endTime: '',    // Will be set when user selects a time slot
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
    { id: 10, display: '05:00 PM - 06:00 PM', start: '05:00 PM', end: '06:00 PM', startTime24: '17:00', endTime24: '18:00', isAvailable: true, isSelected: false },
    { id: 11, display: '06:00 PM - 07:00 PM', start: '06:00 PM', end: '07:00 PM', startTime24: '18:00', endTime24: '19:00', isAvailable: true, isSelected: false },
    { id: 12, display: '07:00 PM - 08:00 PM', start: '07:00 PM', end: '08:00 PM', startTime24: '19:00', endTime24: '20:00', isAvailable: true, isSelected: false },
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
        today.setHours(0, 0, 0, 0);  // Set to beginning of day for accurate comparison
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
          `/api/room-bookings?action=get-room-bookings&uid=${user?.uid}&roomId=${roomId}&startDate=${startDate}&endDate=${endDate.toISOString().split('T')[0]}`
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
        
        // Set default selected date to today
        setSelectedDate(calendar[0].date);
        
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
    setSelectedTimeSlot(null);
    
    // Clone default time slots
    const updatedTimeSlots = [...timeSlots].map(slot => ({...slot, isAvailable: true, isSelected: false}));
    
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
    
    // Update selected time slot
    const updatedTimeSlots = timeSlots.map(ts => ({
      ...ts,
      isSelected: ts.id === slot.id
    }));
    
    setTimeSlots(updatedTimeSlots);
    setSelectedTimeSlot(slot);
    
    // Update booking form with this time slot
    setBookingData(prev => ({
      ...prev,
      startTime: slot.start,
      endTime: slot.end
    }));
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
    return bookings.length >= 8; // Assuming 8 hours of availability per day
  };

  // Format room type for display
  const formatRoomType = (type) => {
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : '';
  };

  // Handle date selection - prevent selecting past dates
  const handleDateSelect = (day) => {
    if (day.isPast) return; // Don't allow selecting past dates
    
    setSelectedDate(day);
    updateTimeSlotsForDate(day);
    
    setBookingData(prev => ({
      ...prev,
      date: day.date.toISOString().split('T')[0]
    }));
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
      const selectedDay = availabilityCalendar.find(
        day => day.date.toISOString().split('T')[0] === value
      );
      if (selectedDay) {
        setSelectedDate(selectedDay);
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
      
      // Find the selected time slot to get the 24h format times for API
      const slotForAPI = timeSlots.find(slot => slot.isSelected);
      if (!slotForAPI) {
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
          roomId,
          title: bookingData.title || 'Room Booking',
          purpose: bookingData.purpose || 'meeting',
          date: formattedDate,
          startTime: slotForAPI.startTime24, // Use 24h format for API
          endTime: slotForAPI.endTime24,    // Use 24h format for API
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

  // Get CSS classes for time slot
  const getTimeSlotClasses = (slot) => {
    const baseClasses = "text-center py-3 px-3 rounded-md text-sm transition-colors";
    
    if (!slot.isAvailable) {
      return `${baseClasses} bg-red-50 text-red-400 border border-red-100 cursor-not-allowed`;
    }
    
    if (slot.isSelected) {
      return `${baseClasses} bg-indigo-100 text-indigo-800 border border-indigo-400 font-medium`;
    }
    
    return `${baseClasses} bg-green-50 text-green-800 border border-green-200 hover:bg-green-100 cursor-pointer`;
  };

  // Min date for the date input (prevent selecting dates in the past)
  const today = new Date();
  const minDateString = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
        <Link
          href="/dashboard/rooms"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          Back to Rooms
        </Link>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-sm text-yellow-700">Room not found.</p>
        </div>
        <Link
          href="/dashboard/rooms"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          Back to Rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      

      {/* Main Content */}
      <div className="p-6">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 sm:p-10">
            <h1 className="text-2xl font-bold mb-1">Book {room.name}</h1>
            <p className="text-gray-600 mb-6">Fill out the form below to submit your booking request</p>

            {bookingError && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700" role="alert">
                <p className="text-sm">{bookingError}</p>
              </div>
            )}

            {bookingSuccess ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Booking successful!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Your room booking has been confirmed. Redirecting to your bookings...</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Booking Form - Left Side */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={bookingData.date}
                        min={minDateString}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  {/* Available Time Slots - Select by clicking */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Time Slots
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                      {timeSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={getTimeSlotClasses(slot)}
                          onClick={() => handleTimeSlotSelect(slot)}
                        >
                          {slot.display}
                        </div>
                      ))}
                    </div>
                    {selectedTimeSlot ? (
                      <p className="text-sm text-green-600 mt-2">
                        Selected time slot: {selectedTimeSlot.display}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">
                        Please select a time slot
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Booking Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={bookingData.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="E.g., Project Team Meeting"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Number of Attendees
                    </label>
                    <input
                      type="number"
                      id="attendees"
                      name="attendees"
                      min="1"
                      max={room.capacity}
                      value={bookingData.attendees}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={`Maximum capacity: ${room.capacity}`}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose of Booking
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows="3"
                      value={bookingData.description}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Please describe the purpose of your booking"
                    ></textarea>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                      I agree to the booking terms and conditions
                    </label>
                  </div>
                </div>
                
                {/* Booking Summary - Right Side */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Summary</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Room</h4>
                        <p className="text-sm text-gray-900">{room.name}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Location</h4>
                        <p className="text-sm text-gray-900">{room.building}, Floor {room.floor}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Date</h4>
                        <p className="text-sm text-gray-900">
                          {new Date(bookingData.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Time</h4>
                        <p className="text-sm text-gray-900">
                          {selectedTimeSlot ? selectedTimeSlot.display : "Please select a time slot"}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Capacity</h4>
                        <p className="text-sm text-gray-900">{bookingData.attendees} people</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Equipment</h4>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities && room.amenities.length > 0 ? (
                          room.amenities.slice(0, 3).map((amenity, index) => (
                            <span key={index} className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              {amenity}
                            </span>
                          ))
                        ) : (
                          <>
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              Computers
                            </span>
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              Whiteboard
                            </span>
                          </>
                        )}
                        {room.amenities && room.amenities.length > 3 && (
                          <span className="text-xs text-gray-500">+{room.amenities.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 bg-yellow-50 p-4 rounded-md border border-yellow-200">
                      <h4 className="text-sm font-medium text-yellow-800 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 000 16zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Booking Process
                      </h4>
                      <p className="mt-1 text-xs text-yellow-700">
                        Your booking request will need to be approved by an administrator before it's confirmed. You'll receive a notification when your request is processed.
                      </p>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedTimeSlot}
                      className="mt-6 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
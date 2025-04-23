'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function CreateEventPage() {
  const { user, dbUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [createBooking, setCreateBooking] = useState(true);
  const [roomBookings, setRoomBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

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
  
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    venue: '',
    roomId: '',
    startTime: '',
    endTime: '',
    maxAttendees: 0
  });

  // Event categories
  const eventCategories = [
    'Academic',
    'Cultural',
    'Sports',
    'Workshop',
    'Seminar',
    'Conference',
    'Competition',
    'Social',
    'Other'
  ];

  // Fetch rooms available in the college
  useEffect(() => {
    const fetchRooms = async () => {
      if (!dbUser?.college?._id) return;
      
      try {
        setLoadingRooms(true);
        const response = await fetch(`/api/rooms?collegeId=${dbUser.college._id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch rooms');
        }
        
        const data = await response.json();
        setRooms(data.rooms || []);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [dbUser]);

  // Fetch room bookings when date or room changes
  useEffect(() => {
    const fetchRoomBookings = async () => {
      if (!formData.roomId || formData.roomId === 'other' || !formData.date) return;
      
      try {
        setLoadingBookings(true);
        
        // Format date for API
        const eventDate = new Date(formData.date);
        const formattedDate = eventDate.toISOString().split('T')[0];
        
        const response = await fetch(
          `/api/room-bookings?action=get-room-bookings&uid=${user?.uid}&room=${formData.roomId}&startDate=${formattedDate}&endDate=${formattedDate}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch room bookings');
        }
        
        const data = await response.json();
        setRoomBookings(data.bookings || []);
        
        // Update time slots availability based on bookings
        updateTimeSlotsAvailability(data.bookings || []);
      } catch (error) {
        console.error('Error fetching room bookings:', error);
      } finally {
        setLoadingBookings(false);
      }
    };
    
    if (formData.roomId && formData.date) {
      fetchRoomBookings();
    }
  }, [formData.roomId, formData.date, user?.uid]);

  // Update time slots based on bookings
  const updateTimeSlotsAvailability = (bookings) => {
    // Reset selections and availability
    setSelectedTimeSlots([]);
    
    // Clone default time slots
    const updatedTimeSlots = [...timeSlots].map(slot => ({ 
      ...slot, 
      isAvailable: true, 
      isSelected: false 
    }));

    // Mark slots as unavailable based on bookings
    if (bookings && bookings.length > 0) {
      bookings.forEach(booking => {
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
    
    // Reset time fields in form data
    setFormData(prev => ({
      ...prev,
      startTime: '',
      endTime: ''
    }));
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // When room is selected, update venue field with room name
    if (name === 'roomId' && value) {
      const selectedRoom = rooms.find(room => room._id === value);
      if (selectedRoom) {
        setFormData(prev => ({
          ...prev,
          venue: `${selectedRoom.name}, ${selectedRoom.building}`
        }));
      }
    }
    
    // Reset time slots when date changes
    if (name === 'date') {
      // Reset time slots and selected time slots
      setSelectedTimeSlots([]);
      setFormData(prev => ({
        ...prev,
        startTime: '',
        endTime: ''
      }));
    }
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot) => {
    if (!slot.isAvailable) return;
    
    // If we're starting a new selection
    if (selectedTimeSlots.length === 0) {
      setSelectedTimeSlots([slot]);
      
      // Update booking form with this time slot
      setFormData(prev => ({
        ...prev,
        startTime: slot.startTime24,
        endTime: slot.endTime24
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
        
        setFormData(prev => ({
          ...prev,
          startTime: firstSlot.startTime24,
          endTime: lastSlot.endTime24
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          startTime: '',
          endTime: ''
        }));
      }
      return;
    }
    
    // Check if slot is adjacent to existing selection
    if (slot.id === firstSelectedId - 1 || slot.id === lastSelectedId + 1) {
      // First check if all slots in between are available
      const isSelectingEarlier = slot.id < firstSelectedId;
      const rangeStart = isSelectingEarlier ? slot.id : firstSelectedId;
      const rangeEnd = isSelectingEarlier ? lastSelectedId : slot.id;
      
      // Check if any slot in the range is unavailable
      const hasUnavailableSlot = timeSlots
        .filter(s => s.id >= rangeStart && s.id <= rangeEnd)
        .some(s => !s.isAvailable);
      
      if (hasUnavailableSlot) {
        return; // Don't allow selection if any slot in range is unavailable
      }
      
      // Add adjacent slot to selection
      const newSelectedSlots = [...selectedTimeSlots, slot];
      setSelectedTimeSlots(newSelectedSlots);
      
      // Update booking form
      const newSelectedIds = newSelectedSlots.map(s => s.id).sort((a, b) => a - b);
      const firstSlot = timeSlots.find(s => s.id === newSelectedIds[0]);
      const lastSlot = timeSlots.find(s => s.id === newSelectedIds[newSelectedIds.length - 1]);
      
      setFormData(prev => ({
        ...prev,
        startTime: firstSlot.startTime24,
        endTime: lastSlot.endTime24
      }));
    } else {
      // If not adjacent, start a new selection with just this slot
      setSelectedTimeSlots([slot]);
      
      setFormData(prev => ({
        ...prev,
        startTime: slot.startTime24,
        endTime: slot.endTime24
      }));
    }
  };

  // Get CSS classes for time slot
  const getTimeSlotClasses = (slot) => {
    const baseClasses = "text-center py-3 px-3 rounded-md text-sm transition-colors";

    if (!slot.isAvailable) {
      return `${baseClasses} bg-red-50 text-red-400 border border-red-100 cursor-not-allowed`;
    }

    // Check if this slot is in the selectedTimeSlots array
    const isSelected = selectedTimeSlots.some(s => s.id === slot.id);
    if (isSelected) {
      return `${baseClasses} bg-indigo-100 text-indigo-800 border border-indigo-400 font-medium`;
    }

    return `${baseClasses} bg-green-50 text-green-800 border border-green-200 hover:bg-green-100 cursor-pointer`;
  };

  // Validate form time fields are properly set
  const validateTimeFields = () => {
    if (!createBooking) return true;
    
    if (formData.roomId && (!formData.startTime || !formData.endTime)) {
      setMessage({
        type: 'error',
        text: 'Please select time slots for room booking'
      });
      return false;
    }

    if (selectedTimeSlots.length === 0 && formData.roomId && formData.roomId !== 'other') {
      setMessage({
        type: 'error',
        text: 'Please select at least one time slot for room booking'
      });
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setMessage({
        type: 'error',
        text: 'You must be logged in to create an event'
      });
      return;
    }

    // Validate time fields if room booking is enabled
    if (!validateTimeFields()) {
      return;
    }
    
    try {
      setIsSubmitting(true);

      // Create a date object from the form date input (just the date part)
      const eventDate = new Date(formData.date);
      
      // Set default time to noon if no time slots are selected
      let eventDateTime = new Date(eventDate);
      eventDateTime.setHours(12, 0, 0, 0);
      
      // Use start time from time slots if available for the event time
      if (formData.roomId && formData.roomId !== 'other' && selectedTimeSlots.length > 0) {
        const startTimeHours = parseInt(formData.startTime.split(':')[0]);
        const startTimeMinutes = parseInt(formData.startTime.split(':')[1] || '0');
        
        eventDateTime.setHours(startTimeHours, startTimeMinutes, 0, 0);
      }
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          eventData: {
            ...formData,
            date: eventDateTime, // Use date with time information
          },
          collegeId: dbUser?.college?._id,
          createBooking: createBooking && !!formData.roomId && formData.roomId !== 'other',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }
      
      setMessage({
        type: 'success',
        text: 'Event created successfully!' + (formData.roomId && formData.roomId !== 'other' && createBooking ? ' Room has been automatically booked.' : '')
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        date: '',
        venue: '',
        roomId: '',
        startTime: '',
        endTime: '',
        maxAttendees: 0
      });
      
      setSelectedTimeSlots([]);
      
      // Redirect after successful submission
      setTimeout(() => {
        router.push('/dashboard/events');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating event:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create event. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date object to yyyy-mm-dd format
  const formatDateForInput = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Create New Event</h1>
          <p className="text-gray-600 mt-1">
            Fill out the form below to create a new campus event
          </p>
        </div>
        <Link
          href="/dashboard/events"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
        >
          Back to Events
        </Link>
      </div>

      {message.text && (
        <div 
          className={`p-4 mb-6 border-l-4 ${
            message.type === 'error' 
              ? 'bg-red-100 border-red-500 text-red-700' 
              : 'bg-green-100 border-green-500 text-green-700'
          }`} 
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter event title"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a category</option>
                {eventCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Event Date *
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Room Selection */}
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
                Room/Venue *
              </label>
              <select
                id="roomId"
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a room</option>
                {loadingRooms ? (
                  <option disabled>Loading rooms...</option>
                ) : (
                  rooms.map((room) => (
                    <option key={room._id} value={room._id}>
                      {room.name} - {room.building} ({room.capacity} capacity)
                    </option>
                  ))
                )}
                <option value="other">Other Venue (specify below)</option>
              </select>
            </div>

            {/* Custom Venue - show only when roomId is "other" or empty */}
            {(formData.roomId === 'other' || (!formData.roomId && formData.venue)) && (
              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Venue *
                </label>
                <input
                  id="venue"
                  name="venue"
                  type="text"
                  required={formData.roomId === 'other'}
                  value={formData.venue}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter venue location"
                />
              </div>
            )}
            
            {/* Room Booking Option - Show only when a room is selected */}
            {formData.roomId && formData.roomId !== 'other' && (
              <>
                <div className="md:col-span-2">
                  <div className="flex items-center mb-4">
                    <input
                      id="createBooking"
                      name="createBooking"
                      type="checkbox"
                      checked={createBooking}
                      onChange={() => setCreateBooking(!createBooking)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="createBooking" className="ml-2 block text-sm text-gray-700">
                      Automatically book this room for the event
                    </label>
                  </div>
                </div>

                {createBooking && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Time Slots *
                    </label>
                    
                    {loadingBookings ? (
                      <div className="py-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading available time slots...</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
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
                        
                        <div className="flex items-center text-sm mt-2 text-gray-600">
                          <div className="flex items-center mr-4">
                            <div className="w-3 h-3 bg-green-50 border border-green-200 rounded-full mr-1"></div>
                            <span>Available</span>
                          </div>
                          <div className="flex items-center mr-4">
                            <div className="w-3 h-3 bg-indigo-100 border border-indigo-400 rounded-full mr-1"></div>
                            <span>Selected</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-50 border border-red-100 rounded-full mr-1"></div>
                            <span>Already Booked</span>
                          </div>
                        </div>
                        
                        {selectedTimeSlots.length > 0 && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-700">
                              Selected time: {selectedTimeSlots.length === 1 
                                ? selectedTimeSlots[0].display 
                                : `${selectedTimeSlots[0].start} - ${selectedTimeSlots[selectedTimeSlots.length-1].end} (${selectedTimeSlots.length} hours)`}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* Maximum Attendees */}
            <div>
              <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Attendees
              </label>
              <div className="flex items-center">
                <input
                  id="maxAttendees"
                  name="maxAttendees"
                  type="number"
                  min="0"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0 for unlimited"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Set to 0 for unlimited attendees</p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Provide details about the event"
              ></textarea>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Event...
                </>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing faculty and hod access
export default withRoleProtection(CreateEventPage, ['hod', 'faculty']);
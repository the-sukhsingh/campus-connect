'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function CreateEventPage() {
  const { user, dbUser } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [createBooking, setCreateBooking] = useState(true);
  const [roomBookings, setRoomBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

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

  useEffect(() => {
    const fetchRoomBookings = async () => {
      if (!formData.roomId || formData.roomId === 'other' || !formData.date) return;

      try {
        setLoadingBookings(true);

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

  const updateTimeSlotsAvailability = (bookings) => {
    setSelectedTimeSlots([]);

    const updatedTimeSlots = [...timeSlots].map(slot => ({
      ...slot,
      isAvailable: true,
      isSelected: false
    }));

    if (bookings && bookings.length > 0) {
      bookings.forEach(booking => {
        const startHour = parseInt(booking.startTime.split(':')[0]);
        const endHour = parseInt(booking.endTime.split(':')[0]);

        updatedTimeSlots.forEach((slot, index) => {
          const slotStartHour = parseInt(slot.startTime24.split(':')[0]);
          if (slotStartHour >= startHour && slotStartHour < endHour) {
            updatedTimeSlots[index].isAvailable = false;
          }
        });
      });
    }

    setTimeSlots(updatedTimeSlots);

    setFormData(prev => ({
      ...prev,
      startTime: '',
      endTime: ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'roomId' && value) {
      const selectedRoom = rooms.find(room => room._id === value);
      if (selectedRoom) {
        setFormData(prev => ({
          ...prev,
          venue: `${selectedRoom.name}, ${selectedRoom.building}`
        }));
      }
    }

    if (name === 'date') {
      setSelectedTimeSlots([]);
      setFormData(prev => ({
        ...prev,
        startTime: '',
        endTime: ''
      }));
    }
  };

  const handleTimeSlotSelect = (slot) => {
    if (!slot.isAvailable) return;

    if (selectedTimeSlots.length === 0) {
      setSelectedTimeSlots([slot]);

      setFormData(prev => ({
        ...prev,
        startTime: slot.startTime24,
        endTime: slot.endTime24
      }));
      return;
    }

    const currentSelectedIds = selectedTimeSlots.map(s => s.id).sort((a, b) => a - b);
    const firstSelectedId = currentSelectedIds[0];
    const lastSelectedId = currentSelectedIds[currentSelectedIds.length - 1];

    if (selectedTimeSlots.some(s => s.id === slot.id)) {
      let newSelectedSlots = [];

      if (slot.id === firstSelectedId || slot.id === lastSelectedId) {
        newSelectedSlots = selectedTimeSlots.filter(s => s.id !== slot.id);
      } else {
        newSelectedSlots = [slot];
      }

      setSelectedTimeSlots(newSelectedSlots);

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

    if (slot.id === firstSelectedId - 1 || slot.id === lastSelectedId + 1) {
      const isSelectingEarlier = slot.id < firstSelectedId;
      const rangeStart = isSelectingEarlier ? slot.id : firstSelectedId;
      const rangeEnd = isSelectingEarlier ? lastSelectedId : slot.id;

      const hasUnavailableSlot = timeSlots
        .filter(s => s.id >= rangeStart && s.id <= rangeEnd)
        .some(s => !s.isAvailable);

      if (hasUnavailableSlot) {
        return;
      }

      const newSelectedSlots = [...selectedTimeSlots, slot];
      setSelectedTimeSlots(newSelectedSlots);

      const newSelectedIds = newSelectedSlots.map(s => s.id).sort((a, b) => a - b);
      const firstSlot = timeSlots.find(s => s.id === newSelectedIds[0]);
      const lastSlot = timeSlots.find(s => s.id === newSelectedIds[newSelectedIds.length - 1]);

      setFormData(prev => ({
        ...prev,
        startTime: firstSlot.startTime24,
        endTime: lastSlot.endTime24
      }));
    } else {
      setSelectedTimeSlots([slot]);

      setFormData(prev => ({
        ...prev,
        startTime: slot.startTime24,
        endTime: slot.endTime24
      }));
    }
  };

  const getTimeSlotClasses = (slot) => {
    const baseClasses = "text-center py-3 px-3 rounded-md text-sm transition-colors";

    if (!slot.isAvailable) {
      return `${baseClasses} bg-red-50 text-red-400 border border-red-100 cursor-not-allowed`;
    }

    const isSelected = selectedTimeSlots.some(s => s.id === slot.id);
    if (isSelected) {
      return `${baseClasses} bg-indigo-100 text-indigo-800 border border-indigo-400 font-medium`;
    }

    return `${baseClasses} bg-green-50 text-green-800 border border-green-200 hover:bg-green-100 cursor-pointer`;
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setMessage({
        type: 'error',
        text: 'You must be logged in to create an event'
      });
      return;
    }

    if (!validateTimeFields()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const eventDate = new Date(formData.date);

      let eventDateTime = new Date(eventDate);
      eventDateTime.setHours(12, 0, 0, 0);

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
            date: eventDateTime,
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

  const formatDateForInput = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-[var(--background)] text-gray-100' : 'bg-white text-gray-800'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Create New Event</h1>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
            Fill out the form below to create a new campus event
          </p>
        </div>
        <Link
          href="/dashboard/events"
          className={`${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} text-${theme === 'dark' ? 'gray-200' : 'gray-800'} py-2 px-4 rounded transition-colors`}
        >
          Back to Events
        </Link>
      </div>

      {message.text && (
        <div 
          className={`p-4 mb-6 border-l-4 ${
            message.type === 'error' 
              ? theme === 'dark'
                ? 'bg-red-900 border-red-700 text-red-200'
                : 'bg-red-100 border-red-500 text-red-700'
              : theme === 'dark'
                ? 'bg-green-900 border-green-700 text-green-200'
                : 'bg-green-100 border-green-500 text-green-700'
          }`} 
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Event Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                } rounded-md shadow-sm focus:outline-none`}
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label htmlFor="category" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                } rounded-md shadow-sm focus:outline-none`}
              >
                <option value="">Select a category</option>
                {eventCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Event Date *
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                } rounded-md shadow-sm focus:outline-none`}
              />
            </div>

            <div>
              <label htmlFor="roomId" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Room/Venue *
              </label>
              <select
                id="roomId"
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                } rounded-md shadow-sm focus:outline-none`}
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

            {(formData.roomId === 'other' || (!formData.roomId && formData.venue)) && (
              <div>
                <label htmlFor="venue" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Custom Venue *
                </label>
                <input
                  id="venue"
                  name="venue"
                  type="text"
                  required={formData.roomId === 'other'}
                  value={formData.venue}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500'
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  } rounded-md shadow-sm focus:outline-none`}
                  placeholder="Enter venue location"
                />
              </div>
            )}

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
                      className={`h-4 w-4 ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500'
                          : 'text-indigo-600 focus:ring-indigo-500 border-gray-300' 
                      } rounded`}
                    />
                    <label htmlFor="createBooking" className={`ml-2 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Automatically book this room for the event
                    </label>
                  </div>
                </div>

                {createBooking && (
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Select Time Slots *
                    </label>
                    
                    {loadingBookings ? (
                      <div className="py-4 text-center">
                        <div className={`inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 ${
                          theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'
                        }`}></div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-2`}>Loading available time slots...</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                          {timeSlots.map((slot) => (
                            <div
                              key={slot.id}
                              className={theme === 'dark' ? getTimeSlotClassesDark(slot) : getTimeSlotClasses(slot)}
                              onClick={() => handleTimeSlotSelect(slot)}
                            >
                              {slot.display}
                            </div>
                          ))}
                        </div>
                        
                        <div className={`flex items-center text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="flex items-center mr-4">
                            <div className={`w-3 h-3 ${
                              theme === 'dark' ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'
                            } rounded-full mr-1`}></div>
                            <span>Available</span>
                          </div>
                          <div className="flex items-center mr-4">
                            <div className={`w-3 h-3 ${
                              theme === 'dark' ? 'bg-indigo-900 border-indigo-700' : 'bg-indigo-100 border-indigo-400'
                            } rounded-full mr-1`}></div>
                            <span>Selected</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 ${
                              theme === 'dark' ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-100'
                            } rounded-full mr-1`}></div>
                            <span>Already Booked</span>
                          </div>
                        </div>
                        
                        {selectedTimeSlots.length > 0 && (
                          <div className={`mt-2 p-2 ${
                            theme === 'dark' ? 'bg-blue-900 rounded-md' : 'bg-blue-50 rounded-md'
                          }`}>
                            <p className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
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

            <div>
              <label htmlFor="maxAttendees" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
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
                  className={`w-full px-3 py-2 border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500'
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  } rounded-md shadow-sm focus:outline-none`}
                  placeholder="0 for unlimited"
                />
              </div>
              <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Set to 0 for unlimited attendees</p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                } rounded-md shadow-sm focus:outline-none`}
                placeholder="Provide details about the event"
              ></textarea>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                theme === 'dark'
                  ? 'bg-indigo-700 hover:bg-indigo-800 focus:ring-indigo-500'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
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

const getTimeSlotClassesDark = (slot) => {
  const baseClasses = "text-center py-3 px-3 rounded-md text-sm transition-colors";

  if (!slot.isAvailable) {
    return `${baseClasses} bg-red-900 text-red-300 border border-red-800 cursor-not-allowed`;
  }

  const isSelected = slot.isSelected;
  if (isSelected) {
    return `${baseClasses} bg-indigo-900 text-indigo-200 border border-indigo-700 font-medium`;
  }

  return `${baseClasses} bg-green-900 text-green-200 border border-green-800 hover:bg-green-800 cursor-pointer`;
};

export default withRoleProtection(CreateEventPage, ['hod', 'faculty']);
'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function RoomsListingPage() {
  const { user, dbUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  // Filter states
  const [buildings, setBuildings] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [filters, setFilters] = useState({
    building: '',
    type: '',
    capacity: '',
    search: ''
  });

  // Generate the next 14 days for the date selector
  const nextFourteenDays = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      days.push(nextDate);
    }
    
    return days;
  }, []);

  // Fetch rooms on component mount
  useEffect(() => {
    if (!user) return;

    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError('');
        
        let url = `/api/rooms?action=get-rooms&uid=${user?.uid}&page=${currentPage}`;
        
        // Add filters to URL if they exist
        if (filters.building) url += `&building=${filters.building}`;
        if (filters.type) url += `&type=${filters.type}`;
        if (filters.capacity) url += `&capacity=${filters.capacity}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch rooms');
        }
        
        const data = await response.json();
        setRooms(data.rooms || []);
        setTotalRooms(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error('Error fetching rooms:', err);
        setError('Failed to load rooms. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Fetch filter options
    const fetchFilterOptions = async () => {
      try {
        // Fetch buildings
        const buildingsResponse = await fetch(
          `/api/rooms?action=get-buildings&uid=${user?.uid}`
        );
        
        if (buildingsResponse.ok) {
          const buildingsData = await buildingsResponse.json();
          setBuildings(buildingsData.buildings || []);
        }
        
        // Fetch room types
        const typesResponse = await fetch(
          `/api/rooms?action=get-room-types&uid=${user?.uid}`
        );
        
        if (typesResponse.ok) {
          const typesData = await typesResponse.json();
          setRoomTypes(typesData.roomTypes || []);
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchRooms();
    fetchFilterOptions();
  }, [user, currentPage, filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      building: '',
      type: '',
      capacity: '',
      search: ''
    });
    setCurrentPage(1);
  };

  // Format room type for display
  const formatRoomType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Format date for display
  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle room selection
  const handleRoomSelect = async (room) => {
    setSelectedRoom(room);
    await fetchAvailableTimeSlots(room._id, selectedDate);
  };

  // Handle date selection
  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    
    if (selectedRoom) {
      await fetchAvailableTimeSlots(selectedRoom._id, date);
    }
  };

  // Fetch available time slots for a room on a specific date
  const fetchAvailableTimeSlots = async (roomId, date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const response = await fetch(
        `/api/room-bookings?action=get-available-slots&uid=${user?.uid}&roomId=${roomId}&date=${formattedDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAvailableTimeSlots(data.availableSlots || []);
      } else {
        // If API doesn't support this yet, generate default time slots
        setAvailableTimeSlots(generateDefaultTimeSlots());
      }
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setAvailableTimeSlots(generateDefaultTimeSlots());
    }
  };

  // Generate default time slots (8 AM to 8 PM in 1-hour blocks)
  const generateDefaultTimeSlots = () => {
    return [
      { time: '08:00 - 09:00', isAvailable: true },
      { time: '09:00 - 10:00', isAvailable: true },
      { time: '10:00 - 11:00', isAvailable: true },
      { time: '11:00 - 12:00', isAvailable: true },
      { time: '12:00 - 13:00', isAvailable: true },
      { time: '13:00 - 14:00', isAvailable: true },
      { time: '14:00 - 15:00', isAvailable: true },
      { time: '15:00 - 16:00', isAvailable: true },
      { time: '16:00 - 17:00', isAvailable: true },
      { time: '17:00 - 18:00', isAvailable: true },
      { time: '18:00 - 19:00', isAvailable: true },
      { time: '19:00 - 20:00', isAvailable: true },
    ];
  };

  // Get CSS classes for time slot
  const getTimeSlotClasses = (slot) => {
    const baseClasses = "text-center py-2 px-3 rounded-md text-sm transition-colors";
    
    if (slot.isAvailable) {
      return `${baseClasses} bg-green-50 text-green-800 border border-green-200 hover:bg-green-100`;
    } else {
      return `${baseClasses} bg-red-50 text-red-800 border border-red-200`;
    }
  };

  // Get CSS classes for date selector buttons
  const getDateButtonClasses = (date) => {
    const isSelected = selectedDate.toDateString() === date.toDateString();
    const isToday = date.toDateString() === new Date().toDateString();
    
    if (isSelected) {
      return "px-3 py-2 bg-indigo-600 text-white rounded-md font-medium";
    } else if (isToday) {
      return "px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md font-medium hover:bg-indigo-200";
    } else {
      return "px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 py-4 px-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 text-2xl font-bold text-indigo-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Campus Rooms
          </div>
        </div>
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
            {dbUser?.role?.charAt(0).toUpperCase() || 'F'}
          </div>
          <span className="ml-2 text-sm text-gray-700">Faculty Member</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar with filters */}
        <div className="w-full lg:w-64 bg-white p-6 border-r border-gray-200">
          <h2 className="text-lg font-medium mb-4">Filters</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="building" className="block text-sm font-medium text-gray-700 mb-1">
                Building
              </label>
              <select
                id="building"
                name="building"
                value={filters.building}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Buildings</option>
                {buildings.map((building) => (
                  <option key={building} value={building}>
                    {building}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Room Type
              </label>
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Types</option>
                {roomTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatRoomType(type)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Capacity
              </label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={filters.capacity}
                onChange={handleFilterChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Any capacity"
              />
            </div>
            
            <div>
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          {/* Main content area */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {selectedRoom ? (
                <div>
                  {/* Room detail view */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h1 className="text-2xl font-bold">{selectedRoom.name}</h1>
                      <p className="text-gray-600">
                        {selectedRoom.building}, Floor {selectedRoom.floor}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedRoom(null)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
                    >
                      Back to Rooms
                    </button>
                  </div>

                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-2">About this room</h2>
                        <p className="text-gray-600">
                          {selectedRoom.description || "Large auditorium with state-of-the-art sound and projection systems, perfect for major events and presentations."}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h3 className="text-sm font-semibold uppercase text-gray-500">Capacity</h3>
                          <p className="mt-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {selectedRoom.capacity} people
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold uppercase text-gray-500">Room Type</h3>
                          <p className="mt-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {formatRoomType(selectedRoom.type)}
                          </p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-sm font-semibold uppercase text-gray-500 mb-3">Equipment & Features</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedRoom.amenities && selectedRoom.amenities.map((amenity, index) => (
                            <span key={index} className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {amenity}
                            </span>
                          ))}

                          {/* Fallback if no amenities */}
                          {(!selectedRoom.amenities || selectedRoom.amenities.length === 0) && (
                            <>
                              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Projector
                              </span>
                              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                Sound System
                              </span>
                              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Stage
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Available Time Slots */}
                      <div>
                        <div className="mb-4">
                          <h2 className="text-lg font-semibold mb-4">Available Time Slots</h2>
                          
                          {/* Date Selector Pills - Next 14 Days */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select Date:
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {nextFourteenDays.map((date, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleDateSelect(date)}
                                  className={getDateButtonClasses(date)}
                                >
                                  {formatDateDisplay(date)}
                                  {date.toDateString() === new Date().toDateString() && (
                                    <span className="ml-1 text-xs">(Today)</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                            {availableTimeSlots.map((slot, index) => (
                              <div key={index} className={getTimeSlotClasses(slot)}>
                                {slot.time}
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex items-center text-sm mt-2 text-gray-600">
                            <div className="flex items-center mr-4">
                              <div className="w-3 h-3 bg-green-50 border border-green-200 rounded-full mr-1"></div>
                              <span>Available</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-red-50 border border-red-200 rounded-full mr-1"></div>
                              <span>Booked</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center mt-6">
                          <Link
                            href={`/dashboard/rooms/${selectedRoom._id}`}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                          >
                            Book this Room
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Rooms listing */}
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold">Available Rooms</h1>
                    <p className="text-gray-600">Browse and book rooms for your events</p>
                  </div>

                  {rooms.length === 0 ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            No rooms found matching your criteria.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {rooms.map((room) => (
                        <div 
                          key={room._id} 
                          onClick={() => handleRoomSelect(room)}
                          className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        >
                          <div className="h-48 bg-gray-200 overflow-hidden">
                            <div 
                              className="w-full h-full bg-cover bg-center" 
                              style={{ 
                                backgroundImage: `url(${ 
                                  room.image || 
                                  'https://images.unsplash.com/photo-1517164850305-99a3e65bb47e?auto=format&fit=crop&q=80&w=1000'
                                })` 
                              }}
                            ></div>
                          </div>
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-xl font-semibold">{room.name}</h3>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                room.type === 'classroom' ? 'bg-blue-100 text-blue-800' :
                                room.type === 'conference' ? 'bg-purple-100 text-purple-800' :
                                room.type === 'lab' ? 'bg-green-100 text-green-800' :
                                room.type === 'auditorium' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {formatRoomType(room.type)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-4">
                              {room.building}, Floor {room.floor}
                            </p>
                            
                            <div className="flex items-center text-sm text-gray-600 mb-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              Capacity: {room.capacity} people
                            </div>
                            
                            {room.amenities && room.amenities.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {room.amenities.slice(0, 3).map((amenity, index) => (
                                  <span key={index} className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {amenity}
                                  </span>
                                ))}
                                {room.amenities.length > 3 && (
                                  <span className="inline-flex items-center rounded-full bg-gray-50 text-gray-600 px-2 py-0.5 text-xs">
                                    +{room.amenities.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="mb-4 flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Projector
                                </span>
                                <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  WiFi
                                </span>
                              </div>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/dashboard/rooms/${room._id}`;
                              }}
                              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                            >
                              View Details & Book
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="flex flex-1 justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                            currentPage === 1
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                          }
                          disabled={currentPage === totalPages}
                          className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                            currentPage === totalPages
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{rooms.length > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> to{" "}
                            <span className="font-medium">
                              {Math.min(currentPage * 10, totalRooms)}
                            </span>{" "}
                            of <span className="font-medium">{totalRooms}</span> results
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
                              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === 1
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-gray-500 hover:bg-gray-50"
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
                                        ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
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
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
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
                              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === totalPages
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-gray-500 hover:bg-gray-50"
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
                                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
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
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';

export default function RoomsListingPage() {
  const { user, dbUser } = useAuth();
  const { theme } = useTheme(); 
  const [allRooms, setAllRooms] = useState([]);
  const [displayRooms, setDisplayRooms] = useState([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debouncedFilters, setDebouncedFilters] = useState({
    building: '',
    type: '',
    capacity: '',
    search: ''
  });

  // Filter states
  const [buildings, setBuildings] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [filters, setFilters] = useState({
    building: '',
    type: '',
    capacity: '',
    search: ''
  });

  const ITEMS_PER_PAGE = 10;

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Debounced filter change
  const debouncedFilterChange = useCallback(
    debounce((newFilters) => {
      setDebouncedFilters(newFilters);
    }, 300),
    []
  );

  // Fetch all rooms on component mount
  useEffect(() => {
    if (!user) return;

    const fetchAllRooms = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch(`/api/rooms?action=get-rooms&uid=${user?.uid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch rooms');
        }
        
        const data = await response.json();
        setAllRooms(data.rooms || []);
        setTotalRooms(data.rooms?.length || 0);
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

    fetchAllRooms();
    fetchFilterOptions();
  }, [user]);

  // Apply filters to rooms
  useEffect(() => {
    if (!allRooms.length) return;
    
    let filteredRooms = [...allRooms];
    
    // Apply building filter
    if (debouncedFilters.building) {
      filteredRooms = filteredRooms.filter(room => 
        room.building === debouncedFilters.building
      );
    }
    
    // Apply room type filter
    if (debouncedFilters.type) {
      filteredRooms = filteredRooms.filter(room => 
        room.type === debouncedFilters.type || 
        (room.type === 'other' && room.otherType === debouncedFilters.type)
      );
    }
    
    // Apply capacity filter
    if (debouncedFilters.capacity) {
      const minCapacity = parseInt(debouncedFilters.capacity, 10);
      if (!isNaN(minCapacity)) {
        filteredRooms = filteredRooms.filter(room => 
          room.capacity >= minCapacity
        );
      }
    }
    
    // Apply search term filter
    if (debouncedFilters.search) {
      const searchTerm = debouncedFilters.search.toLowerCase();
      filteredRooms = filteredRooms.filter(room => 
        room.name.toLowerCase().includes(searchTerm) ||
        room.building.toLowerCase().includes(searchTerm) ||
        (room.description && room.description.toLowerCase().includes(searchTerm)) ||
        (room.amenities && room.amenities.some(amenity => 
          amenity.toLowerCase().includes(searchTerm)
        ))
      );
    }
    
    // Update total rooms count and pages
    setTotalRooms(filteredRooms.length);
    setTotalPages(Math.ceil(filteredRooms.length / ITEMS_PER_PAGE));
    
    // Reset to first page when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    
    // Apply pagination
    const startIndex = 0;
    const endIndex = Math.min(ITEMS_PER_PAGE, filteredRooms.length);
    setDisplayRooms(filteredRooms.slice(startIndex, endIndex));
  }, [allRooms, debouncedFilters, ITEMS_PER_PAGE]);

  // Handle pagination changes
  useEffect(() => {
    if (!allRooms.length) return;
    
    // Apply filters first
    let filteredRooms = [...allRooms];
    
    if (debouncedFilters.building) {
      filteredRooms = filteredRooms.filter(room => 
        room.building === debouncedFilters.building
      );
    }
    
    if (debouncedFilters.type) {
      filteredRooms = filteredRooms.filter(room => 
        room.type === debouncedFilters.type || 
        (room.type === 'other' && room.otherType === debouncedFilters.type)
      );
    }
    
    if (debouncedFilters.capacity) {
      const minCapacity = parseInt(debouncedFilters.capacity, 10);
      if (!isNaN(minCapacity)) {
        filteredRooms = filteredRooms.filter(room => 
          room.capacity >= minCapacity
        );
      }
    }
    
    if (debouncedFilters.search) {
      const searchTerm = debouncedFilters.search.toLowerCase();
      filteredRooms = filteredRooms.filter(room => 
        room.name.toLowerCase().includes(searchTerm) ||
        room.building.toLowerCase().includes(searchTerm) ||
        (room.description && room.description.toLowerCase().includes(searchTerm)) ||
        (room.amenities && room.amenities.some(amenity => 
          amenity.toLowerCase().includes(searchTerm)
        ))
      );
    }
    
    // Then apply pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredRooms.length);
    setDisplayRooms(filteredRooms.slice(startIndex, endIndex));
  }, [currentPage, allRooms, debouncedFilters, ITEMS_PER_PAGE]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    debouncedFilterChange(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters = {
      building: '',
      type: '',
      capacity: '',
      search: ''
    };
    setFilters(clearedFilters);
    debouncedFilterChange(clearedFilters);
    setCurrentPage(1);
  };

  // Format room type for display
  const formatRoomType = (type) => {
    if (!type) return '';
    
    // Check if this is from a room with otherType
    if (allRooms.some(room => room.type === 'other' && room.otherType === type)) {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
    
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 ${theme === 'dark' ? 'bg-[var(--background)] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {error && (
        <div className={`${theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-100 border-red-500 text-red-700'} border-l-4 p-4 m-6`} role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 py-6">
        {/* Sidebar with filters */}
        <div className={`w-full lg:w-72 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-md mb-6 lg:mb-0 border`}>
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-700'} mb-6 flex items-center`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Smart Filters
          </h2>
          
          <div className="space-y-5">
            <div className="group">
              <label htmlFor="building" className={`block text-sm font-medium ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'} mb-2 transition-transform group-hover:translate-x-1`}>
                Building Location
              </label>
              <div className="relative">
                <select
                  id="building"
                  name="building"
                  value={filters.building}
                  onChange={handleFilterChange}
                  className={`w-full pl-4 pr-10 py-3 rounded-lg shadow-sm appearance-none ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-gray-300 ring-1 ring-indigo-700 focus:ring-indigo-500' 
                      : 'bg-white text-gray-700 ring-1 ring-indigo-200 focus:ring-indigo-500'
                  } focus:outline-none focus:ring-2`}
                >
                  <option value="">All Buildings</option>
                  {buildings.map((building) => (
                    <option key={building} value={building}>
                      {building}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="group">
              <label htmlFor="type" className={`block text-sm font-medium ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'} mb-2 transition-transform group-hover:translate-x-1`}>
                Room Purpose
              </label>
              <div className="relative">
                <select
                  id="type"
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className={`w-full pl-4 pr-10 py-3 rounded-lg shadow-sm appearance-none ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-gray-300 ring-1 ring-indigo-700 focus:ring-indigo-500' 
                      : 'bg-white text-gray-700 ring-1 ring-indigo-200 focus:ring-indigo-500'
                  } focus:outline-none focus:ring-2`}
                >
                  <option value="">All Types</option>
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatRoomType(type)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="group">
              <label htmlFor="capacity" className={`block text-sm font-medium ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'} mb-2 transition-transform group-hover:translate-x-1`}>
                Guest Capacity
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={filters.capacity}
                  onChange={handleFilterChange}
                  min="1"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg shadow-sm ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-gray-300 ring-1 ring-indigo-700 focus:ring-indigo-500' 
                      : 'bg-white text-gray-700 ring-1 ring-indigo-200 focus:ring-indigo-500'
                  } focus:outline-none focus:ring-2`}
                  placeholder="Min. people"
                />
              </div>
            </div>
            
            <div className="pt-2">
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg shadow-sm ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-gray-300 ring-1 ring-indigo-700 focus:ring-indigo-500' 
                      : 'bg-white text-gray-700 ring-1 ring-indigo-200 focus:ring-indigo-500'
                  } focus:outline-none focus:ring-2`}
                  placeholder="Search rooms..."
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={handleClearFilters}
                className={`w-full px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-800 hover:to-purple-800 text-white'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          {/* Main content area */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-500' : 'border-indigo-600'}`}></div>
            </div>
          ) : (
            <div className="space-y-6">
                <>
                  {/* Rooms listing */}
                  <div className="mb-6">
                    <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Available Rooms</h1>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Browse and book rooms for your events</p>
                  </div>

                  {displayRooms.length === 0 ? (
                    <div className={`${theme === 'dark' ? 'bg-yellow-900/30 border-yellow-700 text-yellow-200' : 'bg-yellow-50 border-yellow-400 text-yellow-700'} border-l-4 p-4 mb-6`}>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className={`h-5 w-5 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm">
                            No rooms found matching your criteria.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {displayRooms.map((room) => (
                        <div 
                          key={room._id} 
                          className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group`}
                        >
                          <div className="h-48 relative overflow-hidden">
                            {room.image ? (
                              <div 
                                className="w-full h-full bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500" 
                                style={{ backgroundImage: `url(${room.image})` }}
                              ></div>
                            ) : (
                              <div className="w-full h-full bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500" 
                                style={{ 
                                  backgroundImage: `url(https://images.unsplash.com/photo-1517164850305-99a3e65bb47e?auto=format&fit=crop&q=80&w=1000)` 
                                }}
                              ></div>
                            )}
                            <div className="absolute top-0 right-0 p-2">
                              <span className={`text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-lg ${
                                room.type === 'classroom' ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
                                room.type === 'conference' ? 'bg-gradient-to-r from-purple-600 to-purple-700' :
                                room.type === 'laboratory' ? 'bg-gradient-to-r from-green-600 to-green-700' :
                                room.type === 'auditorium' ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
                                'bg-gradient-to-r from-gray-600 to-gray-700'
                              }`}>
                                {room.type === 'other' && room.otherType ? room.otherType.charAt(0).toUpperCase() + room.otherType.slice(1) : formatRoomType(room.type)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-200 group-hover:text-indigo-300' : 'text-gray-800 group-hover:text-indigo-700'} transition-colors`}>{room.name}</h3>
                              <div className={`flex items-center text-sm ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'} font-medium`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span>{room.building}, Floor {room.floor}</span>
                              </div>
                            </div>
                            
                            <div className={`flex items-center text-sm ${theme === 'dark' ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-700'} px-3 py-1.5 rounded-lg mb-4 w-fit`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span className="font-semibold">{room.capacity}</span> <span className="ml-1">guests maximum</span>
                            </div>
                            
                            {/* Amenities */}
                            {room.amenities && room.amenities.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mb-5">
                                {room.amenities.slice(0, 3).map((amenity, index) => (
                                  <span key={index} className={`inline-flex items-center rounded-full ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'} px-3 py-1 text-xs font-medium transition-all ${theme === 'dark' ? 'hover:bg-blue-800/30' : 'hover:bg-blue-100'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {amenity}
                                  </span>
                                ))}
                                {room.amenities.length > 3 && (
                                  <span className={`inline-flex items-center rounded-full ${theme === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-3 py-1 text-xs font-medium transition-all cursor-help`} title={room.amenities.slice(3).join(", ")}>
                                    +{room.amenities.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="mb-5 flex flex-wrap gap-2">
                                <span className={`inline-flex items-center rounded-full ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} px-3 py-1 text-xs font-medium transition-all`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Projector
                                </span>
                                <span className={`inline-flex items-center rounded-full ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} px-3 py-1 text-xs font-medium transition-all`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  WiFi
                                </span>
                              </div>
                            )}
                            
                            <Link 
                              href={`/dashboard/rooms/${room._id}`}
                              className={`block w-full text-center px-4 py-2.5 rounded-lg shadow-md transform hover:scale-[1.01] font-medium ${
                                theme === 'dark'
                                ? 'bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-800 hover:to-purple-800 text-white'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                              }`}>
                              View Details & Book
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className={`mt-6 flex items-center justify-between pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex flex-1 justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
                            currentPage === 1
                              ? theme === 'dark' 
                                ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                                : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                              : theme === 'dark'
                                ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                          }
                          disabled={currentPage === totalPages}
                          className={`ml-3 relative inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
                            currentPage === totalPages
                              ? theme === 'dark' 
                                ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                                : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                              : theme === 'dark'
                                ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Showing <span className="font-medium">{displayRooms.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to{" "}
                            <span className="font-medium">
                              {Math.min(currentPage * ITEMS_PER_PAGE, totalRooms)}
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
                              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                                currentPage === 1
                                  ? theme === 'dark'
                                    ? "border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : "border-gray-300 bg-white text-gray-300 cursor-not-allowed"
                                  : theme === 'dark'
                                    ? "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                                    : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
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
                                          ? "z-10 bg-indigo-900/30 border-indigo-700 text-indigo-300"
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
                                        ? 'bg-gray-800 border-gray-700 text-gray-300'
                                        : 'bg-white border-gray-300 text-gray-700'
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
                                    ? "border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : "border-gray-300 bg-white text-gray-300 cursor-not-allowed"
                                  : theme === 'dark'
                                    ? "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                                    : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
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
                                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4-4a1 1 0 01-1.414 0z"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
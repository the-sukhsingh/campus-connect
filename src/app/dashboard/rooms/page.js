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

  // Filter states
  const [buildings, setBuildings] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [filters, setFilters] = useState({
    building: '',
    type: '',
    capacity: '',
    search: ''
  });

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
        if (filters.search) url += `&search=${filters.search}`;
        
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




  return (
    <div className="max-w-7xl mx-auto">
 

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
                            
                            <Link 
                              href={`/dashboard/rooms/${room._id}`}
                              className="inline-flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors w-full">
                              View Details & Book
                            </Link>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
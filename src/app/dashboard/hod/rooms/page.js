'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HodRoomsPage() {
  const {user, dbUser} = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    floor: 0,
    capacity: 0,
    type: 'classroom',
    otherType: '',
    facilities: [],
    isActive: true,
    collegeId: dbUser?.college?._id || ''
  });
  

  useEffect(() => {
    if (!dbUser) return;
    
      
      fetchRooms();
      setFormData(prev => ({
        ...prev,
        collegeId: dbUser.college._id
      }));
    
  }, [ dbUser, router]);
  
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rooms?collegeId=${dbUser.college._id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      
      const data = await response.json();
      console.log("ROoms are ",data)
      setRooms(data.rooms);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'facilities') {
      setFormData(prev => ({
        ...prev,
        facilities: value ? value.split(',').map(item => item.trim()) : []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : 
                type === 'number' ? Number(value) : value
      }));
    }
  };
  
  const resetForm = () => {
    setSelectedRoom(null);
    setFormData({
      name: '',
      building: '',
      floor: 0,
      capacity: 0,
      type: 'classroom',
      otherType: '',
      facilities: [],
      isActive: true,
      collegeId: dbUser.college._id
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (selectedRoom) {
        // Update existing room
        response = await fetch('/api/rooms', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            id: selectedRoom._id
          })
        });
      } else {
        // Create new room
        response = await fetch('/api/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            firebaseUid: user.uid
          })
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save room');
      }
      
      await fetchRooms();
      setFormVisible(false);
      resetForm();
    } catch (err) {
      console.error('Error saving room:', err);
      setError(err.message);
    }
  };
  
  const handleEdit = (room) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      building: room.building,
      floor: room.floor,
      capacity: room.capacity,
      type: room.type || 'classroom',
      otherType: room.otherType || '',
      facilities: room.facilities || [],
      isActive: room.isActive !== false,
      collegeId: room.college
    });
    setFormVisible(true);
  };
  
  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/rooms?id=${roomId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete room');
      }
      
      await fetchRooms();
    } catch (err) {
      console.error('Error deleting room:', err);
      setError(err.message);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading rooms...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Room Management</h1>
            <button
              onClick={() => {
                resetForm();
                setFormVisible(!formVisible);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm flex items-center"
            >
              {formVisible ? 'Cancel' : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Room
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {formVisible && (
            <div className="bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 p-6 rounded-xl mb-6 shadow-lg transform transition-all duration-300">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-600 mb-6 inline-block">
                {selectedRoom ? '✏️ Edit Room' : '✨ Create New Room'}
              </h2>
              
              <form onSubmit={handleSubmit} className="transition-all duration-500">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="group transition-all duration-300">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-teal-600 transition-colors duration-200">
                      Room Name *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="block w-full px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 hover:shadow-md"
                        placeholder="Enter room name"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group transition-all duration-300">
                    <label htmlFor="building" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-teal-600 transition-colors duration-200">
                      Building *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="text"
                        id="building"
                        name="building"
                        value={formData.building}
                        onChange={handleInputChange}
                        required
                        className="block w-full px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 hover:shadow-md"
                        placeholder="Enter building name"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1v1h-3v-1H8v1H5v-1a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group transition-all duration-300">
                    <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-teal-600 transition-colors duration-200">
                      Floor *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="floor"
                        name="floor"
                        value={formData.floor}
                        onChange={handleInputChange}
                        required
                        min="0"
                        className="block w-full px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 hover:shadow-md"
                        placeholder="Enter floor number"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group transition-all duration-300">
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-teal-600 transition-colors duration-200">
                      Capacity *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="capacity"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="block w-full px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 hover:shadow-md"
                        placeholder="Enter room capacity"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group transition-all duration-300">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-teal-600 transition-colors duration-200">
                      Room Type *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="block w-full px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 hover:shadow-md appearance-none"
                      >
                        <option value="classroom">Classroom</option>
                        <option value="laboratory">Laboratory</option>
                        <option value="conference">Conference Room</option>
                        <option value="auditorium">Auditorium</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {formData.type === 'other' && (
                    <div className="group transition-all duration-300 animate-fadeIn">
                      <label htmlFor="otherType" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-teal-600 transition-colors duration-200">
                        Specify Other Type *
                      </label>
                      <input
                        type="text"
                        id="otherType"
                        name="otherType"
                        value={formData.otherType}
                        onChange={handleInputChange}
                        required
                        className="block w-full px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 hover:shadow-md"
                        placeholder="Specify room type"
                      />
                    </div>
                  )}
                  
                  <div className="group transition-all duration-300 sm:col-span-2">
                    <label htmlFor="facilities" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-teal-600 transition-colors duration-200">
                      Facilities
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="facilities"
                        name="facilities"
                        value={formData.facilities?.join(', ') || ''}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 hover:shadow-md"
                        placeholder="projector, whiteboard, computers, etc."
                      />
                      <div className="mt-2 text-xs text-gray-500">Comma separated list of facilities available in the room</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-2 sm:col-span-2">
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-300 ease-in-out checked:right-0 checked:border-teal-500"
                      />
                      <label
                        htmlFor="isActive"
                        className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300 ease-in-out checked:bg-teal-100"
                      ></label>
                    </div>
                    <label htmlFor="isActive" className="text-sm text-gray-700">
                      Room is active and available for booking
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end mt-8 space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setFormVisible(false);
                    }}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 hover:shadow flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 transform hover:scale-105 flex items-center"
                  >
                    {selectedRoom ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Update Room
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Save Room
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {rooms.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-center rounded-xl shadow-sm">
              <div className="animate-pulse inline-block p-6 bg-white rounded-full shadow-inner mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-600 to-gray-500">No rooms found</p>
              <p className="mt-2 text-gray-500">Add your first room to get started</p>
              <button
                onClick={() => {
                  resetForm();
                  setFormVisible(true);
                }}
                className="mt-6 inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create First Room
              </button>
            </div>
          ) : (
            <div className="overflow-hidden shadow-md rounded-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-teal-50 to-blue-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-teal-700">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Name
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-teal-700">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Building
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-teal-700">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                          Floor
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-teal-700">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          Type
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-teal-700">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Capacity
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-teal-700">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Status
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-teal-700">
                        <div className="flex items-center justify-end">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          Actions
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {rooms && rooms.map((room, idx) => (
                      <tr key={room._id} className={`hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-50 transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900 hover:text-teal-600 transition-colors duration-200">{room.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 hover:text-teal-600 transition-colors duration-200">{room.building}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{room.floor}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm capitalize text-gray-500">
                            {room.type === 'other' && room.otherType 
                              ? room.otherType.charAt(0).toUpperCase() + room.otherType.slice(1)
                              : room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                            {room.capacity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${room.isActive !== false ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'}`}>
                            {room.isActive !== false ? (
                              <>
                                <svg className="w-3 h-3 mr-1.5 text-green-500" fill="currentColor" viewBox="0 0 8 8">
                                  <circle cx="4" cy="4" r="3" />
                                </svg>
                                Active
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1.5 text-red-500" fill="currentColor" viewBox="0 0 8 8">
                                  <circle cx="4" cy="4" r="3" />
                                </svg>
                                Inactive
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-3">
                            <button 
                              onClick={() => handleEdit(room)}
                              className="group inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-teal-700 bg-teal-100 hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 group-hover:animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(room._id)}
                              className="group inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 group-hover:animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
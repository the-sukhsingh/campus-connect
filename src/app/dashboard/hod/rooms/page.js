'use client';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HodRoomsPage() {
  const { theme } = useTheme();
  const { user, dbUser } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const fileInputRef = useRef(null);
  
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

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  useEffect(() => {
    if (!user) return;

    
    fetchRooms();
  }, [dbUser, router]);
  
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rooms?action=get-rooms&uid=${user?.uid}&collegeId=${dbUser?.college?._id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load rooms. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'facilities') {
      const facilitiesArray = formData.facilities.slice();
      if (checked) {
        facilitiesArray.push(value);
      } else {
        const index = facilitiesArray.indexOf(value);
        if (index > -1) {
          facilitiesArray.splice(index, 1);
        }
      }
      setFormData(prev => ({ ...prev, facilities: facilitiesArray }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large. Maximum size is 5MB.');
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    setImageFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Clean up the preview URL when component unmounts
    return () => URL.revokeObjectURL(previewUrl);
  };
  
  const resetForm = () => {
    setFormData({
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
    setSelectedRoom(null);
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFormVisible(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create FormData for multipart form
      const formDataToSubmit = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        // Handle arrays like facilities
        if (Array.isArray(value)) {
          formDataToSubmit.append(key, JSON.stringify(value));
        } else {
          formDataToSubmit.append(key, value);
        }
      });
      
      // Add Firebase UID
      formDataToSubmit.append('firebaseUid', user.uid);
      
      // If editing, add room ID
      if (selectedRoom) {
        formDataToSubmit.append('id', selectedRoom._id);
      }
      
      // Add image if selected
      if (imageFile) {
        formDataToSubmit.append('image', imageFile);
      }
      
      const method = selectedRoom ? 'PUT' : 'POST';
      const endpoint = selectedRoom 
        ? `/api/rooms?action=update-room&uid=${user?.uid}&roomId=${selectedRoom._id}`
        : `/api/rooms?action=create-room&uid=${user?.uid}`;
        
      const response = await fetch(endpoint, {
        method,
        body: formDataToSubmit
        // No Content-Type header - browser will set it automatically with boundary for FormData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save room');
      }
      
      // Reset form and fetch updated list
      resetForm();
      fetchRooms();
      
    } catch (err) {
      console.error('Error saving room:', err);
      setError(err.message || 'Failed to save room. Please try again.');
    }
  };
  
  const handleEdit = (room) => {
    const roomData = {
      ...room,
      collegeId: room.collegeId || dbUser?.college?._id || '',
    };
    
    // Handle the type field for "other" case
    if (!['classroom', 'lab', 'seminar', 'conference', 'auditorium'].includes(room.type)) {
      roomData.otherType = room.type;
      roomData.type = 'other';
    }
    
    setFormData(roomData);
    setSelectedRoom(room);
    setFormVisible(true);
    
    // Set image preview if room has an image
    if (room.imageUrl) {
      setImagePreview(room.imageUrl);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Scroll to the form
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDelete = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/rooms?action=delete-room&uid=${user?.uid}&roomId=${roomId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete room');
      }
      
      // Update the rooms list
      fetchRooms();
      
    } catch (err) {
      console.error('Error deleting room:', err);
      setError(err.message || 'Failed to delete room. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex justify-center items-center ${theme === 'dark' ? 'bg-[var(--background)] text-[var(--foreground)]' : 'bg-[var(--background)] text-[var(--foreground)]'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-[var(--background)] text-[var(--foreground)]' : 'bg-[var(--background)] text-[var(--foreground)]'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Room Management</h1>
            <p className={`mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Add, edit and manage rooms in your college
            </p>
          </div>
          <button
            onClick={() => setFormVisible(!formVisible)}
            className={`flex items-center px-4 py-2 rounded-md shadow-sm ${
              theme === 'dark'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {formVisible ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Room
              </>
            )}
          </button>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-md ${theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-50 text-red-700 border border-red-200'}`} role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
              <div className="ml-auto">
                <button 
                  onClick={() => setError(null)} 
                  className={`inline-flex text-red-400 focus:outline-none focus:text-red-500 ${theme === 'dark' ? 'hover:text-red-300' : 'hover:text-red-600'}`}>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Room Form */}
        {formVisible && (
          <div className={`mb-8 p-6 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4">{selectedRoom ? 'Edit Room' : 'Add New Room'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Room Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Room Name*</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 focus:border-indigo-500' 
                        : 'bg-white border-gray-300 focus:border-indigo-500'
                    }`}
                    placeholder="e.g., Room 101, Physics Lab"
                  />
                </div>
                
                {/* Building */}
                <div>
                  <label htmlFor="building" className="block text-sm font-medium mb-1">Building*</label>
                  <input
                    type="text"
                    id="building"
                    name="building"
                    required
                    value={formData.building}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 focus:border-indigo-500' 
                        : 'bg-white border-gray-300 focus:border-indigo-500'
                    }`}
                    placeholder="e.g., Main Building, Science Block"
                  />
                </div>
                
                {/* Floor */}
                <div>
                  <label htmlFor="floor" className="block text-sm font-medium mb-1">Floor</label>
                  <input
                    type="number"
                    id="floor"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 focus:border-indigo-500' 
                        : 'bg-white border-gray-300 focus:border-indigo-500'
                    }`}
                    placeholder="Floor number"
                  />
                </div>
                
                {/* Capacity */}
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium mb-1">Seating Capacity*</label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    required
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 focus:border-indigo-500' 
                        : 'bg-white border-gray-300 focus:border-indigo-500'
                    }`}
                    placeholder="Number of seats"
                    min="0"
                  />
                </div>
                
                {/* Room Type */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium mb-1">Room Type*</label>
                  <select
                    id="type"
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 focus:border-indigo-500' 
                        : 'bg-white border-gray-300 focus:border-indigo-500'
                    }`}
                  >
                    <option value="classroom">Classroom</option>
                    <option value="lab">Laboratory</option>
                    <option value="seminar">Seminar Hall</option>
                    <option value="conference">Conference Room</option>
                    <option value="auditorium">Auditorium</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {/* Other Type (conditional) */}
                {formData.type === 'other' && (
                  <div>
                    <label htmlFor="otherType" className="block text-sm font-medium mb-1">Specify Type*</label>
                    <input
                      type="text"
                      id="otherType"
                      name="otherType"
                      required
                      value={formData.otherType}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 focus:border-indigo-500'
                      }`}
                      placeholder="Specify room type"
                    />
                  </div>
                )}
              </div>
              
              {/* Room Image */}
              <div className="mt-6">
                <label htmlFor="roomImage" className="block text-sm font-medium mb-1">Room Image</label>
                <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                  theme === 'dark'
                    ? 'border-gray-600 hover:border-indigo-500'
                    : 'border-gray-300 hover:border-indigo-500'
                }`}>
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="flex flex-col items-center">
                        <div className="relative h-40 w-full">
                          <Image 
                            src={imagePreview}
                            alt="Room image preview"
                            fill
                            style={{ objectFit: 'contain' }}
                            className="rounded-md"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className={`mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded ${
                            theme === 'dark'
                              ? 'bg-red-800 hover:bg-red-700 text-white'
                              : 'bg-red-100 hover:bg-red-200 text-red-700'
                          }`}
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg
                          className={`mx-auto h-12 w-12 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm justify-center">
                          <label
                            htmlFor="roomImage"
                            className={`relative cursor-pointer rounded-md font-medium ${
                              theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
                            } hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500`}
                          >
                            <span>Upload an image</span>
                            <input
                              id="roomImage"
                              name="roomImage"
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="sr-only"
                            />
                          </label>
                          <p className={`pl-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            or drag and drop
                          </p>
                        </div>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Facilities */}
              <div className="mt-6">
                <span className="block text-sm font-medium mb-2">Facilities Available</span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                  {['Projector', 'Whiteboard', 'Computer', 'Internet', 'Air Conditioning', 'Audio System'].map(facility => (
                    <label key={facility} className="flex items-center">
                      <input
                        type="checkbox"
                        name="facilities"
                        value={facility}
                        checked={formData.facilities.includes(facility)}
                        onChange={handleInputChange}
                        className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'border-gray-300'
                        }`}
                      />
                      <span className="ml-2 text-sm">{facility}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Is Active */}
              <div className="mt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'border-gray-300'
                    }`}
                  />
                  <span className="ml-2 text-sm">Room is active and available for booking</span>
                </label>
              </div>
              
              {/* Form Buttons */}
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className={`px-4 py-2 border rounded-md ${
                    theme === 'dark'
                      ? 'border-gray-600 hover:bg-gray-700'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md ${
                    theme === 'dark'
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {selectedRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rooms List */}
        {rooms.length > 0 ? (
          <div className={`border rounded-lg shadow-sm overflow-hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}">
                <thead className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Room</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Image</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Capacity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className={`${theme === 'dark' ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}`}>
                  {rooms.map((room) => (
                    <tr key={room._id} className={`${room.isActive ? '' : 'opacity-60'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{room.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {room.imageUrl ? (
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100 relative">
                            <Image 
                              src={room.viewUrl} 
                              alt={room.name}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                            No image
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>{room.building}</div>
                        <div className="text-sm opacity-75">Floor {room.floor}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">
                        {room.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {room.capacity} seats
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          room.isActive
                            ? theme === 'dark' ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                            : theme === 'dark' ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'
                        }`}>
                          {room.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(room)}
                            className={`p-1.5 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Edit Room"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(room._id)}
                            className={`p-1.5 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Delete Room"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={`text-center py-12 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-lg font-medium">No rooms found</h3>
            <p className="mt-1 text-sm opacity-75">Click &quot;Add New Room&quot; to add your first room.</p>
            <div className="mt-6">
              <button
                onClick={() => setFormVisible(true)}
                className={`inline-flex items-center px-4 py-2 rounded-md ${
                  theme === 'dark' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
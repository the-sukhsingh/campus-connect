'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import withRoleProtection from '@/utils/withRoleProtection';

const AddRoomPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Room data state
  const [roomData, setRoomData] = useState({
    name: '',
    building: '',
    floor: 0,
    roomNumber: '',
    capacity: 0,
    type: 'classroom',
    description: '',
    amenities: []
  });
  
  // Room type options
  const roomTypes = [
    { value: 'classroom', label: 'Classroom' },
    { value: 'lab', label: 'Laboratory' },
    { value: 'conference', label: 'Conference Room' },
    { value: 'auditorium', label: 'Auditorium' },
    { value: 'other', label: 'Other' }
  ];
  
  // Common amenities options
  const commonAmenities = [
    'Projector',
    'Whiteboard',
    'Smart Board',
    'Air Conditioning',
    'Computer Systems',
    'Video Conferencing',
    'WiFi',
    'Disabled Access'
  ];
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setRoomData({
        ...roomData,
        [name]: value === '' ? '' : parseInt(value)
      });
    } else {
      setRoomData({
        ...roomData,
        [name]: value
      });
    }
  };
  
  // Handle amenity checkbox changes
  const handleAmenityChange = (amenity) => {
    setRoomData(prevData => {
      const currentAmenities = [...prevData.amenities];
      
      if (currentAmenities.includes(amenity)) {
        return {
          ...prevData,
          amenities: currentAmenities.filter(a => a !== amenity)
        };
      } else {
        return {
          ...prevData,
          amenities: [...currentAmenities, amenity]
        };
      }
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Input validation
    if (!roomData.name || !roomData.building || !roomData.roomNumber || roomData.capacity <= 0) {
      setError('Please fill out all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          roomData
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room');
      }
      
      // Redirect to rooms management page on success
      router.push('/dashboard/hod/rooms');
      
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel button
  const handleCancel = () => {
    router.push('/dashboard/hod/rooms');
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Add New Room</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Room Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={roomData.name}
              onChange={handleInputChange}
              placeholder="e.g., Main Lecture Hall"
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          
          {/* Building */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Building <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="building"
              value={roomData.building}
              onChange={handleInputChange}
              placeholder="e.g., Main Building"
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          
          {/* Floor */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Floor <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              name="floor"
              value={roomData.floor}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
              min="0"
              required
            />
            <p className="text-xs text-gray-500 mt-1">0 for ground floor, negative for basement levels</p>
          </div>
          
          {/* Room Number */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Room Number <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="roomNumber"
              value={roomData.roomNumber}
              onChange={handleInputChange}
              placeholder="e.g., 101"
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          
          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Capacity <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              name="capacity"
              value={roomData.capacity}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
              min="1"
              required
            />
          </div>
          
          {/* Room Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Room Type <span className="text-red-600">*</span>
            </label>
            <select
              name="type"
              value={roomData.type}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              {roomTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Description */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={roomData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full border rounded px-3 py-2"
            placeholder="Brief description of the room and its features"
          />
        </div>
        
        {/* Amenities */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">
            Amenities
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {commonAmenities.map(amenity => (
              <div key={amenity} className="flex items-center">
                <input
                  type="checkbox"
                  id={`amenity-${amenity}`}
                  checked={roomData.amenities.includes(amenity)}
                  onChange={() => handleAmenityChange(amenity)}
                  className="mr-2"
                />
                <label htmlFor={`amenity-${amenity}`} className="text-sm">
                  {amenity}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Custom Amenity Input */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Add Custom Amenity
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="customAmenity"
              placeholder="e.g., Standing Desks"
              className="flex-grow border rounded px-3 py-2"
            />
            <button
              type="button"
              onClick={() => {
                const customAmenity = document.getElementById('customAmenity').value.trim();
                if (customAmenity) {
                  handleAmenityChange(customAmenity);
                  document.getElementById('customAmenity').value = '';
                }
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              Add
            </button>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default withRoleProtection(AddRoomPage, ['hod']);
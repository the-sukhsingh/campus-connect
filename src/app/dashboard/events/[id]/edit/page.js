'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

function EditEventPage() {
  const { user, dbUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [unauthorized, setUnauthorized] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    venue: '',
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

  // Fetch event data on component mount
  useEffect(() => {
    if (!user || !eventId) return;

    async function fetchEventData() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/events?action=get-event&uid=${user.uid}&eventId=${eventId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch event data');
        }
        
        const data = await response.json();
        
        // Check if current user is the organizer or HOD
        const isOrganizer = data.event.organizer._id === dbUser?._id;
        const isHOD = dbUser?.role === 'hod';
        
        if (!isOrganizer && !isHOD) {
          setUnauthorized(true);
          return;
        }

        // Format the date to work with datetime-local input
        const eventDate = new Date(data.event.date);
        const formattedDate = eventDate.toISOString().slice(0, 16);
        
        // Update form data with fetched event
        setFormData({
          title: data.event.title,
          description: data.event.description,
          category: data.event.category,
          date: formattedDate,
          venue: data.event.venue,
          maxAttendees: data.event.maxAttendees
        });
      } catch (error) {
        console.error('Error fetching event:', error);
        setMessage({
          type: 'error',
          text: error.message || 'Failed to load event data. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchEventData();
  }, [user, eventId, dbUser]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setMessage({
        type: 'error',
        text: 'You must be logged in to update an event'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          eventId: eventId,
          eventData: {
            ...formData,
            date: new Date(formData.date),
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }
      
      setMessage({
        type: 'success',
        text: 'Event updated successfully!'
      });
      
      // Redirect after successful submission
      setTimeout(() => {
        router.push(`/dashboard/events/${eventId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error updating event:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update event. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Loading event data...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message
  if (unauthorized) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Unauthorized</p>
          <p>You don&apos;t have permission to edit this event. Only the event organizer or HOD can edit events.</p>
        </div>
        <div className="mt-6">
          <Link
            href={`/dashboard/events/${eventId}`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors"
          >
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Edit Event</h1>
          <p className="text-gray-600 mt-1">
            Update the event details below
          </p>
        </div>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
        >
          Cancel
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
                Date and Time *
              </label>
              <input
                id="date"
                name="date"
                type="datetime-local"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Venue */}
            <div className="md:col-span-2">
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                Venue *
              </label>
              <input
                id="venue"
                name="venue"
                type="text"
                required
                value={formData.venue}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter venue location"
              />
            </div>
            
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
                  Updating Event...
                </>
              ) : (
                'Update Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing faculty and hod access
export default withRoleProtection(EditEventPage, ['hod', 'faculty']);
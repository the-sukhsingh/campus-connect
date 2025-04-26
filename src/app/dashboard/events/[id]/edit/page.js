'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

function EditEventPage() {
  const { user, dbUser } = useAuth();
  const { theme } = useTheme();
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
      <div className={`p-6 flex justify-center items-center h-[80vh] ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`inline-block animate-spin h-10 w-10 border-4 ${theme === 'dark' ? 'border-indigo-400 border-t-transparent' : 'border-indigo-600 border-t-transparent'} rounded-full mb-4`}></div>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-lg`}>Loading event data...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message
  if (unauthorized) {
    return (
      <div className={`p-8 max-w-4xl mx-auto ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white'}`}>
        <div className={`${theme === 'dark' ? 'bg-red-900/30 border-red-700' : 'bg-red-100 border-red-500'} border-l-4 text-red-700 p-6 mb-6 rounded-lg shadow-sm`} role="alert">
          <p className="font-bold text-xl">Unauthorized</p>
          <p className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>You don&apos;t have permission to edit this event. Only the event organizer or HOD can edit events.</p>
        </div>
        <div className="mt-6">
          <Link
            href={`/dashboard/events/${eventId}`}
            className={`${theme === 'dark' ? 'bg-indigo-700 hover:bg-indigo-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-3 px-6 rounded-lg transition-colors shadow-md inline-flex items-center gap-2`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50'} min-h-screen p-8`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-opacity-20 pb-6">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-700'}`}>Edit Event</h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
              Update your event details below
            </p>
          </div>
          <Link
            href={`/dashboard/events/${eventId}`}
            className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-100 text-gray-800'} py-2.5 px-5 rounded-lg transition-colors shadow-sm border border-opacity-20 inline-flex items-center gap-2`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
            Cancel
          </Link>
        </div>

        {message.text && (
          <div 
            className={`p-4 mb-8 border-l-4 rounded-lg shadow-sm ${
              message.type === 'error' 
                ? theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-400' : 'bg-red-100 border-red-500 text-red-700'
                : theme === 'dark' ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-green-100 border-green-500 text-green-700'
            }`} 
            role="alert"
          >
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-8 transition-all duration-200 hover:shadow-xl`}>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Title */}
              <div className="md:col-span-2">
                <label htmlFor="title" className={`block text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Event Title <span className="text-red-500">*</span>
                </label>
                <div className={`relative rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700 focus-within:ring-indigo-500' : 'bg-gray-50 focus-within:ring-indigo-500'} focus-within:ring-2 transition-all duration-200`}>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className={`block w-full px-4 py-3.5 rounded-lg focus:outline-none ${theme === 'dark' ? 'bg-gray-700 text-white placeholder:text-gray-400' : 'bg-gray-50 text-gray-900 placeholder:text-gray-500'}`}
                    placeholder="Enter a descriptive title..."
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className={`block text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Category <span className="text-red-500">*</span>
                </label>
                <div className={`relative rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-200`}>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className={`block w-full px-4 py-3.5 rounded-lg focus:outline-none appearance-none ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'}`}
                  >
                    <option value="" className={theme === 'dark' ? 'bg-gray-800' : ''}>Select a category</option>
                    {eventCategories.map((category) => (
                      <option key={category} value={category} className={theme === 'dark' ? 'bg-gray-800' : ''}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div>
                <label htmlFor="date" className={`block text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Date and Time <span className="text-red-500">*</span>
                </label>
                <div className={`relative rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-200`}>
                  <input
                    id="date"
                    name="date"
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className={`block w-full px-4 py-3.5 rounded-lg focus:outline-none ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'}`}
                  />
                </div>
              </div>

              {/* Venue */}
              <div className="md:col-span-2">
                <label htmlFor="venue" className={`block text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Venue <span className="text-red-500">*</span>
                </label>
                <div className={`relative rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-200`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="venue"
                    name="venue"
                    type="text"
                    required
                    value={formData.venue}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-4 py-3.5 rounded-lg focus:outline-none ${theme === 'dark' ? 'bg-gray-700 text-white placeholder:text-gray-400' : 'bg-gray-50 text-gray-900 placeholder:text-gray-500'}`}
                    placeholder="Enter venue location"
                  />
                </div>
              </div>
              
              {/* Maximum Attendees */}
              <div className="md:col-span-2">
                <label htmlFor="maxAttendees" className={`block text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Maximum Attendees
                </label>
                <div className={`relative rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-200`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <input
                    id="maxAttendees"
                    name="maxAttendees"
                    type="number"
                    min="0"
                    value={formData.maxAttendees}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-4 py-3.5 rounded-lg focus:outline-none ${theme === 'dark' ? 'bg-gray-700 text-white placeholder:text-gray-400' : 'bg-gray-50 text-gray-900 placeholder:text-gray-500'}`}
                    placeholder="0 for unlimited"
                  />
                </div>
                <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Set to 0 for unlimited attendees</p>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className={`block text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Description <span className="text-red-500">*</span>
                </label>
                <div className={`relative rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-200`}>
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    required
                    value={formData.description}
                    onChange={handleChange}
                    className={`block w-full px-4 py-3.5 rounded-lg focus:outline-none ${theme === 'dark' ? 'bg-gray-700 text-white placeholder:text-gray-400' : 'bg-gray-50 text-gray-900 placeholder:text-gray-500'}`}
                    placeholder="Provide details about the event including agenda, special instructions, and what participants should expect..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-opacity-20">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white ${
                    theme === 'dark' 
                      ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' 
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating Event...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Update Event
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing faculty and hod access
export default withRoleProtection(EditEventPage, ['hod', 'faculty']);
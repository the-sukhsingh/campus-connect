'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function EventDetailsPage() {
  const { user, dbUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id ;
  
  const [event, setEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch event details when component mounts
  useEffect(() => {
    if (!user || !eventId) return;

    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/events?action=get-event&uid=${user?.uid}&eventId=${eventId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch event details');
        }

        const data = await response.json();
        setEvent(data.event);
        setIsRegistered(data.isRegistered);
        setLoading(false);
        
        // Add a notification message if user is registered
        if (data.isRegistered) {
          setMessage({
            type: 'success',
            text: 'You are registered for this event!'
          });
          
          // Clear the message after 3 seconds
          setTimeout(() => {
            setMessage({ type: '', text: '' });
          }, 3000);
        }
      } catch (error ) {
        console.error('Error fetching event details:', error);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [user, eventId]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle registration
  const handleRegister = async () => {
    if (!user || !eventId) return;
    
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          eventId,
          action: 'register'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to register for the event');
      }
      
      setIsRegistered(true);
      setEvent(data.event);
      setMessage({
        type: 'success',
        text: data.message || 'Successfully registered for the event'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error registering for event:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to register for the event. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancellation
  const handleCancelRegistration = async () => {
    if (!user || !eventId) return;
    
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          eventId,
          action: 'cancel-registration'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel registration');
      }
      
      setIsRegistered(false);
      setEvent(data.event);
      setMessage({
        type: 'success',
        text: data.message || 'Successfully canceled event registration'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error canceling registration:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to cancel registration. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle event deletion
  const handleDeleteEvent = async () => {
    if (!user || !eventId) return;
    
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/events?uid=${user.uid}&eventId=${eventId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete the event');
      }
      
      setMessage({
        type: 'success',
        text: 'Event successfully deleted.'
      });
      
      // Navigate back to events list after a delay
      setTimeout(() => {
        router.push('/dashboard/events');
      }, 1500);
      
    } catch (error) {
      console.error('Error deleting event:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to delete the event. Please try again later.'
      });
      setIsDeleting(false);
    }
  };

  // Get color for event category
  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case 'academic':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cultural':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'sports':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'workshop':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'seminar':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'conference':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'competition':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'social':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Check if event is in the past
  const isEventPast = (dateString) => {
    return new Date(dateString) < new Date();
  };

  // Check if current user can manage this event (organizer or HOD)
  const canManageEvent = () => {
    if (!event || !user || !dbUser) return false;
    const isOrganizer = event.organizer._id === dbUser?._id;
    const isHOD = dbUser?.role === 'hod';
    return isOrganizer || isHOD;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
        <Link
          href="/dashboard/events"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-sm text-yellow-700">Event not found.</p>
        </div>
        <Link
          href="/dashboard/events"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  const isAtCapacity = event.maxAttendees > 0 && event.attendees.length >= event.maxAttendees;
  const isPastEvent = isEventPast(event.date);
  const isOrganizer = event.organizer.email === user?.email;
  const showManageButtons = canManageEvent();

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-gray-600 mt-1">
            Event Details
          </p>
        </div>
        <div className="flex gap-2">
          {showManageButtons && (
            <>
              <Link
                href={`/dashboard/events/${eventId}/edit`}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
              >
                Edit Event
              </Link>
              <button
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className={`bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors ${
                  isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isDeleting ? 'Deleting...' : 'Delete Event'}
              </button>
            </>
          )}
          <Link
            href="/dashboard/events"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors"
          >
            Back to Events
          </Link>
        </div>
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

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex flex-wrap justify-between items-start mb-6">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mr-2 ${getCategoryColor(event.category)}`}>
                  {event.category}
                </span>
                {isPastEvent && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border-gray-300">
                    Past Event
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-4 whitespace-pre-line">{event.description}</p>
            </div>

            <div className="w-full md:w-auto bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-3">Event Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(event.date)}</span>
                </div>
                
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.venue}</span>
                </div>
                
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Organized by: {event.organizer.displayName || event.organizer.email}</span>
                </div>
                
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>
                    {event.attendees.length} {event.attendees.length === 1 ? 'person' : 'people'} attending
                    {event.maxAttendees > 0 && ` (${event.maxAttendees - event.attendees.length} spots left)`}
                  </span>
                </div>
              </div>
              
              {!isPastEvent && !isOrganizer && !showManageButtons && (
                <div className="mt-4">
                  {!isRegistered ? (
                    <button
                      onClick={handleRegister}
                      disabled={isSubmitting || isAtCapacity}
                      className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        isAtCapacity
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Registering...
                        </>
                      ) : isAtCapacity ? (
                        'Event Full'
                      ) : (
                        'Register for Event'
                      )}
                    </button>
                  ) : (
                    <div>
                      <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mb-3">
                        <p className="text-sm">You're registered for this event!</p>
                      </div>
                      <button
                        onClick={handleCancelRegistration}
                        disabled={isSubmitting}
                        className={`w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Canceling...
                          </>
                        ) : (
                          'Cancel Registration'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {(isOrganizer || showManageButtons || event.attendees.length > 0) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Attendees</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                {event.attendees.length === 0 ? (
                  <p className="text-gray-500">No one has registered for this event yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {event.attendees.map((attendee) => (
                      <li key={attendee._id} className="py-3 flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          {attendee.displayName ? attendee.displayName.charAt(0).toUpperCase() : attendee.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3 flex-grow">
                          <p className="text-sm font-medium text-gray-900">{attendee.displayName || attendee.email}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <p className="text-sm text-gray-500">Role: {attendee.role}</p>
                            {attendee.department && <p className="text-sm text-gray-500">• Dept: {attendee.department}</p>}
                            {attendee.rollNo && <p className="text-sm text-gray-500">• Roll No: {attendee.rollNo}</p>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing admin, faculty, and student access
export default withRoleProtection(EventDetailsPage, ['hod', 'faculty', 'student']);
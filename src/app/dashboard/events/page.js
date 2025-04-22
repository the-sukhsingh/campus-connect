'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function EventsPage() {
  const { user, dbUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [registeredEventIds, setRegisteredEventIds] = useState([]);

  // Fetch events when component mounts
  useEffect(() => {
    if (!user) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/events?action=get-all-events&uid=${user?.uid}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        setEvents(data.events || []);
        
        // Also fetch registered events for the user
        const registeredResponse = await fetch(
          `/api/events?action=get-registered-events&uid=${user?.uid}`
        );
        
        if (registeredResponse.ok) {
          const registeredData = await registeredResponse.json();
          // We'll use this to highlight registered events in the UI
          const registeredIds = registeredData.events.map(event => event._id);
          setRegisteredEventIds(registeredIds);
        }
      } catch (error ) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter events based on active tab
  const filteredEvents = events.filter(event => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') {
      return new Date(event.date) >= new Date();
    }
    if (activeTab === 'past') {
      return new Date(event.date) < new Date();
    }
    if (activeTab === 'myEvents') {
      return event.organizer?.email === user?.email;
    }
    if (activeTab === 'myRegistrations') {
      return registeredEventIds.includes(event._id);
    }
    return true;
  });

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

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Campus Events</h1>
          <p className="text-gray-600 mt-1">
            Browse and manage campus events
          </p>
        </div>
        <div className="flex space-x-4">

        
       {
        dbUser.role !== 'student' && (
          <Link
          href="/dashboard/events/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New Event
        </Link>
        )
       }
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past Events
          </button>
          <button
            onClick={() => setActiveTab('myEvents')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'myEvents'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Events
          </button>
          <button
            onClick={() => setActiveTab('myRegistrations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'myRegistrations'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Registrations
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">
            {activeTab === 'myEvents'
              ? "You haven't organized any events yet."
              : activeTab === 'upcoming'
              ? "There are no upcoming events scheduled."
              : activeTab === 'past'
              ? "There are no past events to display."
              : activeTab === 'myRegistrations'
              ? "You haven't registered for any events yet."
              : "No events found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <Link href={`/dashboard/events/${event._id}`} className="block p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(event.category)}`}>
                    {event.category}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                
                <div className="text-sm text-gray-500 mb-4">
                  <div className="flex items-start mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(event.date)}</span>
                  </div>
                  
                  <div className="flex items-start mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.venue}</span>
                  </div>
                  
                  <div className="flex items-start mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Organized by: {event.organizer?.displayName || event.organizer?.email || 'Unknown'}</span>
                  </div>
                  
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>
                      {event.attendees?.length || 0} {(event.attendees?.length || 0) === 1 ? 'person' : 'people'} attending
                      {event.maxAttendees === 0 ? ' (unlimited spots)' : event.maxAttendees > 0 && ` (${event.maxAttendees - (event.attendees?.length || 0)} spots left)`}
                    </span>
                  </div>
                </div>
                
                <div className="flex mt-4">
                  <button
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                  >
                    View Details & Register
                  </button>
                </div>
              </Link>
              
              {event.organizer?.email === user?.email && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex space-x-4">
                    <Link
                      href={`/dashboard/events/${event._id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit Event
                    </Link>
                    <Link
                      href={`/dashboard/events/${event._id}`}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      View Attendees
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing admin, faculty, and student access
export default withRoleProtection(EventsPage, ['hod', 'faculty', 'student']);
'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function StudentEventsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  // Fetch registered events when component mounts
  useEffect(() => {
    if (!user) return;

    const fetchRegisteredEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/events?action=get-registered-events&uid=${user?.uid}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch registered events');
        }

        const data = await response.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error('Error fetching registered events:', error);
        setError('Failed to load your registered events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRegisteredEvents();
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
    return true;
  });

  // Get color for event category with theme awareness
  const getCategoryColor = (category) => {
    const isDark = theme === 'dark';
    
    switch (category?.toLowerCase()) {
      case 'academic':
        return isDark ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cultural':
        return isDark ? 'bg-purple-900/30 text-purple-300 border-purple-800' : 'bg-purple-100 text-purple-800 border-purple-300';
      case 'sports':
        return isDark ? 'bg-green-900/30 text-green-300 border-green-800' : 'bg-green-100 text-green-800 border-green-300';
      case 'workshop':
        return isDark ? 'bg-yellow-900/30 text-yellow-300 border-yellow-800' : 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'seminar':
        return isDark ? 'bg-orange-900/30 text-orange-300 border-orange-800' : 'bg-orange-100 text-orange-800 border-orange-300';
      case 'conference':
        return isDark ? 'bg-indigo-900/30 text-indigo-300 border-indigo-800' : 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'competition':
        return isDark ? 'bg-red-900/30 text-red-300 border-red-800' : 'bg-red-100 text-red-800 border-red-300';
      case 'social':
        return isDark ? 'bg-pink-900/30 text-pink-300 border-pink-800' : 'bg-pink-100 text-pink-800 border-pink-300';
      default:
        return isDark ? 'bg-gray-800/30 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-[var(--background)] text-gray-100' : 'bg-gray-50 text-gray-900'} min-h-svh`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>My Event Registrations</h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            View all events you have registered for
          </p>
        </div>
        <Link
          href="/dashboard/events"
          className={`${theme === 'dark' 
            ? 'bg-indigo-700 hover:bg-indigo-600 text-white' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'} 
            py-2 px-4 rounded transition-colors`}
        >
          Browse All Events
        </Link>
      </div>

      {error && (
        <div className={`${theme === 'dark' 
          ? 'bg-red-900/20 border-l-4 border-red-700 text-red-300' 
          : 'bg-red-100 border-l-4 border-red-500 text-red-700'} 
          p-4 mb-6`} role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Tab navigation */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} mb-6`}>
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? theme === 'dark' 
                  ? 'border-indigo-400 text-indigo-400' 
                  : 'border-indigo-500 text-indigo-600'
                : theme === 'dark'
                  ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Registrations
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? theme === 'dark' 
                  ? 'border-indigo-400 text-indigo-400' 
                  : 'border-indigo-500 text-indigo-600'
                : theme === 'dark'
                  ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? theme === 'dark' 
                  ? 'border-indigo-400 text-indigo-400' 
                  : 'border-indigo-500 text-indigo-600'
                : theme === 'dark'
                  ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past Events
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className={`${theme === 'dark' 
          ? 'bg-yellow-900/20 border-l-4 border-yellow-700 text-yellow-300' 
          : 'bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700'} p-4`}>
          <p className="text-sm">
            {activeTab === 'upcoming'
              ? "You don't have any upcoming events you've registered for."
              : activeTab === 'past'
              ? "You don't have any past events you've registered for."
              : "You haven't registered for any events yet."}
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/events"
              className={`text-sm font-medium ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}
            >
              Browse available events →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event._id} 
              className={`${theme === 'dark' 
                ? 'bg-gray-800 shadow-lg hover:shadow-indigo-900/20' 
                : 'bg-white shadow-md hover:shadow-lg'} 
                rounded-lg overflow-hidden transition-shadow`}>
              <Link href={`/dashboard/events/${event._id}`} className="block p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {event.title}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(event.category)}`}>
                    {event.category}
                  </span>
                </div>
                
                <p className={`mb-4 line-clamp-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {event.description}
                </p>
                
                <div className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="flex items-start mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(event.date)}</span>
                  </div>
                  
                  <div className="flex items-start mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.venue}</span>
                  </div>
                  
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Organized by: {event.organizer?.displayName || event.organizer?.email || 'Unknown'}</span>
                  </div>
                </div>
                
                <div className={`mt-4 flex items-center text-sm ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  <span className="font-medium">View Event Details</span>
                  <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing student access only
export default withRoleProtection(StudentEventsPage, ['student']);
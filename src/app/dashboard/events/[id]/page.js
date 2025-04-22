"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function EventDetail() {
  const { user, dbUser } = useAuth();
  const router = useRouter();
  const { id: eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

        if (data.isRegistered) {
          setMessage({
            type: 'success',
            text: 'You are registered for this event!'
          });

          setTimeout(() => {
            setMessage({ type: '', text: '' });
          }, 3000);
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [user, eventId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
        text: data.message || 'Successfully cancelled event registration'
      });

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

  const eventDate = event?.date ? new Date(event.date) : new Date();
  const isValidDate = !isNaN(eventDate.getTime());
  const isPastEvent = isValidDate && eventDate < new Date();
  const isAtCapacity = event?.maxAttendees > 0 && event?.attendees?.length >= event?.maxAttendees;
  const canRegister = !isPastEvent && !isAtCapacity;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error || "Event not found"}</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/events')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-4 md:p-6">
      {message.text && (
        <div className={`${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg mb-4`}>
          {message.text}
        </div>
      )}

      <div className="rounded-lg w-full flex flex-col md:flex-row gap-4">
        <div className="rounded-2xl w-3/4 flex flex-col gap-10">
          <div className="bg-purple-50 w-full p-6 rounded-xl shadow-xl">
            <div className='flex items-center gap-2 w-full flex-wrap'>
              <h1 className="text-3xl font-bold text-purple-700">{event?.title}</h1>
              <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
                {event?.category}
              </span>
            </div>
            <p className="mt-2 text-gray-600">Organized by <span className='font-semibold'>{event?.organizer?.displayName}</span></p>
            <div className="border-t border-gray-300 my-4"></div>
            <h2 className="text-xl font-semibold mb-4">Event Details</h2>
            <div className="max-w-full">
              <p>{event?.description}</p>
            </div>
          </div>

          <div className="p-6 rounded-xl shadow-2xl">
          <div>
                <h3 className="flex items-center gap-2 text-lg font-medium mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Attendees ({event?.attendees.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                <div className=" rounded-lg  border-gray-200 p-4 w-full">
                {event.attendees.length === 0 ? (
                  <p className="text-gray-500">No one has registered for this event yet.</p>
                ) : (
                  <ul className="w-full">
                    {event.attendees.map((attendee) => (
                      <li key={attendee._id} className="py-3 flex items-center ">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                        {attendee.displayName 
                          ? attendee.displayName.charAt(0).toUpperCase() 
                          : attendee.email.charAt(0).toUpperCase()}
                      </div>
                    
                      <div className="ml-4 flex-grow">
                        <p className="text-sm font-semibold text-gray-900">
                          {attendee.displayName || attendee.email}
                        </p>
                    
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-gray-600">
                          <span>Role: {attendee.role}</span>
                          {attendee.department && <span> • Dept: {attendee.department}</span>}
                          {attendee.rollNo && <span>• Roll No: {attendee.rollNo}</span>}
                        </div>
                      </div>
                    </li>
                    
                    ))}
                  </ul>
                )}
              </div>
                </div>
              </div>
          </div>

          {event?.organizer._id === dbUser?._id && (
            <div className="p-6 pt-0">
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push(`/dashboard/events/edit/${eventId}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Event
                </button>
                <button
                  onClick={handleDeleteEvent}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Event'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-full h-fit md:w-1/4 shadow-xl p-8 rounded-lg ">
          <h3 className="text-xl font-semibold mb-6">Event Information</h3>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-medium">
                  {formatDate(event?.date)}
                </p>
                <p className="text-gray-500 text-sm">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-medium">{event?.venue || 'Online'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-medium">
                  {event?.attendees?.length} {event?.attendees?.length === 1 ? 'person' : 'people'} attending
                </p>
                {event?.maxAttendees > 0 && (
                  <p className="text-gray-500 text-sm">
                    {Math.max(0, event?.maxAttendees - (event?.attendees?.length || 0))} spots left
                  </p>
                )}
              </div>
              
            </div>
          </div>

          <div className="mt-8">
            {isRegistered && !message.text && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                You're registered for this event!
              </div>
            )}

            <button
              onClick={isRegistered ? handleCancelRegistration : handleRegister}
              disabled={isSubmitting || isPastEvent || (isAtCapacity && !isRegistered)}
              className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${isRegistered
                ? 'bg-red-600 text-white hover:bg-red-700'
                : isPastEvent
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : isAtCapacity
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : isRegistered ? (
                'Cancel Registration'
              ) : isPastEvent ? (
                'Event has ended'
              ) : isAtCapacity ? (
                'Event is full'
              ) : (
                'Register for Event'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
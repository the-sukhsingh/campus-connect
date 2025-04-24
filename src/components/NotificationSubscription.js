'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { requestNotificationPermission } from '@/config/firebase';

export default function NotificationSubscription() {
  const { user, dbUser } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState('idle'); // 'idle', 'subscribing', 'subscribed', 'error'
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is faculty or HOD
  const canSubscribe = dbUser?.role === 'faculty' || dbUser?.role === 'hod' || dbUser?.role === 'librarian' || dbUser?.role === 'student';

  // Check subscription status on component mount
  useEffect(() => {
    if (user && canSubscribe) {
      checkSubscriptionStatus();
    }
  }, [user, dbUser]);

  // Check if the user is already subscribed
  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/notifications/subscription?firebaseUid=${user.uid}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Subscription status:', data);
        setSubscribed(data.subscribed);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  // Handle subscription button click
  const handleSubscription = async () => {
    if (!user) return;
    
    try {
      setSubscriptionStatus('subscribing');
      setError(null);
      
      // Request notification permission and get FCM token
      const token = await requestNotificationPermission();
      
      if (!token) {
        throw new Error('Failed to get notification token. Please check browser permissions.');
      }
      
      // Register token with backend
      const response = await fetch('/api/notifications/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          token,
          role: dbUser.role,
          action: subscribed ? 'unsubscribe' : 'subscribe'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update subscription');
      }
      
      // Update subscription status
      setSubscribed(!subscribed);
      setSubscriptionStatus('subscribed');
      
    } catch (error) {
      console.error('Subscription error:', error);
      setError(error.message);
      setSubscriptionStatus('error');
    }
  };

  // Don't render for non-faculty/non-HOD users
  if (!canSubscribe) return null;

  return (
    <div className="group bg-gradient-to-br from-white to-amber-50 rounded-xl p-6 shadow-sm border border-amber-100 relative overflow-hidden transform hover:-translate-y-1 transition-all duration-2000 h-full max-h-80">
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500 opacity-10 rounded-full group-hover:scale-[12] transition-transform duration-600"></div>
      
      <div className="flex items-center mb-5 relative z-10">
        <div className="bg-amber-100 p-3 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-amber-900">Notifications</h3>
          <p className="text-sm text-amber-500">Stay updated with alerts</p>
        </div>
      </div>
      
      <div className="bg-white bg-opacity-60 p-4 rounded-lg mb-6 relative z-10">
        <p className="text-amber-700">
          {subscribed 
            ? "You're actively receiving notifications. You can unsubscribe anytime." 
            : "Subscribe to receive important announcements and updates."}
        </p>
      </div>
      
      <button
        onClick={handleSubscription}
        disabled={subscriptionStatus === 'subscribing'}
        className={`relative z-10 w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] ${
          subscribed 
            ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700' 
            : 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600'
        } ${subscriptionStatus === 'subscribing' ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {subscriptionStatus === 'subscribing' ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing
          </div>
        ) : (
          subscribed ? 'Unsubscribe' : 'Subscribe to Notifications'
        )}
      </button>
      
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg relative z-10">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}
      
      {subscriptionStatus === 'subscribed' && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg animate-fadeIn relative z-10">
          <p className="text-sm text-green-600 font-medium">
            {subscribed 
              ? "Successfully subscribed to notifications!" 
              : "Unsubscribed from notifications."}
          </p>
        </div>
      )}
    </div>
  );
}
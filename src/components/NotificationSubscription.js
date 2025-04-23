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
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="bg-yellow-100 p-3 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="ml-4">
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
      </div>
      <p className="text-gray-600 mb-4">
        {subscribed 
          ? "You are currently receiving notifications. You can unsubscribe at any time." 
          : "Subscribe to receive important notifications about announcements and updates."}
      </p>
      <button
        onClick={handleSubscription}
        disabled={subscriptionStatus === 'subscribing'}
        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          subscribed ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
        } ${subscriptionStatus === 'subscribing' ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {subscriptionStatus === 'subscribing' ? 'Processing...' : (subscribed ? 'Unsubscribe' : 'Subscribe to Notifications')}
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {subscriptionStatus === 'subscribed' && (
        <p className="mt-2 text-sm text-green-600">
          {subscribed 
            ? "Successfully subscribed to notifications!" 
            : "Unsubscribed from notifications."}
        </p>
      )}
    </div>
  );
}
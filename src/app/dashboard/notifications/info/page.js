'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the NotificationSubscription component (client-side only)
const NotificationSubscription = dynamic(
  () => import('@/components/NotificationSubscription'),
  { ssr: false }
);

function NotificationsInfoPage() {
  const { user, userRole } = useAuth();
  const [browserSupport, setBrowserSupport] = useState({
    notificationsSupported: false,
    serviceWorkerSupported: false,
    pushSupported: false
  });

  useEffect(() => {
    // Check browser support for notification features
    const checkBrowserSupport = () => {
      const notificationsSupported = 'Notification' in window;
      const serviceWorkerSupported = 'serviceWorker' in navigator;
      const pushSupported = 'PushManager' in window;

      setBrowserSupport({
        notificationsSupported,
        serviceWorkerSupported,
        pushSupported
      });
    };

    checkBrowserSupport();
  }, []);

  const notificationExamples = [
    {
      title: "New Announcement Notifications",
      description: "Get instantly notified when new announcements are posted for your department or college.",
      icon: "📢"
    },
    {
      title: "System Updates",
      description: "Stay informed about important system maintenance and updates.",
      icon: "🔄"
    },
    {
      title: "Schedule Changes",
      description: "Receive alerts when there are changes to class schedules or room assignments.",
      icon: "📆"
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Notification Settings</h1>
        <p className="text-gray-600">
          Manage your notification preferences and learn how to stay updated with important information.
        </p>
      </div>

      {/* Browser Compatibility Check */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Browser Compatibility Check</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center">
              <div className={`mr-3 ${browserSupport.notificationsSupported ? 'text-green-500' : 'text-red-500'}`}>
                {browserSupport.notificationsSupported ? '✓' : '✗'}
              </div>
              <div>
                <h3 className="font-medium">Notifications API</h3>
                <p className="text-sm text-gray-500">
                  {browserSupport.notificationsSupported 
                    ? 'Your browser supports notifications' 
                    : 'Your browser does not support notifications'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center">
              <div className={`mr-3 ${browserSupport.serviceWorkerSupported ? 'text-green-500' : 'text-red-500'}`}>
                {browserSupport.serviceWorkerSupported ? '✓' : '✗'}
              </div>
              <div>
                <h3 className="font-medium">Service Worker</h3>
                <p className="text-sm text-gray-500">
                  {browserSupport.serviceWorkerSupported 
                    ? 'Your browser supports service workers' 
                    : 'Your browser does not support service workers'}
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center">
              <div className={`mr-3 ${browserSupport.pushSupported ? 'text-green-500' : 'text-red-500'}`}>
                {browserSupport.pushSupported ? '✓' : '✗'}
              </div>
              <div>
                <h3 className="font-medium">Push API</h3>
                <p className="text-sm text-gray-500">
                  {browserSupport.pushSupported 
                    ? 'Your browser supports push notifications' 
                    : 'Your browser does not support push notifications'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!browserSupport.notificationsSupported || !browserSupport.serviceWorkerSupported || !browserSupport.pushSupported ? (
          <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-sm text-yellow-700">
              Your browser has limited support for push notifications. For the best experience, please use Chrome, Edge, Firefox, or Safari.
            </p>
          </div>
        ) : null}
      </div>

      {/* Notification Types */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">What You&apos;ll Receive</h2>
        <p className="text-gray-600 mb-6">
          When subscribed, you&apos;ll receive push notifications for the following types of events:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {notificationExamples.map((example, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-2">{example.icon}</div>
              <h3 className="font-medium mb-2">{example.title}</h3>
              <p className="text-sm text-gray-500">{example.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Privacy Information</h2>
        <p className="text-gray-600">
          Your notification preferences are stored securely and associated with your account. You can unsubscribe at any time by using the controls below. We respect your privacy and will only send relevant notifications based on your role.
        </p>
      </div>

      {/* Subscription Controls */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
        <NotificationSubscription />
      </div>

      {/* Back to Dashboard */}
      <div className="mt-6">
        <Link 
          href={userRole === 'hod' ? '/dashboard/hod' : '/dashboard/faculty'}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
        >
          <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing only faculty and HOD access
export default withRoleProtection(NotificationsInfoPage, ['faculty', 'hod']);
'use client'
import { useState, useEffect } from 'react';
import { onMessageListener, initializeMessaging } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

export default function NotificationDisplay() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [tempNotifications, setTempNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Check for stored notifications from background messages
    const checkForStoredNotifications = () => {
      try {
        // First try to get notifications from localStorage
        const storedNotifications = localStorage.getItem('backgroundNotifications');
        if (storedNotifications) {
          const parsedNotifications = JSON.parse(storedNotifications);
          if (Array.isArray(parsedNotifications) && parsedNotifications.length > 0) {
            // Add to context and temp display
            parsedNotifications.forEach(notification => {
              // Add to permanent storage through NotificationContext
              addNotification(notification);
              
              // Add to temporary display popup
              setTempNotifications(prev => [notification, ...prev]);
            });
            localStorage.removeItem('backgroundNotifications');
          }
        }
        
        // Then check for any notifications in IndexedDB via service worker
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'REQUEST_NOTIFICATION_SYNC'
          });
        }
      } catch (error) {
        console.error("Error processing stored notifications:", error);
      }
    };

    // Setup message listener for foreground messages
    const setupMessageListener = () => {
      onMessageListener()
        .then((payload) => {
          console.log('Received foreground message:', payload);
          if (payload?.notification) {
            const { title, body } = payload.notification;
            const id = Date.now().toString();
            
            // Create notification object
            const notification = { 
              id, 
              title, 
              body, 
              url: payload.data?.url || '/', 
              timestamp: new Date(),
              read: false
            };
            
            // Add to notification context for permanent storage
            addNotification(notification);
            
            // Add to temporary display
            setTempNotifications(prev => [notification, ...prev]);
            
            // Auto-remove temporary notification after 10 seconds
            setTimeout(() => {
              setTempNotifications(prev => prev.filter(n => n.id !== id));
            }, 10000);
          }
          
          // Re-establish the listener for next messages
          setupMessageListener();
        })
        .catch(err => {
          console.error("Error in notification listener:", err);
          // Attempt to re-establish listener on error after a delay
          setTimeout(setupMessageListener, 3000);
        });
    };

    // Initialize messaging and set up event listeners
    const initNotifications = async () => {
      try {
        await initializeMessaging();
        
        // Check for notifications that were received while the app was in the background
        checkForStoredNotifications();
        
        // Listen for foreground messages
        setupMessageListener();
        
        // Listen for the "notificationreceived" event from the service worker
        if ('serviceWorker' in navigator && 'BroadcastChannel' in window) {
          try {
            const channel = new BroadcastChannel('notifications-channel');
            channel.addEventListener('message', (event) => {
              if (event.data && event.data.type === 'NOTIFICATION_RECEIVED') {
                const notification = event.data.notification;
                
                // Add to notification context for permanent storage
                addNotification({
                  id: notification.id || Date.now().toString(),
                  title: notification.title,
                  body: notification.body,
                  url: notification.url || '/',
                  timestamp: notification.timestamp || new Date().toISOString(),
                  read: false
                });
                
                // Add to temporary display
                setTempNotifications(prev => [
                  {
                    id: notification.id || Date.now().toString(),
                    title: notification.title,
                    body: notification.body,
                    url: notification.url || '/',
                    timestamp: notification.timestamp || new Date().toISOString(),
                    read: false
                  },
                  ...prev
                ]);
                
                // Auto-remove temporary notification after 10 seconds
                setTimeout(() => {
                  setTempNotifications(prev => prev.filter(n => n.id !== notification.id));
                }, 10000);
              }
              
              // Also handle SYNC_NOTIFICATIONS events here to ensure we show temporary notifications too
              if (event.data && event.data.type === 'SYNC_NOTIFICATIONS') {
                if (event.data.notifications && Array.isArray(event.data.notifications)) {
                  // Take the 3 most recent notifications to show as temporary popups
                  const recentNotifications = event.data.notifications
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, 3);
                  
                  recentNotifications.forEach(notification => {
                    // Add to temporary display
                    setTempNotifications(prev => [
                      {
                        id: notification.id,
                        title: notification.title,
                        body: notification.body,
                        url: notification.url || '/',
                        timestamp: notification.timestamp,
                        read: false
                      },
                      ...prev
                    ]);
                    
                    // Auto-remove temporary notification after 10 seconds
                    setTimeout(() => {
                      setTempNotifications(prev => prev.filter(n => n.id !== notification.id));
                    }, 10000);
                  });
                }
              }
            });
            
            return () => {
              channel.close();
            };
          } catch (error) {
            console.error('Error setting up BroadcastChannel:', error);
          }
        }
      } catch (error) {
        console.error("Error initializing notifications:", error);
      }
    };

    initNotifications();

  }, [user, addNotification]);

  // Handle notification click
  const handleNotificationClick = (id, url) => {
    // Navigate to URL (if any)
    if (url) {
      window.location.href = url;
    }
  };

  // Dismiss notification
  const handleDismiss = (id) => {
    setTempNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!user || tempNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {tempNotifications.map(notification => (
        <div 
          key={notification.id}
          className="p-3 rounded-lg shadow-lg bg-white border-l-4 border-indigo-500 animate-slideIn"
        >
          <div className="flex justify-between items-start">
            <div 
              className="cursor-pointer flex-1"
              onClick={() => handleNotificationClick(notification.id, notification.url)}
            >
              <h4 className="font-medium text-sm">{notification.title}</h4>
              <p className="text-gray-600 text-xs mt-1">{notification.body}</p>
              <p className="text-gray-400 text-xs mt-1">
                {typeof notification.timestamp === 'string' 
                  ? new Date(notification.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : notification.timestamp?.toLocaleTimeString
                    ? notification.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })
                    : 'Just now'
                }
              </p>
            </div>
            <button 
              onClick={() => handleDismiss(notification.id)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
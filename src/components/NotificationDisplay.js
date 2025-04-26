'use client'
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';

export default function NotificationDisplay() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { theme } = useTheme();
  const [tempNotifications, setTempNotifications] = useState([]);
  const [isClient, setIsClient] = useState(false);
  // Use useRef instead of state to track IDs across renders
  const processedNotificationIds = useRef(new Set());
  // Store timestamps for each processed notification to allow reprocessing after a certain time
  const notificationTimestamps = useRef(new Map());
  
  // Safely import Firebase only on the client side
  const [firebase, setFirebase] = useState(null);

  // Ensure we're on the client before accessing browser APIs
  useEffect(() => {
    setIsClient(true);
    // Dynamically import Firebase to avoid SSR issues
    import('@/config/firebase')
      .then(module => {
        setFirebase({
          onMessageListener: module.onMessageListener,
          initializeMessaging: module.initializeMessaging
        });
      })
      .catch(err => {
        console.error("Failed to load firebase module:", err);
      });
  }, []);

  useEffect(() => {
    if (!user || !isClient || !firebase) return;

    console.log('Initializing notification display for user:', user.uid);

    // Helper function to check if a notification has been recently processed
    const isRecentlyProcessed = (id) => {
      if (!processedNotificationIds.current.has(id)) {
        return false;
      }
      
      // If the notification was processed more than 5 seconds ago, allow reprocessing
      const timestamp = notificationTimestamps.current.get(id);
      if (timestamp && Date.now() - timestamp > 5000) {
        processedNotificationIds.current.delete(id);
        notificationTimestamps.current.delete(id);
        return false;
      }
      
      return true;
    };

    // Process a notification, ensuring deduplication
    const processNotification = (notification) => {
      if (!notification || !notification.id) {
        console.warn('Invalid notification object:', notification);
        return false;
      }
      
      // Skip recently processed notifications
      if (isRecentlyProcessed(notification.id)) {
        console.log(`Skipping recently processed notification: ${notification.id}`);
        return false;
      }
      
      // Mark as processed with current timestamp
      processedNotificationIds.current.add(notification.id);
      notificationTimestamps.current.set(notification.id, Date.now());
      
      // Add to notification context for permanent storage
      addNotification(notification);
      
      // Add to temporary display
      setTempNotifications(prev => [
        {
          id: notification.id,
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
      
      return true;
    };

    // Check for stored notifications from background messages
    const checkForStoredNotifications = () => {
      try {
        if (typeof localStorage !== 'undefined') {
          // First try to get notifications from localStorage
          const storedNotifications = localStorage.getItem('backgroundNotifications');
          console.log('Checking localStorage for stored notifications:', storedNotifications);
          if (storedNotifications) {
            const parsedNotifications = JSON.parse(storedNotifications);
            if (Array.isArray(parsedNotifications) && parsedNotifications.length > 0) {
              console.log(`Found ${parsedNotifications.length} stored notifications in localStorage`);
              
              // Process stored notifications
              parsedNotifications.forEach(notification => {
                processNotification(notification);
              });
              
              localStorage.removeItem('backgroundNotifications');
            }
          }
        }
        
        // Check for service worker support
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
          console.log('Requesting notification sync from service worker');
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
      firebase.onMessageListener()
        .then((payload) => {
          console.log('Received foreground message via Firebase:', payload);
          if (payload?.notification) {
            const { title, body } = payload.notification;
            const id = payload.data?.id || Date.now().toString();
            
            // Process the notification using our deduplication helper
            processNotification({ 
              id, 
              title, 
              body, 
              url: payload.data?.url || '/', 
              timestamp: new Date().toISOString(),
              read: false
            });
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
        await firebase.initializeMessaging();
        
        // Check for notifications that were received while the app was in the background
        checkForStoredNotifications();
        
        // Listen for foreground messages
        setupMessageListener();
        
        // Listen for the "notificationreceived" event from the service worker
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'BroadcastChannel' in window) {
          try {
            console.log('Setting up BroadcastChannel for notifications');
            const channel = new BroadcastChannel('notifications-channel');
            
            channel.addEventListener('message', (event) => {
              if (!event.data) return;
              
              console.log('Received message via BroadcastChannel:', event.data.type);
              
              // Handle notification received from service worker
              if (event.data && event.data.type === 'NOTIFICATION_RECEIVED') {
                processNotification(event.data.notification);
              }
              
              // Handle synced notifications from service worker
              if (event.data && event.data.type === 'SYNC_NOTIFICATIONS') {
                if (event.data.notifications && Array.isArray(event.data.notifications)) {
                  console.log(`Received ${event.data.notifications.length} notifications from sync`);
                  
                  // Take the 3 most recent notifications to show as temporary popups
                  const recentNotifications = event.data.notifications
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, 3);
                  
                  recentNotifications.forEach(notification => {
                    processNotification(notification);
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

    // Clean up function to prevent memory leaks
    return () => {
      processedNotificationIds.current.clear();
      notificationTimestamps.current.clear();
    };

  }, [user, addNotification, isClient, firebase]);

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
          className="p-3 rounded-lg shadow-lg bg-[var(--card)] text-[var(--card-foreground)] border-l-4 border-[var(--primary)] animate-slideIn"
        >
          <div className="flex justify-between items-start">
            <div 
              className="cursor-pointer flex-1"
              onClick={() => handleNotificationClick(notification.id, notification.url)}
            >
              <h4 className="font-medium text-sm text-[var(--foreground)]">{notification.title}</h4>
              <p className="text-[var(--muted-foreground)] text-xs mt-1">{notification.body}</p>
              <p className="text-[var(--muted-foreground)] text-xs mt-1 opacity-70">
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
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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
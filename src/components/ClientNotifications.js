'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useNotifications } from '@/context/NotificationContext';

// Dynamically load the NotificationDisplay component (client-side only)
const NotificationDisplay = dynamic(
  () => import('@/components/NotificationDisplay'),
  { ssr: false }
);

export default function ClientNotifications() {
  const { addNotification } = useNotifications();

  // Listen for service worker messages and actively request notifications
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const setupNotificationSync = async () => {
        try {
          // Set up broadcast channel for receiving notifications
          if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel('notifications-channel');
            
            channel.addEventListener('message', (event) => {
              if (event.data) {
                // Handle SYNC_NOTIFICATIONS message
                if (event.data.type === 'SYNC_NOTIFICATIONS') {
                  console.log('Received synced notifications:', event.data.notifications?.length || 0);
                  
                  if (event.data.notifications && Array.isArray(event.data.notifications)) {
                    event.data.notifications.forEach(notification => {
                      addNotification(notification);
                    });
                    
                    // Clear the notifications from service worker storage
                    if (navigator.serviceWorker.controller) {
                      navigator.serviceWorker.controller.postMessage({
                        type: 'CLEAR_NOTIFICATIONS'
                      });
                    }
                  }
                }
                
                // Handle NOTIFICATION_RECEIVED message (for foreground notifications)
                if (event.data.type === 'NOTIFICATION_RECEIVED' && event.data.notification) {
                  console.log('Received foreground notification:', event.data.notification);
                  addNotification(event.data.notification);
                }
              }
            });
            
            return () => {
              channel.close();
            };
          }
        } catch (error) {
          console.error('Error setting up notification channel:', error);
        }
      };
      
      // Set up notification channel
      setupNotificationSync();
      
      // Actively request stored notifications from service worker on mount
      const requestStoredNotifications = () => {
        if (navigator.serviceWorker.controller) {
          console.log('Requesting notification sync from service worker');
          navigator.serviceWorker.controller.postMessage({
            type: 'REQUEST_NOTIFICATION_SYNC'
          });
        } else {
          console.log('Service worker not ready, waiting...');
          // If service worker is not yet ready, wait a bit and try again
          setTimeout(requestStoredNotifications, 1000);
        }
      };
      
      // Wait for a second to ensure service worker is registered
      setTimeout(requestStoredNotifications, 1000);
      
      // Set up background sync if available
      if ('SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
          registration.sync.register('sync-notifications').catch(error => {
            console.error('Error registering background sync:', error);
          });
        });
      }
    } else {
      console.error('Service workers are not supported in this browser.');
    }
  }, [addNotification]);

  // Component renders the notification display
  return <NotificationDisplay />;
}
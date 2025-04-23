'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Define the context type
const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  removeNotification: () => {},
  clearAllNotifications: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
});

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate unread count whenever notifications change
  useEffect(() => {
    if (notifications.length > 0) {
      const count = notifications.filter(notification => !notification.read).length;
      setUnreadCount(count);
    } else {
      setUnreadCount(0);
    }
  }, [notifications]);

  // Load notifications from localStorage on component mount
  useEffect(() => {
    if (user) {
      try {
        const savedNotifications = localStorage.getItem(`notifications_${user.uid}`);
        if (savedNotifications) {
          const parsedNotifications = JSON.parse(savedNotifications);
          setNotifications(parsedNotifications);
        }
      } catch (error) {
        console.error('Error loading notifications from localStorage:', error);
      }
    }
  }, [user]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (user && notifications.length > 0) {
      try {
        localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(notifications));
      } catch (error) {
        console.error('Error saving notifications to localStorage:', error);
      }
    }
  }, [user, notifications]);

  const addNotification = (notification) => {
    // Ensure notification has required fields
    const completeNotification = {
      id: notification.id || Date.now().toString(),
      title: notification.title || 'New Notification',
      body: notification.body || '',
      timestamp: notification.timestamp || new Date(),
      read: false,
      url: notification.url || '/',
      ...notification,
    };

    setNotifications(prevNotifications => {
      // Check if notification with same ID already exists
      const exists = prevNotifications.some(notif => notif.id === completeNotification.id);
      if (!exists) {
        return [completeNotification, ...prevNotifications];
      }
      return prevNotifications;
    });
  };

  const removeNotification = (id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    if (user) {
      localStorage.removeItem(`notifications_${user.uid}`);
    }
  };

  const markAsRead = (id) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    clearAllNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
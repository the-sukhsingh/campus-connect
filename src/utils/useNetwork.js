'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to track online/offline status
 * @returns {Object} An object with isOnline status and connection information
 */
const useNetwork = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [connectionInfo, setConnectionInfo] = useState({
    downlink: null,
    effectiveType: null,
    rtt: null,
    saveData: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Update network status when online/offline events occur
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger app-wide event for reconnection
      window.dispatchEvent(new CustomEvent('app:online'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Trigger app-wide event for offline mode
      window.dispatchEvent(new CustomEvent('app:offline'));
    };

    // Update connection info if Network Information API is available
    const updateConnectionInfo = () => {
      if (navigator.connection) {
        setConnectionInfo({
          downlink: navigator.connection.downlink,
          effectiveType: navigator.connection.effectiveType,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData,
        });
      }
    };

    // Set initial status
    setIsOnline(navigator.onLine);
    updateConnectionInfo();

    // Register listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection changes if Network Information API is available
    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateConnectionInfo);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  return {
    isOnline,
    connectionInfo,
  };
};

export default useNetwork;
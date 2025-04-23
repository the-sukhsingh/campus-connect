'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to track online/offline status and provide network-aware data fetching
 * 
 * @returns {Object} Network status and helper methods
 */
export default function useNetwork() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  const [isReconnected, setIsReconnected] = useState(false);
  
  // Track network status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnected(true);
      // Reset the reconnected flag after a short delay
      setTimeout(() => setIsReconnected(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  /**
   * Fetch data with network awareness - gets fresh data when online,
   * falls back to cached data when offline
   * 
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  const fetchData = async (url, options = {}) => {
    try {
      // If we're online, add cache-busting query parameter
      if (isOnline) {
        const separator = url.includes('?') ? '&' : '?';
        const bustUrl = `${url}${separator}_=${Date.now()}`;
        console.log(`[Network] Fetching fresh data from: ${bustUrl}`);
        // Add cache control headers
        const fetchOptions = {
          ...options,
          headers: {
            ...options.headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        };
        
        return fetch(bustUrl, fetchOptions);
      }
      console.log(`[Network] Fetching cached data from: ${url}`);
      // If offline, use standard fetch which will use cache from service worker
      return fetch(url, options);
    } catch (error) {
      console.error('Network fetch error:', error);
      throw error;
    }
  };
  
  /**
   * Force invalidate cache for specific URLs
   * 
   * @param {Array<string>} urls - URLs to invalidate in cache
   */
  const invalidateUrls = (urls = []) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'INVALIDATE_CACHE',
        urls: urls.map(url => {
          if (url.startsWith('/')) {
            return `${window.location.origin}${url}`;
          }
          return url;
        })
      });
    }
  };
  
  return {
    isOnline,
    isReconnected,
    fetchData,
    invalidateUrls
  };
}
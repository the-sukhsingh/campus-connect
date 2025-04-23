/**
 * Cache utilities for dealing with service worker caching
 */

/**
 * Invalidate specific URLs in the service worker cache
 * @param {string[]} urls - Array of URLs to invalidate in the cache
 */
export function invalidateCache(urls = []) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'INVALIDATE_CACHE',
      urls: urls.map(url => {
        // Ensure we have absolute URLs
        if (url.startsWith('/')) {
          return `${window.location.origin}${url}`;
        }
        return url;
      })
    });
  }
}

/**
 * Invalidate cache entries matching a regex pattern
 * @param {string} pattern - Regex pattern to match URLs against
 */
export function invalidateCacheByPattern(pattern) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'INVALIDATE_CACHE',
      pattern
    });
  }
}

/**
 * Force a fresh fetch for the given URL by adding a timestamp query parameter
 * @param {string} url - The URL to fetch with cache busting
 * @returns {string} - URL with cache-busting parameter added
 */
export function getUrlWithCacheBust(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cacheBust=${Date.now()}`;
}

/**
 * Perform a fetch that bypasses the cache
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export async function fetchWithNoCache(url, options = {}) {
  // Ensure we have the cache-control headers set
  const fetchOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  };
  
  return fetch(getUrlWithCacheBust(url), fetchOptions);
}

/**
 * Check if the device currently has network connectivity
 * @returns {boolean} - True if online, false if offline
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Add online/offline event listeners
 * @param {Function} onOnline - Callback when device goes online
 * @param {Function} onOffline - Callback when device goes offline
 * @returns {Function} - Function to remove the event listeners
 */
export function addNetworkStatusListeners(onOnline, onOffline) {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }
  return () => {};
}

/**
 * A hook to use the network status in React components
 * @deprecated Use the dedicated useNetwork hook from useNetwork.js instead
 * @returns {boolean} - True if online, false if offline
 */
export function useNetworkStatus() {
  // Importing React directly into this file would be the proper way to fix this,
  // but we already have a dedicated useNetwork hook in the project
  console.warn('useNetworkStatus is deprecated, use the useNetwork hook from utils/useNetwork.js instead');
  return isOnline();
}

/**
 * Request a network-first fetch directly from the service worker
 * Useful for explicit refresh actions
 * @param {string[]} urls - Optional specific URLs to force refresh
 */
export function forceNetworkFetch(urls = []) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // First, invalidate these URLs in the cache
    invalidateCache(urls);
    
    // Then tell the service worker to fetch them fresh
    navigator.serviceWorker.controller.postMessage({
      type: 'FORCE_NETWORK_FETCH',
      urls: urls.map(url => {
        if (url.startsWith('/')) {
          return `${window.location.origin}${url}`;
        }
        return url;
      })
    });
    
    // For the current page, we can also use the skipWaiting approach
    if (urls.length === 0) {
      // If no specific URLs, refresh all API data
      navigator.serviceWorker.controller.postMessage({
        type: 'SKIP_WAITING_ON_API_ROUTES'
      });
    }
  }
}
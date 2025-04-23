'use client';

/**
 * A global fetch wrapper that ensures fresh data by default
 * This intercepts all fetch calls to prevent caching issues
 */

// Store the original fetch function
const originalFetch = global.fetch;

/**
 * Determines if a URL is an API or data URL that should use cache busting
 * @param {string} url - The URL to check
 * @returns {boolean} - True if the URL should use cache busting
 */
function shouldApplyCacheBusting(url) {
  // Skip cache busting for static assets
  if (String(url).match(/\.(css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    return false;
  }
  
  // Convert the URL to a string if it's not already
  const urlStr = String(url);
  
  // Skip cache busting for Next.js router requests
  if (urlStr.includes('/_next/')) {
    return false;
  }
  
  // Apply cache busting to API routes to ensure fresh data
  if (urlStr.includes('/api/')) {
    // Add specific API routes that should NOT use cache busting
    const excludedRoutes = [
      '/api/auth/',
      '/api/user/firebase/',
      '/api/firebase-config/'
    ];
    
    // Skip if URL matches any excluded route
    if (excludedRoutes.some(route => urlStr.includes(route))) {
      return false;
    }
    console.log(`[Fetch Wrapper] Cache busting applied to: ${urlStr}`);
    return true;
  }
  
  // Don't apply cache busting to navigation or page requests
  return false; // By default, don't apply cache busting
}

/**
 * Adds a cache busting parameter to a URL
 * @param {string} url - The URL to add the parameter to
 * @returns {string} - The URL with the cache busting parameter
 */
function addCacheBustingParam(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_=${Date.now()}`;
}

/**
 * Initialize the fetch wrapper by overriding the global fetch
 */
export function initFetchWrapper() {
  if (typeof window !== 'undefined') {
    // Only run in browser environment
    global.fetch = (url, options = {}) => {
      // Only modify GET requests
      if (!options.method || options.method === 'GET') {
        // Don't cache bust if explicitly told not to or if it's not an API/data URL
        if (options.noCacheBust !== true && shouldApplyCacheBusting(url)) {
          // Add cache busting parameter to URL
          url = addCacheBustingParam(url);
          
          // Add cache control headers
          options = {
            ...options,
            headers: {
              ...options.headers,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            }
          };
        }
      }
      
      // Call the original fetch with the modified URL and options
      return originalFetch(url, options);
    };
    
    console.log('[Fetch Wrapper] Initialized - Selective cache busting enabled');
  }
}

/**
 * Reset the fetch function to its original state
 */
export function resetFetchWrapper() {
  if (typeof window !== 'undefined') {
    global.fetch = originalFetch;
  }
}
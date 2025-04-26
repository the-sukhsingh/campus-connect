'use client';

/**
 * Utility for managing offline data and background synchronization
 * Stores data in IndexedDB when offline and syncs it when online
 */

const DB_NAME = 'offlineSync';
const DB_VERSION = 1;
const SYNC_QUEUE_STORE = 'syncQueue';

// Check if running in browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Open the sync database
 * @returns {Promise<IDBDatabase>} The database instance
 */
const openSyncDB = () => {
  if (!isBrowser) {
    return Promise.reject(new Error('IndexedDB not available - not in browser context'));
  }

  // Safety check for IndexedDB
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB not supported in this browser'));
  }

  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          db.createObjectStore(SYNC_QUEUE_STORE, { 
            keyPath: 'id',
            autoIncrement: true 
          });
        }
      };
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        console.error('Error opening sync database:', event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Safe wrapper to check if we're in a browser with IndexedDB support
 * @returns {boolean}
 */
const canUseIndexedDB = () => {
  return isBrowser && typeof indexedDB !== 'undefined';
};

/**
 * Add an operation to the sync queue to be processed when online
 * 
 * @param {string} url - The API endpoint URL
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} data - The data to send
 * @param {string} entityType - Type of entity being modified (e.g., 'note', 'feedback')
 * @returns {Promise<number>} The ID of the queued operation
 */
export const queueSyncOperation = async (url, method, data, entityType) => {
  if (!canUseIndexedDB()) {
    console.warn('[OfflineSync] Cannot queue sync operation - IndexedDB not available');
    return -1;
  }
  
  try {
    const db = await openSyncDB();
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_STORE);
    
    const queueItem = {
      url,
      method,
      data,
      entityType,
      timestamp: new Date().toISOString(),
      attempts: 0,
      status: 'pending'
    };
    
    const request = store.add(queueItem);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        resolve(event.target.result);
        console.log(`[OfflineSync] Operation queued: ${method} ${url}`);
        
        // Register for sync if supported
        if (isBrowser && 'serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-operations');
          }).catch(err => {
            console.error('[OfflineSync] Failed to register sync:', err);
          });
        }
      };
      
      request.onerror = (event) => {
        console.error('Error queueing sync operation:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('[OfflineSync] Failed to queue sync operation:', error);
    return -1;
  }
};

/**
 * Process all pending sync operations
 * @returns {Promise<Array>} Results of the sync operations
 */
export const processSyncQueue = async () => {
  if (!canUseIndexedDB()) {
    console.warn('[OfflineSync] Cannot process sync queue - IndexedDB not available');
    return [];
  }
  
  try {
    const db = await openSyncDB();
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_STORE);
    
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = async (event) => {
        const operations = event.target.result;
        const results = [];
        
        for (const op of operations) {
          if (op.status !== 'pending') continue;
          
          try {
            const response = await fetch(op.url, {
              method: op.method,
              headers: {
                'Content-Type': 'application/json',
              },
              body: op.method !== 'GET' ? JSON.stringify(op.data) : undefined
            });
            
            if (!response.ok) {
              throw new Error(`Server responded with ${response.status}`);
            }
            
            // Update operation status
            op.status = 'completed';
            op.completedAt = new Date().toISOString();
            await updateSyncOperation(op);
            
            results.push({
              id: op.id,
              success: true,
              data: await response.json()
            });
            
            console.log(`[OfflineSync] Operation completed: ${op.method} ${op.url}`);
          } catch (error) {
            // Update attempt count
            op.attempts += 1;
            op.status = op.attempts >= 3 ? 'failed' : 'pending';
            op.lastError = error.message;
            await updateSyncOperation(op);
            
            results.push({
              id: op.id,
              success: false,
              error: error.message
            });
            
            console.error(`[OfflineSync] Operation failed: ${op.method} ${op.url}`, error);
          }
        }
        
        resolve(results);
      };
      
      request.onerror = (event) => {
        console.error('Error getting sync queue:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('[OfflineSync] Failed to process sync queue:', error);
    return [];
  }
};

/**
 * Update a sync operation in the queue
 * @param {Object} operation - The operation to update
 * @returns {Promise<void>}
 */
const updateSyncOperation = async (operation) => {
  if (!canUseIndexedDB()) {
    return Promise.reject(new Error('IndexedDB not available'));
  }
  
  try {
    const db = await openSyncDB();
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.put(operation);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Error updating sync operation:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('[OfflineSync] Error updating sync operation:', error);
    return Promise.reject(error);
  }
};

/**
 * Clean up completed sync operations
 * @returns {Promise<number>} Number of operations cleaned
 */
export const cleanupSyncQueue = async () => {
  if (!canUseIndexedDB()) {
    console.warn('[OfflineSync] Cannot clean up sync queue - IndexedDB not available');
    return 0;
  }
  
  try {
    const db = await openSyncDB();
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_STORE);
    
    const request = store.openCursor();
    let count = 0;
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const op = cursor.value;
          if (op.status === 'completed') {
            store.delete(cursor.primaryKey);
            count++;
          }
          cursor.continue();
        } else {
          console.log(`[OfflineSync] Cleaned up ${count} completed operations`);
          resolve(count);
        }
      };
      
      request.onerror = (event) => {
        console.error('Error cleaning up sync queue:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('[OfflineSync] Failed to clean up sync queue:', error);
    return 0;
  }
};

/**
 * Get pending operations count
 * @returns {Promise<number>} Count of pending operations
 */
export const getPendingOperationsCount = async () => {
  if (!canUseIndexedDB()) {
    return 0;
  }
  
  try {
    const db = await openSyncDB();
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readonly');
    const store = tx.objectStore(SYNC_QUEUE_STORE);
    
    return new Promise((resolve, reject) => {
      const countRequest = store.count();
      
      countRequest.onsuccess = () => {
        resolve(countRequest.result);
      };
      
      countRequest.onerror = (event) => {
        console.error('Error counting pending operations:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('[OfflineSync] Failed to count pending operations:', error);
    return 0;
  }
};

/**
 * Initialize background sync when online
 */
export const initBackgroundSync = () => {
  if (!isBrowser) {
    return () => {}; // Return no-op cleanup function for SSR
  }

  let syncInProgress = false;

  const handleOnline = async () => {
    if (syncInProgress || !canUseIndexedDB()) return;
    
    console.log('[OfflineSync] Online detected, processing sync queue');
    syncInProgress = true;
    
    try {
      await processSyncQueue();
      await cleanupSyncQueue();
    } catch (error) {
      console.error('[OfflineSync] Error during background sync:', error);
    } finally {
      syncInProgress = false;
    }
  };

  window.addEventListener('online', handleOnline);

  // Also sync if service worker sends a message
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_OPERATIONS') {
        handleOnline();
      }
    });
  }
  
  // Initial sync if we're online
  if (navigator.onLine) {
    setTimeout(handleOnline, 2000);
  }
  
  return () => {
    window.removeEventListener('online', handleOnline);
  };
};

/**
 * Network-aware fetch function with offline support
 * Falls back to indexed data when offline
 * 
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} The response data
 */
export const fetchWithOfflineSupport = async (url, options = {}) => {
  if (!isBrowser) {
    // In server context, just do a regular fetch
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    return response.json();
  }

  const isOnline = navigator.onLine;
  
  if (isOnline) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store in offline cache if it's a GET request and IndexedDB is available
      if ((options.method === 'GET' || !options.method) && canUseIndexedDB()) {
        try {
          await storeOfflineData(url, data);
        } catch (cacheError) {
          console.error('[OfflineSync] Error storing offline data:', cacheError);
        }
      }
      
      return data;
    } catch (error) {
      // Try to get from offline cache if IndexedDB is available
      if (canUseIndexedDB()) {
        try {
          const offlineData = await getOfflineData(url);
          if (offlineData) {
            console.log(`[OfflineSync] Using cached data for ${url}`);
            return { ...offlineData, fromCache: true };
          }
        } catch (cacheError) {
          console.error('[OfflineSync] Error getting offline data:', cacheError);
        }
      }
      
      throw error;
    }
  } else {
    // Offline: Try to get from cache if IndexedDB is available
    if (canUseIndexedDB()) {
      const offlineData = await getOfflineData(url);
      
      if (offlineData) {
        console.log(`[OfflineSync] Using cached data for ${url} (offline)`);
        return { ...offlineData, fromCache: true };
      }
      
      // If it's not a GET request, queue it for later
      if (options.method && options.method !== 'GET') {
        const urlParts = url.split('/');
        const entityType = urlParts[urlParts.length - 2] || 'unknown';
        
        const operationId = await queueSyncOperation(
          url,
          options.method,
          options.body ? JSON.parse(options.body) : undefined,
          entityType
        );
        
        return { 
          success: true, 
          queued: true, 
          operationId,
          message: 'Your changes have been saved and will be synchronized when you are back online.' 
        };
      }
    }
    
    throw new Error('No cached data available and you are offline');
  }
};

/**
 * Store data for offline use
 * @param {string} key - The cache key (usually the URL)
 * @param {any} data - The data to store
 * @returns {Promise<void>}
 */
export const storeOfflineData = async (key, data) => {
  if (!canUseIndexedDB()) {
    return Promise.reject(new Error('IndexedDB not available'));
  }
  
  try {
    const db = await openSyncDB();
    
    // Check if offlineData store exists
    if (!db.objectStoreNames.contains('offlineData')) {
      // Close current connection to allow upgrade
      db.close();
      
      // Reopen with version upgrade to create the store
      const upgradedDb = await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION + 1);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('offlineData')) {
            db.createObjectStore('offlineData', { keyPath: 'key' });
          }
        };
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        request.onerror = (event) => {
          reject(event.target.error);
        };
      });
      
      // Now use the upgraded DB
      const tx = upgradedDb.transaction('offlineData', 'readwrite');
      const store = tx.objectStore('offlineData');
      
      return new Promise((resolve, reject) => {
        const request = store.put({
          key,
          data,
          timestamp: new Date().toISOString()
        });
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = (event) => {
          reject(event.target.error);
        };
      });
    } else {
      // Store exists, proceed normally
      const tx = db.transaction('offlineData', 'readwrite');
      const store = tx.objectStore('offlineData');
      
      return new Promise((resolve, reject) => {
        const request = store.put({
          key,
          data,
          timestamp: new Date().toISOString()
        });
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = (event) => {
          reject(event.target.error);
        };
      });
    }
  } catch (error) {
    console.error('[OfflineSync] Error storing offline data:', error);
    return Promise.reject(error);
  }
};

/**
 * Get data from offline store
 * @param {string} key - The cache key (usually the URL)
 * @returns {Promise<any>} The cached data
 */
export const getOfflineData = async (key) => {
  if (!canUseIndexedDB()) {
    return null;
  }
  
  try {
    const db = await openSyncDB();
    
    if (!db.objectStoreNames.contains('offlineData')) {
      return null;
    }
    
    const tx = db.transaction('offlineData', 'readonly');
    const store = tx.objectStore('offlineData');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = (event) => {
        resolve(event.target.result?.data || null);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('[OfflineSync] Error getting offline data:', error);
    return null;
  }
};
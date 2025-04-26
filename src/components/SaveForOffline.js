'use client';

import React, { useState, useEffect } from 'react';
import { Button, Tooltip, notification } from 'antd';
import { DownloadOutlined, CheckOutlined, LoadingOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import useNetwork from '@/utils/useNetwork';

/**
 * SaveForOffline component allows users to save content for offline access
 * @param {Object} props
 * @param {string} props.id - Unique ID of the content to save
 * @param {string} props.type - Type of content (note, book, etc.)
 * @param {Object} props.data - The content data to save
 * @param {string} props.url - URL to fetch updated content if needed
 * @param {Function} props.onSuccess - Callback when save is successful
 * @param {Function} props.onError - Callback when save fails
 */
const SaveForOffline = ({ id, type, data, url, onSuccess, onError }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isOnline } = useNetwork();

  useEffect(() => {
    // Check if this content is already saved for offline use
    checkIfSaved();
  }, [id, type]);

  const checkIfSaved = async () => {
    if (typeof window === 'undefined') return;

    try {
      // Open IndexedDB to check if this content exists
      const db = await openOfflineDB();
      const tx = db.transaction(getStoreNameByType(type), 'readonly');
      const store = tx.objectStore(getStoreNameByType(type));
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        setIsSaved(!!request.result);
      };
      
      request.onerror = (error) => {
        console.error('Error checking if content is saved:', error);
        setIsSaved(false);
      };
    } catch (error) {
      console.error('Failed to check offline status:', error);
    }
  };

  const getStoreNameByType = (type) => {
    const storeMap = {
      'note': 'offlineNotes',
      'book': 'offlineBooks',
      'document': 'offlineDocuments'
    };
    
    return storeMap[type] || 'offlineContent';
  };

  const openOfflineDB = () => {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open('offlineContent', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores for different content types if they don't exist
        if (!db.objectStoreNames.contains('offlineNotes')) {
          db.createObjectStore('offlineNotes', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('offlineBooks')) {
          db.createObjectStore('offlineBooks', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('offlineDocuments')) {
          db.createObjectStore('offlineDocuments', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('offlineContent')) {
          db.createObjectStore('offlineContent', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };

  const saveForOffline = async () => {
    if (!id || !data) {
      notification.error({
        message: 'Error',
        description: 'Missing content data to save offline',
      });
      if (onError) onError('Missing content data');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Fetch the latest version if we're online and a URL is provided
      let contentToSave = data;
      
      if (isOnline && url) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            contentToSave = await response.json();
          }
        } catch (error) {
          console.warn('Could not fetch latest version, saving current version instead:', error);
        }
      }
      
      // Add timestamp for when the content was saved
      contentToSave = {
        ...contentToSave,
        savedAt: new Date().toISOString(),
        offlineId: id,
        offlineType: type
      };
      
      // Save to IndexedDB
      const db = await openOfflineDB();
      const tx = db.transaction(getStoreNameByType(type), 'readwrite');
      const store = tx.objectStore(getStoreNameByType(type));
      
      const request = store.put(contentToSave);
      
      request.onsuccess = () => {
        setIsSaved(true);
        setIsProcessing(false);
        notification.success({
          message: 'Saved for offline',
          description: `This ${type} is now available offline`,
        });
        if (onSuccess) onSuccess();
      };
      
      request.onerror = (error) => {
        console.error('Error saving content offline:', error);
        setIsProcessing(false);
        notification.error({
          message: 'Save failed',
          description: 'Could not save content for offline use',
        });
        if (onError) onError(error);
      };
    } catch (error) {
      console.error('Failed to save for offline:', error);
      setIsProcessing(false);
      notification.error({
        message: 'Error',
        description: 'Failed to save content offline',
      });
      if (onError) onError(error);
    }
  };

  const removeFromOffline = async () => {
    setIsProcessing(true);
    
    try {
      const db = await openOfflineDB();
      const tx = db.transaction(getStoreNameByType(type), 'readwrite');
      const store = tx.objectStore(getStoreNameByType(type));
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        setIsSaved(false);
        setIsProcessing(false);
        notification.info({
          message: 'Removed from offline',
          description: `This ${type} is no longer available offline`,
        });
      };
      
      request.onerror = (error) => {
        console.error('Error removing content from offline:', error);
        setIsProcessing(false);
        notification.error({
          message: 'Error',
          description: 'Could not remove content from offline storage',
        });
      };
    } catch (error) {
      console.error('Failed to remove from offline:', error);
      setIsProcessing(false);
    }
  };

  return (
    <Tooltip title={isSaved ? "Remove from offline access" : "Save for offline access"}>
      <Button
        type={isSaved ? "default" : "primary"}
        icon={
          isProcessing ? <LoadingOutlined /> : 
          isSaved ? <CheckOutlined /> : 
          <CloudDownloadOutlined />
        }
        onClick={isSaved ? removeFromOffline : saveForOffline}
        disabled={isProcessing}
        size="middle"
      >
        {isSaved ? "Saved Offline" : "Save Offline"}
      </Button>
    </Tooltip>
  );
};

export default SaveForOffline;
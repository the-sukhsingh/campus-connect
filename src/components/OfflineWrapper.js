'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button } from 'antd';
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import useNetwork from '@/utils/useNetwork';

/**
 * OfflineWrapper component provides offline status notifications and redirects
 * when necessary. It wraps the entire app to provide offline functionality.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 */
const OfflineWrapper = ({ children }) => {
  const { isOnline } = useNetwork();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showReturnMessage, setShowReturnMessage] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Protected paths that require online connectivity
  const protectedPaths = [
    '/dashboard/admin',
    '/dashboard/settings',
    '/auth/reset-password',
    // Add other paths that absolutely require connectivity
  ];

  // Paths that have offline functionality
  const offlineEnabledPaths = [
    '/dashboard/notes',
    '/dashboard/books',
    '/offline',
  ];

  useEffect(() => {
    // Check if current path requires online connectivity
    const isProtectedPath = protectedPaths.some(path => pathname?.startsWith(path));
    
    // Handle offline detection
    if (!isOnline) {
      // Show notification when going offline
      setShowOfflineMessage(true);
      
      // Redirect from protected paths to offline page
      if (isProtectedPath) {
        router.push('/offline');
      }
      
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else if (!showReturnMessage && localStorage.getItem('was_offline') === 'true') {
      // Show "back online" notification when returning online
      setShowReturnMessage(true);
      localStorage.removeItem('was_offline');
      
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setShowReturnMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, pathname, router]);

  // When going offline, set localStorage flag to show return message later
  useEffect(() => {
    if (!isOnline) {
      localStorage.setItem('was_offline', 'true');
    }
  }, [isOnline]);

  return (
    <>
      {showOfflineMessage && (
        <Alert
          message="You are offline"
          description={
            <div>
              <p>You&apos;re currently offline. Some features may be limited.</p>
              <Button 
                type="primary" 
                onClick={() => router.push('/offline')}
                icon={<DisconnectOutlined />}
              >
                Go to Offline Mode
              </Button>
            </div>
          }
          type="warning"
          showIcon
          closable
          style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px', 
            zIndex: 1000,
            maxWidth: '400px' 
          }}
          onClose={() => setShowOfflineMessage(false)}
        />
      )}

      {showReturnMessage && (
        <Alert
          message="Back Online"
          description="Your connection has been restored. All features are now available."
          type="success"
          showIcon
          closable
          style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px', 
            zIndex: 1000,
            maxWidth: '400px' 
          }}
          onClose={() => setShowReturnMessage(false)}
          action={
            <Button 
              type="primary"
              onClick={() => {
                setShowReturnMessage(false);
                router.refresh();
              }}
              icon={<WifiOutlined />}
            >
              Refresh Page
            </Button>
          }
        />
      )}

      {children}
    </>
  );
};

export default OfflineWrapper;
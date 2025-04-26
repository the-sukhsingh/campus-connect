'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import useNetwork from '@/utils/useNetwork';

export default function OfflinePage() {
  const { theme } = useTheme();
  const { isOnline } = useNetwork();
  const [hasOfflineContent, setHasOfflineContent] = useState(false);
  const [notesCount, setNotesCount] = useState(0);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [showOfflineNotes, setShowOfflineNotes] = useState(false);

  // Check for offline content
  useEffect(() => {
    async function checkOfflineContent() {
      try {
        // Check if IndexedDB is available
        if (typeof indexedDB === 'undefined') {
          setHasOfflineContent(false);
          return;
        }

        // Check for offline notes
        const notesDb = await openDatabase('offlineNotes', 1, (db) => {
          if (!db.objectStoreNames.contains('notes')) {
            db.createObjectStore('notes', { keyPath: 'id' });
          }
        });

        const tx = notesDb.transaction('notes', 'readonly');
        const store = tx.objectStore('notes');
        const countRequest = store.count();

        countRequest.onsuccess = () => {
          const count = countRequest.result || 0;
          setNotesCount(count);
          setHasOfflineContent(count > 0);
        };

        countRequest.onerror = () => {
          setHasOfflineContent(false);
        };
        
        // Check for pending operations
        try {
          const syncDb = await openDatabase('offlineSync', 1, (db) => {
            if (!db.objectStoreNames.contains('syncQueue')) {
              db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
            }
          });
          
          const syncTx = syncDb.transaction('syncQueue', 'readonly');
          const syncStore = syncTx.objectStore('syncQueue');
          const syncCountRequest = syncStore.count();
          
          syncCountRequest.onsuccess = () => {
            setPendingOperations(syncCountRequest.result || 0);
          };
        } catch (error) {
          console.error('Error checking pending operations:', error);
        }
      } catch (error) {
        console.error('Error checking offline content:', error);
        setHasOfflineContent(false);
      }
    }

    checkOfflineContent();
  }, []);

  // Helper function to open IndexedDB
  const openDatabase = (name, version, upgradeCallback) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);
      
      request.onupgradeneeded = (event) => {
        upgradeCallback(event.target.result);
      };
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };
  
  // Toggle showing offline notes
  const toggleOfflineNotes = () => {
    setShowOfflineNotes(!showOfflineNotes);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl w-full">
        <div className="bg-[var(--card)] text-[var(--card-foreground)] p-8 rounded-lg shadow-md w-full mb-6">
          <div className="flex items-center mb-8">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-[var(--muted-foreground)] mr-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" 
              />
            </svg>
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">You are offline</h1>
              <p className="text-[var(--muted-foreground)]">
                Limited functionality is available while you&apos;re disconnected
              </p>
            </div>
          </div>
          
          {isOnline ? (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="font-medium">Your connection has been restored!</span>
              </div>
              <p className="mb-3">All your offline changes will now be synchronized with the server.</p>
              <Link href="/" className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-md transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Return to Home
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                  <span className="font-medium">No internet connection detected</span>
                </div>
                <p className="mt-1 text-sm">
                  Please check your internet connection and try again. Some features will be limited while offline.
                </p>
                {pendingOperations > 0 && (
                  <p className="mt-2 text-sm font-medium">
                    You have {pendingOperations} pending {pendingOperations === 1 ? 'operation' : 'operations'} that will sync when you reconnect.
                  </p>
                )}
              </div>

              <div className="mb-6 border-b border-[var(--border)] pb-6">
                <h2 className="text-xl font-medium mb-4 text-[var(--foreground)]">Available offline content:</h2>
                
                {hasOfflineContent ? (
                  <div className="mb-4">
                    {notesCount > 0 && (
                      <button 
                        onClick={toggleOfflineNotes}
                        className="flex items-center justify-between p-4 w-full rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
                      >
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="text-left">
                            <div className="font-medium">Offline Notes</div>
                            <div className="text-sm opacity-75">{notesCount} note{notesCount !== 1 ? 's' : ''} available</div>
                          </div>
                        </div>
                        <svg 
                          className={`w-5 h-5 transition-transform duration-300 ${showOfflineNotes ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center border border-dashed border-[var(--border)] rounded-lg">
                    <svg className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M12 4v16" />
                    </svg>
                    <p className="text-[var(--muted-foreground)] italic">
                      No content has been saved for offline use yet. 
                      When online, you can save notes for offline access by clicking the &quot;Save for offline&quot; button 
                      when viewing a note.
                    </p>
                  </div>
                )}
                
              </div>
            </>
          )}

          <div className="text-[var(--muted-foreground)]">
            <h3 className="font-medium mb-3 text-[var(--foreground)]">Using the app offline</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <details className="text-left">
                <summary className="cursor-pointer font-medium mb-2 text-[var(--foreground)] hover:text-[var(--primary)]">
                  What can I do offline?
                </summary>
                <ul className="pl-5 list-disc space-y-2 text-[var(--muted-foreground)] text-sm">
                  <li>View notes you&apos;ve previously saved for offline use</li>
                  <li>Create new notes (they will be uploaded when you&apos;re back online)</li>
                  <li>Edit existing notes (changes sync when you reconnect)</li>
                  <li>Access your offline profile information</li>
                </ul>
              </details>
              
              <details className="text-left">
                <summary className="cursor-pointer font-medium mb-2 text-[var(--foreground)] hover:text-[var(--primary)]">
                  How to save content for offline use
                </summary>
                <ol className="pl-5 list-decimal space-y-2 text-[var(--muted-foreground)] text-sm">
                  <li>When online, navigate to a note you want to access offline</li>
                  <li>Click the &quot;Save for offline&quot; button in the top right</li>
                  <li>The note will be stored on your device for offline access</li>
                  <li>You can manage saved notes in your offline notes section</li>
                </ol>
              </details>
              
              <details className="text-left">
                <summary className="cursor-pointer font-medium mb-2 text-[var(--foreground)] hover:text-[var(--primary)]">
                  Offline data synchronization
                </summary>
                <div className="text-sm text-[var(--muted-foreground)]">
                  <p className="mb-2">All changes made while offline (such as creating or editing notes) will automatically 
                  sync when your internet connection is restored.</p>
                  <p>The app will notify you when synchronization is complete.</p>
                </div>
              </details>
              
              <details className="text-left">
                <summary className="cursor-pointer font-medium mb-2 text-[var(--foreground)] hover:text-[var(--primary)]">
                  Troubleshooting
                </summary>
                <ul className="pl-5 list-disc space-y-2 text-[var(--muted-foreground)] text-sm">
                  <li>If content is not loading, try refreshing the page when back online</li>
                  <li>Clearing browser cache may remove saved offline content</li>
                  <li>For persistent issues, try logging out and back in when online</li>
                  <li>Contact support if synchronization problems persist</li>
                </ul>
              </details>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
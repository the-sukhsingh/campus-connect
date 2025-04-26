'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getNoteById, addToFavorites, removeFromFavorites } from '@/services/noteServiceClient';
import SaveForOffline from './SaveForOffline';

export default function NoteViewer({ noteId }) {
  const { getIdToken, userRole } = useAuth();
  const { theme } = useTheme();
  const [note, setNote] = useState(null);
  const [viewUrl, setViewUrl] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isAvailableOffline, setIsAvailableOffline] = useState(false);

  // Check if IndexedDB is supported
  const isIndexedDBSupported = typeof indexedDB !== 'undefined';

  // Load note data
  useEffect(() => {
    const loadNote = async () => {
      try {
        setLoading(true);
        const token = await getIdToken();
        console.log("Token from getIdToken", token);
        const result = await getNoteById(noteId, token);
        console.log("REsult from getNoteById", result);
        setNote(result.note);
        setViewUrl(result.viewUrl);
        setIsFavorite(result.isFavorited);
        
        // Check if note is available offline
        if (isIndexedDBSupported) {
          checkOfflineAvailability(result.note._id || result.note.id);
        }
      } catch (err) {
        setError(err.message || 'Error loading note');
      } finally {
        setLoading(false);
      }
    };

    if (noteId) {
      loadNote();
    }
  }, [noteId, getIdToken, isIndexedDBSupported]);

  // Check if note is available offline
  const checkOfflineAvailability = async (noteId) => {
    try {
      const db = await openOfflineDB();
      const tx = db.transaction('notes', 'readonly');
      const store = tx.objectStore('notes');
      const request = store.get(noteId);
      
      request.onsuccess = (event) => {
        setIsAvailableOffline(!!event.target.result);
      };
      
      request.onerror = (event) => {
        console.error('Error checking offline availability:', event.target.error);
        setIsAvailableOffline(false);
      };
    } catch (err) {
      console.error('Failed to check offline availability:', err);
      setIsAvailableOffline(false);
    }
  };

  // Open IndexedDB database
  const openOfflineDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('offlineNotes', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'noteId' });
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

  // Handle offline status change from SaveForOffline component
  const handleOfflineStatusChange = (status) => {
    setIsAvailableOffline(status);
  };

  // Toggle favorite
  const toggleFavorite = async () => {
    try {
      setFavoriteLoading(true);
      const token = await getIdToken();

      if (isFavorite) {
        await removeFromFavorites(noteId, token);
        setIsFavorite(false);
      } else {
        await addToFavorites(noteId, token);
        setIsFavorite(true);
      }
    } catch (err) {
      setError(err.message || `Error ${isFavorite ? 'removing from' : 'adding to'} favorites`);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Get file type icon
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) {
      return (
        <svg className={`w-12 h-12 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'} transition-colors duration-300`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return (
        <svg className={`w-12 h-12 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} transition-colors duration-300`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint') || fileType.includes('ppt')) {
      return (
        <svg className={`w-12 h-12 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'} transition-colors duration-300`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className={`w-12 h-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-svh ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} transition-colors duration-300`}>
      <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
        theme === 'dark' ? 'border-indigo-400' : 'border-indigo-600'
      } transition-colors duration-300`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`border-l-4 p-4 my-4 ${
        theme === 'dark' 
          ? 'bg-red-900/50 border-red-700 text-red-300' 
          : 'bg-red-100 border-red-500 text-red-700'
      } transition-colors duration-300`}>
        <p>{error}</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className={`p-6 text-center shadow-md ${
        theme === 'dark' ? 'bg-gray-800 shadow-gray-900/30' : 'bg-white shadow-gray-200/50'
      } transition-colors duration-300`}>
        <svg className={`w-16 h-16 mx-auto mb-4 ${
          theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
        } transition-colors duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p className={`${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        } transition-colors duration-300`}>Note not found</p>
      </div>
    );
  }

  // Note ID may be either _id or id depending on source
  const noteIdForOffline = note._id || note.id;
  
  return (
    <div className={`p-6 shadow-md ${
      theme === 'dark' 
        ? 'bg-gray-800 shadow-gray-900/30 text-gray-100' 
        : 'bg-white shadow-gray-200/50 text-gray-900'
    } transition-colors duration-300`}>
      {/* Note Header */}
      <div className={`flex items-start justify-between pb-4 mb-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      } transition-colors duration-300`}>
        <div className="flex items-center">
          <div className="mr-4">{getFileIcon(note.fileType)}</div>
          <div>
            <h1 className={`text-2xl font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            } transition-colors duration-300`}>{note.title}</h1>
            <div className={`mt-1 flex items-center text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            } transition-colors duration-300`}>
              <svg className={`flex-shrink-0 mr-1.5 h-5 w-5 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              } transition-colors duration-300`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span>{note.uploadedBy?.displayName || 'Faculty'}</span>
              <span className="mx-2">•</span>
              <svg className={`flex-shrink-0 mr-1.5 h-5 w-5 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              } transition-colors duration-300`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>{new Date(note.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Save for Offline Button */}
          {/* {isIndexedDBSupported && (
            <SaveForOffline
              noteId={noteIdForOffline}
              noteData={{
                title: note.title,
                description: note.description || '',
                fileType: note.fileType,
                fileName: note.fileName,
                subject: note.subject,
                department: note.department,
                semester: note.semester,
                uploadedBy: note.uploadedBy,
                createdAt: note.createdAt,
                tags: note.tags
              }}
              fileUrl={viewUrl}
              fileName={note.fileName}
              fileType={note.fileType}
              onSaved={handleOfflineStatusChange}
              alreadySaved={isAvailableOffline}
            />
          )} */}

          {/* Favorite Button */}
          {userRole === 'student' && (
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-full focus:outline-none ${
                isFavorite 
                  ? theme === 'dark'
                    ? 'text-yellow-400 hover:text-yellow-300' 
                    : 'text-yellow-500 hover:text-yellow-600'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-yellow-400' 
                    : 'text-gray-400 hover:text-yellow-500'
              } transition-colors duration-300`}
              disabled={favoriteLoading}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {favoriteLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
              ) : (
<svg
  className="h-6 w-6"
  fill={isFavorite ? 'currentColor' : 'none'}
  stroke="currentColor"
  viewBox="0 0 24 24"
>
  <path 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    strokeWidth="2" 
    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
  />
</svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Note Details - Commented out for brevity */}
      {/* <div className="mb-6">...</div> */}

      {/* Document Viewer */}
      <div className={`border rounded-lg overflow-hidden ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      } transition-colors duration-300`}>
        <div className="h-[600px] w-full">
          {viewUrl ? (
            <iframe
              src={viewUrl}
              className={`w-full h-full border-0 ${
                theme === 'dark' ? 'bg-[var(--background)]' : 'bg-white'
              } transition-colors duration-300`}
              title={note.title}
              allowFullScreen={true}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            } transition-colors duration-300`}>
              <p className={`${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              } transition-colors duration-300`}>Preview not available</p>
            </div>
          )}
        </div>
      </div>

      {/* Offline Availability Message */}
      {isAvailableOffline && (
        <div className={`mt-4 p-3 rounded flex items-center ${
          theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700'
        } transition-colors duration-300`}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <p>This note is available offline. You can access it without an internet connection.</p>
        </div>
      )}
    </div>
  );
}
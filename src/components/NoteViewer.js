'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getNoteById, addToFavorites, removeFromFavorites } from '@/services/noteServiceClient';

export default function NoteViewer({ noteId }) {
  const { user, getIdToken, userRole } = useAuth();
  const [note, setNote] = useState(null);
  const [viewUrl, setViewUrl] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Load note data
  useEffect(() => {
    const loadNote = async () => {
      try {
        setLoading(true);
        const token = await getIdToken();
        const result = await getNoteById(noteId, token);
        setNote(result.note);
        setViewUrl(result.viewUrl);
        setIsFavorite(result.isFavorited);
      } catch (err) {
        setError(err.message || 'Error loading note');
      } finally {
        setLoading(false);
      }
    };

    if (noteId) {
      loadNote();
    }
  }, [noteId, getIdToken]);

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
        <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return (
        <svg className="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint') || fileType.includes('ppt')) {
      return (
        <svg className="w-12 h-12 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4">
        <p>{error}</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p className="text-gray-600">Note not found</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* Note Header */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center">
          <div className="mr-4">{getFileIcon(note.fileType)}</div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{note.title}</h1>
            <div className="mt-1 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span>{note.uploadedBy?.displayName || 'Faculty'}</span>
              <span className="mx-2">•</span>
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>{new Date(note.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Favorite Button */}
        {userRole === 'student' && (
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-full ${
              isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500'
            } focus:outline-none`}
            disabled={favoriteLoading}
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
                ></path>
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Note Details */}
      <div className="mb-6">
        {note.description && (
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
            <p className="text-gray-700">{note.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Subject</h3>
            <p className="mt-1 text-base text-gray-900">{note.subject}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Department</h3>
            <p className="mt-1 text-base text-gray-900">{note.department}</p>
          </div>
          {note.semester && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Semester</h3>
              <p className="mt-1 text-base text-gray-900">{note.semester}</p>
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-500">File Name</h3>
            <p className="mt-1 text-base text-gray-900">{note.fileName}</p>
          </div>
        </div>

        {note.tags && note.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Document Viewer */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-medium">Document Preview</h2>
        </div>
        <div className="h-[600px] w-full">
          {viewUrl ? (
            <iframe
              src={viewUrl}
              className="w-full h-full border-0"
              title={note.title}
              allowFullScreen={true}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500">Preview not available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
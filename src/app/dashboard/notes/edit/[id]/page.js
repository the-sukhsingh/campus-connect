'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import NoteEditForm from '@/components/NoteEditForm';
import { getNoteById } from '@/services/noteServiceClient';

export default function EditNotePage({ params }) {
  const { user,dbUser, userRole, getIdToken } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const noteId = params.id;

  // Check if the user has permission to edit this note
  useEffect(() => {
    async function checkPermissions() {
      if (!user || !['faculty', 'hod'].includes(dbUser.role)) {
        router.push(`/dashboard/${dbUser.role}`);
        return;
      }

      try {
        setLoading(true);
        const token = await getIdToken();
        const result = await getNoteById(noteId, token);
        
        if (!result.note) {
          setError('Note not found');
          return;
        }
        console.log("REsult is", result.note);
        // Check if the user owns this note or is a HOD (who can edit any note)
        if (userRole !== 'hod' && result.note.uploadedBy._id !== dbUser._id) {
          setError('You do not have permission to edit this note');
          return;
        }

        setNote(result.note);
      } catch (err) {
        console.error('Error checking permissions:', err);
        setError(err.message || 'Error loading note');
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      checkPermissions();
    }
  }, [noteId, user, userRole, router, getIdToken]);

  // Handle successful update
  const handleSuccess = () => {
    router.push(`/dashboard/notes/${noteId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center py-8">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'dark' ? 'border-purple-500' : 'border-indigo-600'}`} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className={`border-l-4 p-4 ${
          theme === 'dark'
            ? 'bg-red-900/50 border-red-700 text-red-300'
            : 'bg-red-100 border-red-500 text-red-700'
        } transition-colors duration-300`}>
          <p>{error}</p>
          <button 
            onClick={() => router.push('/dashboard/notes')} 
            className={`mt-4 px-4 py-2 rounded-md ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            } transition-colors duration-300`}
          >
            Back to Notes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center">
        <button 
          onClick={() => router.push(`/dashboard/notes/${noteId}`)} 
          className={`flex items-center justify-center ${
            theme === 'dark' 
              ? 'text-gray-300 hover:text-white' 
              : 'text-gray-700 hover:text-gray-900'
          } transition-colors duration-300`}
        >
          <svg className="h-5 w-5 mr-1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Note
        </button>
      </div>
      
      <NoteEditForm noteId={noteId} onSuccess={handleSuccess} />
    </div>
  );
}
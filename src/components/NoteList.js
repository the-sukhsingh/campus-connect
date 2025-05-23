'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getNotes, deleteNote } from '@/services/noteServiceClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NoteList({ filters = {}, showActions = false, notes: providedNotes = null, pagination: providedPagination = null, onPageChange: providedPageChange = null }) {
  const { dbUser, user, getIdToken } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [notes, setNotes] = useState(providedNotes || []);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(providedNotes ? false : true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(providedPagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Load notes
  const loadNotes = async (page = 1) => {
    try {
      setLoading(true);
      const token = await getIdToken();
      const result = await getNotes(filters, page, pagination.limit, token);
      setNotes(result.notes);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message || 'Error loading notes');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!providedNotes) {
      loadNotes();
    }
  }, [providedNotes, JSON.stringify(filters)]); // Reload when filters change

  // Filter notes locally based on filter criteria
  const filterNotes = () => {
    let filtered = [...notes];
    
    if (filters.department) {
      filtered = filtered.filter(note => note.department === filters.department);
    }
    
    if (filters.semester) {
      filtered = filtered.filter(note => note.semester === filters.semester);
    }
    
    if (filters.subject) {
      filtered = filtered.filter(note => note.subject === filters.subject);
    }
    
    if (filters.classs) {
      filtered = filtered.filter(note => note.class === filters.classs);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchTerm) || 
        (note.description && note.description.toLowerCase().includes(searchTerm)) || 
        note.subject.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredNotes(filtered);
    
    // Update pagination
    const totalPages = Math.ceil(filtered.length / pagination.limit);
    const currentPage = pagination.page > totalPages ? 1 : pagination.page;
    
    setPagination(prev => ({
      ...prev,
      total: filtered.length,
      page: currentPage,
      totalPages
    }));
  };

  // Apply filters whenever notes or filters change
  useEffect(() => {
    filterNotes();
  }, [notes, JSON.stringify(filters)]);

  // Handle page change
  const handlePageChange = (page) => {
    if (providedPageChange) {
      providedPageChange(page);
    } else {
      if (page < 1 || page > pagination.totalPages) return;
      loadNotes(page);
    }
  };

  // Check if user is the owner of a note
  const isNoteOwner = (note) => {
    if (!user || !note.uploadedBy) return false;
    return note.uploadedBy._id === dbUser._id;
  };

  // Handle note deletion
  const handleDeleteNote = async (noteId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      const token = await getIdToken();
      await deleteNote(noteId, token);
      
      // Update the notes list by filtering out the deleted note
      setNotes(prevNotes => prevNotes.filter(note => note._id !== noteId));
      
      // Show success message
      alert('Note deleted successfully');
    } catch (err) {
      console.error('Error deleting note:', err);
      setError(err.message || 'Error deleting note');
      alert('Failed to delete note. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit note
  const handleEditNote = (noteId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (user && user.role === 'faculty') {
      router.push(`/dashboard/faculty/notes/edit/${noteId}`);
    } else {
      router.push(`/dashboard/notes/edit/${noteId}`);
    }
  };

  // Get file type icon
  const getFileIcon = (fileType) => {
    console.log("File type:", fileType);
    if (fileType.includes('pdf')) {
      return (
        <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'} transition-colors duration-300`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else if (fileType.includes('word') || fileType.includes('docx') ) {
      return (
        <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} transition-colors duration-300`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint') || fileType.includes('ppt')) {
      return (
        <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'} transition-colors duration-300`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    } else if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg') || fileType.includes('jpeg')) {
      return (
        <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'} transition-colors duration-300`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
      }
     else {
      return (
        <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  if (loading && notes.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${theme === 'dark' ? 'border-purple-500' : 'border-indigo-600'} transition-colors duration-300`} />
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

  if (notes.length === 0) {
    return (
      <div className={`p-6 text-center rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'
      } transition-colors duration-300`}>
        <svg className={`w-16 h-16 mx-auto mb-4 ${
          theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
        } transition-colors duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p className={`${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        } transition-colors duration-300`}>No notes found</p>
      </div>
    );
  }

  // Get the notes to display based on filtering and pagination
  const getDisplayedNotes = () => {
    if (providedNotes) {
      return notes;
    }
    
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredNotes.slice(startIndex, endIndex);
  };

  const displayedNotes = getDisplayedNotes();

  return (
    <div className="space-y-6">
      <ul className={`divide-y rounded-lg overflow-hidden ${
        theme === 'dark' 
          ? 'bg-gray-800 shadow-lg divide-gray-700' 
          : 'bg-white shadow-md divide-gray-200'
      } transition-colors duration-300`}>
        {displayedNotes.map((note) => (
          <li key={note._id} className={`transition-colors duration-300 ${
            theme === 'dark'
              ? 'hover:bg-gray-700/50'
              : 'hover:bg-gray-50'
          }`}>
            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getFileIcon(note.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/notes/${note._id}`}>
                    <h3 className={`text-lg font-medium truncate ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    } transition-colors duration-300 hover:underline`}>{note.title}</h3>
                  </Link>
                  {note.description && (
                    <p className={`mt-1 text-sm line-clamp-2 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    } transition-colors duration-300`}>{note.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      theme === 'dark'
                        ? 'bg-blue-900/50 text-blue-300'
                        : 'bg-blue-100 text-blue-800'
                    } transition-colors duration-300`}>
                      {note.subject}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      theme === 'dark'
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-green-100 text-green-800'
                    } transition-colors duration-300`}>
                      {note.department}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      theme === 'dark'
                        ? 'bg-yellow-900/50 text-yellow-300'
                        : 'bg-yellow-100 text-yellow-800'
                    } transition-colors duration-300`}>
                      {note?.class?.name || 'General'}
                    </span>
                    {note.semester && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        theme === 'dark'
                          ? 'bg-purple-900/50 text-purple-300'
                          : 'bg-purple-100 text-purple-800'
                      } transition-colors duration-300`}>
                        Semester {note.semester}
                      </span>
                    )}
                  </div>
                  <div className={`mt-2 flex items-center text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  } transition-colors duration-300`}>
                    <svg className={`flex-shrink-0 mr-1.5 h-5 w-5 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    } transition-colors duration-300`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>
                      {note.uploadedBy?.displayName || 'Faculty'}
                    </span>
                    <span className="mx-2">•</span>
                    <svg className={`flex-shrink-0 mr-1.5 h-5 w-5 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    } transition-colors duration-300`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Actions row */}
                  <div className="mt-3 flex items-center space-x-2">
                    <Link href={`/dashboard/notes/${note._id}`} 
                      className={`text-sm px-3 py-1 rounded-md ${
                        theme === 'dark' 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      } transition-colors duration-300`}>
                      View Details
                    </Link>
                    
                    {(showActions && isNoteOwner(note)) && (
                      <>
                        <button
                          onClick={(e) => handleEditNote(note._id, e)}
                          className={`text-sm px-3 py-1 rounded-md flex items-center ${
                            theme === 'dark'
                              ? 'bg-blue-900/50 hover:bg-blue-800 text-blue-300'
                              : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                          } transition-colors duration-300`}
                        >
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteNote(note._id, e)}
                          className={`text-sm px-3 py-1 rounded-md flex items-center ${
                            theme === 'dark'
                              ? 'bg-red-900/50 hover:bg-red-800 text-red-300'
                              : 'bg-red-100 hover:bg-red-200 text-red-800'
                          } transition-colors duration-300 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={isDeleting}
                        >
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                          </svg>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`px-3 py-2 rounded-l-md border text-sm font-medium ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:bg-[var(--background)] disabled:text-gray-600'
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400'
              } transition-colors duration-300`}
            >
              Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 border text-sm font-medium ${
                  pagination.page === page
                    ? theme === 'dark'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-indigo-600 text-white border-indigo-600'
                    : theme === 'dark'
                      ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                } ${page === 1 ? 'rounded-l-md' : ''} ${page === pagination.totalPages ? 'rounded-r-md' : ''} transition-colors duration-300`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className={`px-3 py-2 rounded-r-md border text-sm font-medium ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:bg-[var(--background)] disabled:text-gray-600'
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400'
              } transition-colors duration-300`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
"use client";

import { fetchWithOfflineSupport, queueSyncOperation, storeOfflineData } from '@/utils/offlineSync';

/**
 * Get all notes with optional filtering
 * @param {object} filters - Optional filters (department, semester, subject, search)
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of notes per page
 * @returns {Promise<object>} - Object containing notes and pagination info
 */
export async function getNotes(filters = {}, page = 1, limit = 10, token) {
  try {
    // Build query params
    const queryParams = new URLSearchParams({
      page,
      limit
    });
    
    // Add optional filters if they exist
    if (filters.department) queryParams.append('department', filters.department);
    if (filters.semester) queryParams.append('semester', filters.semester);
    if (filters.subject) queryParams.append('subject', filters.subject);
    if (filters.college) queryParams.append('college', filters.college);
    if (filters.uploadedBy) queryParams.append('uploadedBy', filters.uploadedBy);
    if (filters.search) queryParams.append('search', filters.search);
    
    const response = await fetch(`/api/notes?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch notes');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
}

/**
 * Get a note by ID with view URL
 * @param {string} noteId - The ID of the note to get
 * @returns {Promise<object>} - The note with view URL
 */
export async function getNoteById(noteId, token) {
  try {
    const response = await fetch(`/api/notes/${noteId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch note');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching note:', error);
    throw error;
  }
}

/**
 * Create a new note
 * @param {object} noteData - The note data
 * @param {File} file - The file to upload
 * @returns {Promise<object>} - The created note
 */
export async function createNote(noteData, file, token) {
  try {
    // Create form data
    const formData = new FormData();
    
    // Add note data
    formData.append('title', noteData.title);
    formData.append('description', noteData.description || '');
    formData.append('subject', noteData.subject);
    formData.append('department', noteData.department);
    formData.append('semester', noteData.semester || '');
    
    // Add classId if available
    if (noteData.classId) {
      formData.append('classId', noteData.classId);
    }
    
    // Add tags as JSON string if available
    if (noteData.tags && noteData.tags.length > 0) {
      formData.append('tags', JSON.stringify(noteData.tags));
    }
    
    // Add file
    formData.append('file', file);
    
    const response = await fetch('/api/notes/manage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create note');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}

// Helper function to open IndexedDB
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

/**
 * Update a note
 * @param {string} noteId - The ID of the note to update
 * @param {object} updateData - The data to update
 * @param {File} file - Optional new file
 * @returns {Promise<object>} - The updated note
 */
export async function updateNote(noteId, updateData, file = null, token) {
  try {
    // Create form data
    const formData = new FormData();
    
    // Add note ID
    formData.append('noteId', noteId);
    
    // Add update data
    formData.append('title', updateData.title);
    formData.append('description', updateData.description || '');
    formData.append('subject', updateData.subject);
    formData.append('department', updateData.department);
    formData.append('semester', updateData.semester || '');
    
    // Add classId if available
    if (updateData.classId) {
      formData.append('classId', updateData.classId);
    }
    
    // Add tags as JSON string if available
    if (updateData.tags && updateData.tags.length > 0) {
      formData.append('tags', JSON.stringify(updateData.tags));
    }
    
    // Add file if provided
    if (file) {
      formData.append('file', file);
    }
    
    const response = await fetch('/api/notes/manage', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update note');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}

/**
 * Delete a note
 * @param {string} noteId - The ID of the note to delete
 * @returns {Promise<object>} - Success message
 */
export async function deleteNote(noteId, token) {
  try {
    const response = await fetch(`/api/notes/manage?noteId=${noteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete note');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

/**
 * Get user's favorite notes
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of notes per page
 * @returns {Promise<object>} - Object containing notes and pagination info
 */
export async function getFavoriteNotes(page = 1, limit = 10, token) {
  try {
    const response = await fetch(`/api/notes/favorites?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch favorite notes');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching favorite notes:', error);
    throw error;
  }
}

/**
 * Add a note to favorites
 * @param {string} noteId - The ID of the note to favorite
 * @returns {Promise<object>} - Success message
 */
export async function addToFavorites(noteId, token) {
  try {
    const response = await fetch('/api/notes/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ noteId })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add note to favorites');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding note to favorites:', error);
    throw error;
  }
}

/**
 * Remove a note from favorites
 * @param {string} noteId - The ID of the note to unfavorite
 * @returns {Promise<object>} - Success message
 */
export async function removeFromFavorites(noteId, token) {
  try {
    const response = await fetch(`/api/notes/favorites?noteId=${noteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove note from favorites');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error removing note from favorites:', error);
    throw error;
  }
}
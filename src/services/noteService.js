import dbConnect from '@/lib/dbConnect';
import Note from '@/models/Note';
import NoteFavorite from '@/models/NoteFavorite';
import { uploadFile, deleteFile, generateSasUrl } from './azureStorageService';
import mongoose from 'mongoose';

/**
 * Create a new note
 * @param {object} noteData - The note data
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} fileName - The original file name
 * @param {string} contentType - The file's content type
 * @returns {Promise<object>} - The created note
 */
export async function createNote(noteData, fileBuffer, fileName, contentType) {
  await dbConnect();

  try {
    // Upload file to Azure Blob Storage
    const fileInfo = await uploadFile(fileBuffer, fileName, contentType);

    // Create new note with the file URL
    const note = new Note({
      ...noteData,
      fileUrl: fileInfo.url,
      fileName: fileInfo.fileName,
      fileType: fileInfo.contentType
    });

    // Save the note to the database
    await note.save();
    return note;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}

/**
 * Get all notes with optional filtering
 * @param {object} filters - Optional filters (department, semester, subject, etc.)
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of notes per page
 * @returns {Promise<object>} - Object containing notes and pagination info
 */
export async function getNotes(filters = {}, page = 1, limit = 10) {
  await dbConnect();

  try {
    const query = { isActive: true };

    // Apply filters if provided
    if (filters.department) query.department = filters.department;
    if (filters.semester) query.semester = filters.semester;
    if (filters.subject) query.subject = filters.subject;
    if (filters.college) query.college = new mongoose.Types.ObjectId(filters.college);
    if (filters.uploadedBy) query.uploadedBy = new mongoose.Types.ObjectId(filters.uploadedBy);
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Count total notes matching the query
    const total = await Note.countDocuments(query);

    // Calculate pagination values
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get notes with pagination
    const notes = await Note.find(query)
      .populate('uploadedBy', 'displayName email')
      .populate('class', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      notes,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error getting notes:', error);
    throw error;
  }
}

/**
 * Get a note by ID
 * @param {string} noteId - The ID of the note to get
 * @returns {Promise<object>} - The note
 */
export async function getNoteById(noteId) {
  await dbConnect();

  try {
    const note = await Note.findById(noteId)
      .populate('uploadedBy', 'displayName email');
      
    if (!note || !note.isActive) {
      throw new Error('Note not found');
    }
    
    return note;
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
}

/**
 * Update a note
 * @param {string} noteId - The ID of the note to update
 * @param {object} updateData - The data to update
 * @param {Buffer} fileBuffer - Optional new file buffer 
 * @param {string} fileName - Optional new file name
 * @param {string} contentType - Optional new content type
 * @returns {Promise<object>} - The updated note
 */
export async function updateNote(noteId, updateData, fileBuffer = null, fileName = null, contentType = null) {
  await dbConnect();

  try {
    const note = await Note.findById(noteId);
    
    if (!note || !note.isActive) {
      throw new Error('Note not found');
    }
    
    // If new file provided, upload it and update file information
    if (fileBuffer) {
      // Delete old file first
      await deleteFile(note.fileUrl);
      
      // Upload new file
      const fileInfo = await uploadFile(fileBuffer, fileName, contentType);
      
      // Update file information
      updateData.fileUrl = fileInfo.url;
      updateData.fileName = fileInfo.fileName;
      updateData.fileType = fileInfo.contentType;
    }
    
    // Update note
    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      { $set: updateData },
      { new: true }
    ).populate('uploadedBy', 'displayName email');
    
    return updatedNote;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}

/**
 * Delete a note (soft delete by setting isActive to false)
 * @param {string} noteId - The ID of the note to delete
 * @returns {Promise<boolean>} - True if the note was deleted successfully
 */
export async function deleteNote(noteId) {
  await dbConnect();

  try {
    const note = await Note.findById(noteId);
    
    if (!note || !note.isActive) {
      throw new Error('Note not found');
    }
    
    // Soft delete by setting isActive to false
    await Note.findByIdAndDelete(noteId);
    
    // Delete file from Azure Blob Storage
    await deleteFile(note.fileUrl);
    
    // Delete all favorites for this note
    await NoteFavorite.deleteMany({ noteId });
    
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

/**
 * Get a signed URL for viewing the note file
 * @param {string} noteId - The ID of the note to get a signed URL for
 * @returns {Promise<string>} - The signed URL
 */
export async function getNoteViewUrl(noteId) {
  await dbConnect();

  try {
    const note = await Note.findById(noteId);
    
    if (!note || !note.isActive) {
      throw new Error('Note not found');
    }
    
    // Generate a SAS URL that expires after 15 minutes
    const sasUrl = await generateSasUrl(note.fileUrl, 15);
    
    return sasUrl;
  } catch (error) {
    console.error('Error getting note view URL:', error);
    throw error;
  }
}

/**
 * Add a note to a user's favorites
 * @param {string} userId - The ID of the user
 * @param {string} noteId - The ID of the note to favorite
 * @returns {Promise<object>} - The created favorite
 */
export async function addNoteToFavorites(userId, noteId) {
  await dbConnect();

  try {
    // Check if note exists and is active
    const note = await Note.findById(noteId);
    
    if (!note || !note.isActive) {
      throw new Error('Note not found');
    }
    
    // Check if already favorited
    const existing = await NoteFavorite.findOne({ userId, noteId });
    
    if (existing) {
      return existing;
    }
    
    // Create new favorite
    const favorite = new NoteFavorite({
      userId,
      noteId
    });
    
    await favorite.save();
    return favorite;
  } catch (error) {
    console.error('Error adding note to favorites:', error);
    throw error;
  }
}

/**
 * Remove a note from a user's favorites
 * @param {string} userId - The ID of the user
 * @param {string} noteId - The ID of the note to unfavorite
 * @returns {Promise<boolean>} - True if the favorite was removed successfully
 */
export async function removeNoteFromFavorites(userId, noteId) {
  await dbConnect();

  try {
    await NoteFavorite.findOneAndDelete({ userId, noteId });
    return true;
  } catch (error) {
    console.error('Error removing note from favorites:', error);
    throw error;
  }
}

/**
 * Check if a note is in a user's favorites
 * @param {string} userId - The ID of the user
 * @param {string} noteId - The ID of the note to check
 * @returns {Promise<boolean>} - True if the note is in the user's favorites
 */
export async function isNoteFavorited(userId, noteId) {
  await dbConnect();

  try {
    const favorite = await NoteFavorite.findOne({ userId, noteId });
    return !!favorite;
  } catch (error) {
    console.error('Error checking if note is favorited:', error);
    throw error;
  }
}

/**
 * Get a user's favorite notes
 * @param {string} userId - The ID of the user
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of notes per page
 * @returns {Promise<object>} - Object containing notes and pagination info
 */
export async function getUserFavoriteNotes(userId, page = 1, limit = 10) {
  await dbConnect();

  try {
    // Count total favorites
    const total = await NoteFavorite.countDocuments({ userId });

    // Calculate pagination values
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get favorite note IDs with pagination
    const favorites = await NoteFavorite.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get the actual notes
    const noteIds = favorites.map(fav => fav.noteId);
    const notes = await Note.find({ 
      _id: { $in: noteIds }, 
      isActive: true 
    }).populate('uploadedBy', 'displayName email');

    // Sort notes in the same order as favorites
    const sortedNotes = noteIds.map(id => 
      notes.find(note => note._id.toString() === id.toString())
    ).filter(Boolean);

    return {
      notes: sortedNotes,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error getting user favorite notes:', error);
    throw error;
  }
}
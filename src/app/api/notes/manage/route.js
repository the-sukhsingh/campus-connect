import { auth } from '@/config/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { createNote, updateNote, deleteNote } from '@/services/noteService';
import dbConnect from '@/lib/dbConnect';

// POST - Create a new note
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract token
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token and get Firebase user
    const decodedToken = await auth.verifyIdToken(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const firebaseUid = decodedToken.uid;
    
    // Get the user from our database
    await dbConnect();
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Only allow faculty or HOD to create notes
    if (!['faculty', 'hod'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Only faculty can upload notes' }, { status: 403 });
    }
    
    // Parse the form data
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const subject = formData.get('subject');
    const department = formData.get('department');
    const semester = formData.get('semester');
    const classId = formData.get('classId'); // Get class ID if provided
    const tags = formData.get('tags') ? JSON.parse(formData.get('tags')) : [];
    const file = formData.get('file');
    
    // Validate required fields
    if (!title || !subject || !department || !file) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, subject, department, and file are required' 
      }, { status: 400 });
    }
    
    // Validate that file is provided
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    
    // Prepare note data
    const noteData = {
      title,
      description: description || '',
      subject,
      department,
      semester: semester || '',
      uploadedBy: dbUser._id,
      college: dbUser.college,
      tags
    };

    // Add class reference if provided
    if (classId) {
      noteData.class = classId;
    }
    
    // Get file buffer
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    const fileName = file.name;
    const contentType = file.type;
    
    // Create note
    const note = await createNote(noteData, fileBuffer, fileName, contentType);
    
    return NextResponse.json({ 
      message: 'Note created successfully',
      note 
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: error.message || 'Error creating note' }, { status: 500 });
  }
}

// PUT - Update a note
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract token
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token and get Firebase user
    const decodedToken = await auth.verifyIdToken(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const firebaseUid = decodedToken.uid;
    
    // Get the user from our database
    await dbConnect();
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Only allow faculty or HOD to update notes
    if (!['faculty', 'hod'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Only faculty can update notes' }, { status: 403 });
    }
    
    // Parse the form data
    const formData = await request.formData();
    const noteId = formData.get('noteId');
    const title = formData.get('title');
    const description = formData.get('description');
    const subject = formData.get('subject');
    const department = formData.get('department');
    const semester = formData.get('semester');
    const classId = formData.get('classId'); // Get class ID if provided
    const tags = formData.get('tags') ? JSON.parse(formData.get('tags')) : [];
    const file = formData.get('file'); // Optional file update
    
    // Validate required fields
    if (!noteId || !title || !subject || !department) {
      return NextResponse.json({ 
        error: 'Missing required fields: noteId, title, subject, and department are required' 
      }, { status: 400 });
    }
    
    // Prepare note update data
    const updateData = {
      title,
      description: description || '',
      subject,
      department,
      semester: semester || '',
      tags
    };

    // Add class reference if provided
    if (classId) {
      updateData.class = classId;
    } else {
      // If no class is selected, set it to null to remove any existing reference
      updateData.class = null;
    }
    
    let fileBuffer, fileName, contentType;
    
    // If file is provided, get file data
    if (file instanceof File) {
      const fileArrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(fileArrayBuffer);
      fileName = file.name;
      contentType = file.type;
    }
    
    // Update note
    const updatedNote = await updateNote(noteId, updateData, fileBuffer, fileName, contentType);
    
    return NextResponse.json({ 
      message: 'Note updated successfully',
      note: updatedNote 
    });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: error.message || 'Error updating note' }, { status: 500 });
  }
}

// DELETE - Delete a note
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract token
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token and get Firebase user
    const decodedToken = await auth.verifyIdToken(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const firebaseUid = decodedToken.uid;
    
    // Get the user from our database
    await dbConnect();
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Only allow faculty or HOD to delete notes
    if (!['faculty', 'hod'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Only faculty can delete notes' }, { status: 403 });
    }
    
    // Get note ID from query params
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');
    
    // Validate note ID
    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }
    
    // Delete note
    await deleteNote(noteId);
    
    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: error.message || 'Error deleting note' }, { status: 500 });
  }
}
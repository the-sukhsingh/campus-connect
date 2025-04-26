import { auth } from '@/config/firebaseAdmin';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Note from '@/models/Note';
import Class from '@/models/Class'; // Add this import for the Class model
import { getUserByFirebaseUid } from '@/services/userService';

/**
 * GET /api/notes/filters
 * Get distinct values for filters from the notes collection
 */
export async function GET(request) {
  try {
    // Get session or verify token
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
    const dbUser = await getUserByFirebaseUid(firebaseUid);

    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const {college} = dbUser;

    // Connect to database
    await dbConnect();
    
    const Notes = await Note.find({ college: college }).populate('class', 'name');

    if (!Notes) {
      return NextResponse.json({ error: 'No notes found' }, { status: 404 });
    }
    
    // Get distinct values for filters
    const departments = [...new Set(Notes.map(note => note.department))];
    const subjects = [...new Set(Notes.map(note => note.subject))];
    const semesters = [...new Set(Notes.map(note => note.semester))];
    const classes = [...new Set(Notes.map(note => note?.class?.name))];
    
    // Sort the arrays for consistent ordering
    departments.sort();
    subjects.sort();
    semesters.sort();
    classes.sort();
    
    // Filter out any null or undefined values
    const filteredDepartments = departments.filter(Boolean);
    const filteredSubjects = subjects.filter(Boolean);
    const filteredSemesters = semesters.filter(Boolean);
    const filteredClasses = classes.filter(Boolean);
    
    return NextResponse.json({
      departments: filteredDepartments,
      subjects: filteredSubjects,
      semesters: filteredSemesters,
      classes: filteredClasses,
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
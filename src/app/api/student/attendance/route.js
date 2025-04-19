import { NextResponse } from 'next/server';
import { 
  getStudentAttendance, 
  getStudentAttendanceSummary, 
  getAttendanceBySubject
} from '@/services/attendanceService';
import { getClassesByStudent } from '@/services/classService';
import { getUserByFirebaseUid } from '@/services/userService';

export async function GET(request) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const firebaseUid = searchParams.get('uid');
    const classId = searchParams.get('classId');
    const subject = searchParams.get('subject');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Verify this is a student
    if (dbUser.role !== 'student') {
      return NextResponse.json({ error: 'Only students can access this API' }, { status: 403 });
    }
    
    // Handle different actions
    if (action === 'get-student-attendance') {
      // Get attendance records for the student
      const attendanceRecords = await getStudentAttendance(dbUser._id.toString());
      return NextResponse.json({ attendanceRecords });
    } 
    else if (action === 'get-student-attendance-summary') {
      // Get attendance summary for the student
      const summary = await getStudentAttendanceSummary(dbUser._id.toString());
      return NextResponse.json({ summary });
    }
    else if (action === 'get-student-classes') {
      // Get classes for the student
      const classes = await getClassesByStudent(dbUser._id.toString());
      return NextResponse.json({ classes });
    }
    else if (action === 'get-subject-attendance' && classId && subject) {
      // First verify student is enrolled in this class
      const classes = await getClassesByStudent(dbUser._id.toString());
      const isEnrolled = classes.some(cls => cls._id.toString() === classId);
      
      if (!isEnrolled) {
        return NextResponse.json({ 
          error: 'You are not enrolled in this class' 
        }, { status: 403 });
      }
      
      // Get attendance for specific subject
      const startDateObj = startDate ? new Date(startDate) : undefined;
      const endDateObj = endDate ? new Date(endDate) : undefined;
      
      const attendanceRecords = await getAttendanceBySubject(
        classId, 
        subject, 
        startDateObj, 
        endDateObj
      );
      
      return NextResponse.json({ attendanceRecords });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
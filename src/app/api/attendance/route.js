import {  NextResponse } from 'next/server';
import { getClassesByFaculty, getClassById } from '@/services/classService';
import { 
  getAttendance, 
  initializeAttendance, 
  saveAttendance, 
  getFacultySubjectsForClass,
  isFacultyAuthorizedForSubject,
  isAttendanceLocked,
  getPreviousAttendance,
  getClassAttendanceSummary,
  getSubjectAttendanceSummary
} from '@/services/attendanceService';
import { getUserByFirebaseUid } from '@/services/userService';

export async function GET(request) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const firebaseUid = searchParams.get('uid');
    const classId = searchParams.get('classId');
    const dateParam = searchParams.get('date');
    const subject = searchParams.get('subject');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined;
    const initialize = searchParams.get('initialize') === 'true';
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Handle different actions
    if (action === 'get-classes') {
      // Check if the user is a faculty or admin
      if (!['faculty', 'hod'].includes(dbUser.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Get classes for the faculty including those they're assigned to
      const result = await getClassesByFaculty(firebaseUid);
      return NextResponse.json(result);
    } 
    else if (action === 'get-class-subjects' && classId) {
      // Check if the user is a faculty or admin
      if (!['faculty', 'hod'].includes(dbUser.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Get subjects this faculty can mark attendance for
      const subjects = await getFacultySubjectsForClass(dbUser._id.toString(), classId);
      return NextResponse.json({ subjects });
    }
    else if (action === 'get-class-with-students' && classId) {
      // Check if the user is a faculty or admin
      if (!['faculty', 'hod'].includes(dbUser.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Get a specific class with its students
      const classData = await getClassById(classId);
      if (!classData) {
        return NextResponse.json({ error: 'Class not found' }, { status: 404 });
      }
      return NextResponse.json({ class: classData });
    } 
    else if (action === 'get-attendance' && classId && dateParam && subject) {
      // Check if the user is a faculty or admin
      if (!['faculty', 'hod'].includes(dbUser.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Check if faculty is authorized to mark attendance for this subject
      const isAuthorized = await isFacultyAuthorizedForSubject(
        dbUser._id.toString(), 
        classId, 
        subject
      );
      
      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'You are not authorized to mark attendance for this subject' }, 
          { status: 403 }
        );
      }
      
      // Get attendance for a specific class, subject and date
      const date = new Date(dateParam);
      const attendance = await getAttendance(classId, subject, date);
      
      if (!attendance) {
        // Only initialize if explicitly requested or if we're initializing a record for today
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        if (initialize || isToday) {
          // If no attendance record exists, initialize one
          const initializedAttendance = await initializeAttendance(
            classId,
            subject,
            date, 
            dbUser._id.toString()
          );
          return NextResponse.json({ 
            attendance: initializedAttendance,
            isNewRecord: true,
            locked: false
          });
        } else {
          // Return an empty response, without initializing
          return NextResponse.json({
            attendance: null,
            isNewRecord: false,
            exists: false,
            locked: false
          });
        }
      }
      
      // Explicitly retrieve the lock status
      return NextResponse.json({ 
        attendance, 
        isNewRecord: false,
        exists: true,
        locked: attendance.locked === true
      });
    }
    else if (action === 'check-attendance-exists' && classId && dateParam && subject) {
      // Check if attendance record exists without initializing
      const date = new Date(dateParam);
      const attendance = await getAttendance(classId, subject, date);
      
      return NextResponse.json({ 
        exists: !!attendance,
        locked: attendance ? attendance.locked === true : false
      });
    }
    else if (action === 'get-previous-attendance' && classId && subject) {
      // Check if the user is a faculty or admin
      if (!['faculty', 'hod'].includes(dbUser.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Check if faculty is authorized to view attendance for this subject
      const isAuthorized = await isFacultyAuthorizedForSubject(
        dbUser._id.toString(), 
        classId, 
        subject
      );
      
      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'You are not authorized to view attendance for this subject' }, 
          { status: 403 }
        );
      }
      
      // Get previous attendance records
      const previousAttendance = await getPreviousAttendance(
        classId, 
        subject
      );
      
      return NextResponse.json({ previousAttendance });
    }
    else if (action === 'check-locked' && classId && dateParam && subject) {
      // Check if the attendance record is locked
      const date = new Date(dateParam);
      const locked = await isAttendanceLocked(classId, subject, date);
      
      return NextResponse.json({ locked });
    }
    else if (action === 'get-class-summary' && classId) {
      // Check if the user is a faculty or admin
      if (!['faculty', 'hod'].includes(dbUser.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Get attendance summary for the class
      const summary = await getClassAttendanceSummary(classId);
      return NextResponse.json({ summary });
    }
    else if (action === 'get-student-stats' && classId && subject) {
      // Check if the user is a faculty or admin
      if (!['faculty', 'hod'].includes(dbUser.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Get attendance summary for the class
      const summary = await getSubjectAttendanceSummary(classId, subject);
      return NextResponse.json({ summary });
    }
    
    console.log("Invalid action:", action);
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { firebaseUid, classId, subject, date, attendanceRecords, initialize = true } = body;
    
    if (!firebaseUid || !classId || !subject || !date || !attendanceRecords) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if the user is a faculty or admin
    if (!['faculty', 'hod'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Check if faculty is authorized to mark attendance for this subject
    const isAuthorized = await isFacultyAuthorizedForSubject(
      dbUser._id.toString(), 
      classId, 
      subject
    );
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You are not authorized to mark attendance for this subject' }, 
        { status: 403 }
      );
    }
    
    // Check if attendance is already locked
    const attendanceDate = new Date(date);
    const isLocked = await isAttendanceLocked(classId, subject, attendanceDate);
    
    if (isLocked) {
      return NextResponse.json(
        { error: 'This attendance record is already locked and cannot be modified' },
        { status: 403 }
      );
    }
    
    // Initialize if needed (e.g. for past dates that didn't have records)
    let attendance = await getAttendance(classId, subject, attendanceDate);
    if (!attendance && initialize) {
      attendance = await initializeAttendance(
        classId,
        subject,
        attendanceDate,
        dbUser._id.toString()
      );
    }
    
    // Save the attendance (with locking enabled)
    const savedAttendance = await saveAttendance(
      classId,
      subject,
      attendanceDate,
      attendanceRecords,
      dbUser._id.toString(),
      true // lock the attendance after saving
    );
    
    return NextResponse.json({ 
      success: true, 
      attendance: savedAttendance,
      locked: true
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
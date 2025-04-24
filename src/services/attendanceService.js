import dbConnect from '@/lib/dbConnect';
import Attendance, { IAttendance } from '@/models/Attendance';
import Class from '@/models/Class';
import mongoose from 'mongoose';

// Get attendance for a specific class, subject, and date
export async function getAttendance(classId, subject, date) {
  try {
    await dbConnect();
    
    // Convert date to start of day to match attendance records
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      classId,
      subject,
      date: {
        $gte: searchDate,
        $lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate({
      path: 'attendanceRecords.student',
      select: 'displayName email rollNo'
    });
    
    return attendance;
  } catch (error ) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
}

// Create or update attendance for a class
export async function saveAttendance(
  classId,
  subject, 
  date, 
  attendanceRecords,
  facultyId,
  shouldLock = true // Default to locking the attendance after saving
) {
  try {
    await dbConnect();
    
    // Convert date to start of day for consistency
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    // Try to find an existing attendance record
    let attendance = await Attendance.findOne({
      classId,
      subject,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (attendance) {
      // Check if the attendance is already locked
      if (attendance.locked) {
        throw new Error('This attendance record is locked and cannot be modified');
      }
      
      // Update existing attendance
      attendance.attendanceRecords = attendanceRecords;
      attendance.markedBy = facultyId;
      
      // Lock the attendance if requested
      if (shouldLock) {
        attendance.locked = true;
        attendance.lockedAt = new Date();
      }
      
      await attendance.save();
    } else {
      // Create new attendance record
      attendance = new Attendance({
        classId,
        subject,
        date: attendanceDate,
        attendanceRecords,
        markedBy: facultyId,
        locked: shouldLock,
        lockedAt: shouldLock ? new Date() : undefined
      });
      await attendance.save();
    }
    
    return attendance;
  } catch (error ) {
    console.error('Error saving attendance:', error);
    throw error;
  }
}

// Initialize attendance with all students set to absent
export async function initializeAttendance(classId, subject, date, facultyId){
  try {
    await dbConnect();
    
    // Get the class to find all enrolled students
    const classData = await Class.findById(classId).populate({
      path: 'students.student',
      select: 'displayName email rollNo'
    });
    
    if (!classData) {
      throw new Error('Class not found');
    }
    
    // Convert date to start of day for consistency
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    // Check if attendance already exists
    let attendance = await Attendance.findOne({
      classId,
      subject,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (attendance) {
      return attendance; // Return existing attendance
    }
    
    // Create attendance records for all students with default 'absent' status
    const attendanceRecords = classData.students.map((student) => ({
      student: student._id || student.student._id,
      status: 'absent'
    }));
    
    // Create new attendance
    attendance = new Attendance({
      classId,
      subject,
      date: attendanceDate,
      attendanceRecords,
      markedBy: facultyId,
      locked: false // Not locked initially so faculty can mark attendance
    });
    
    await attendance.save();
    return attendance;
  } catch (error ) {
    console.error('Error initializing attendance:', error);
    throw error;
  }
}

// Check if an attendance record is locked
export async function isAttendanceLocked(classId, subject, date) {
  try {
    await dbConnect();
    
    // Convert date to start of day for consistency
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      classId,
      subject,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    return attendance ? attendance.locked : false;
  } catch (error ) {
    console.error('Error checking if attendance is locked:', error);
    return false;
  }
}

// Get previous attendance records for a specific class and subject
export async function getPreviousAttendance(classId, subject) {
  try {
    await dbConnect();

    const attendanceRecords = await Attendance.find({
      classId,
      subject
    })
    .populate({
      path: 'attendanceRecords.student',
      select: 'displayName email rollNo _id'
    })
    .sort({ date: -1 }) // Most recent first
    
    console.log('Previous attendance records:', attendanceRecords);

    return attendanceRecords;
  } catch (error ) {
    console.error('Error fetching previous attendance:', error);
    throw error;
  }
}

// Get attendance statistics for a class and subject
export async function getAttendanceStats(classId, subject){
  try {
    await dbConnect();
    
    const query = { classId };
    if (subject) {
      query.subject = subject;
    }
    
    const attendanceRecords = await Attendance.find(query);
    const totalDays = attendanceRecords.length;
    
    // Get the class to find all enrolled students
    const classData = await Class.findById(classId).populate({
      path: 'students',
      select: 'displayName email'
    });
    
    if (!classData) {
      throw new Error('Class not found');
    }
    
    // Initialize stats for each student
    const stats = {};
    
    classData.students.forEach((student) => {
      stats[student._id.toString()] = {
        student: {
          _id: student._id,
          displayName: student.displayName,
          email: student.email
        },
        present: 0,
        absent: 0,
        late: 0,
        percentage: 0
      };
    });
    
    // Count attendance for each student
    attendanceRecords.forEach(record => {
      record.attendanceRecords.forEach((entry) => {
        const studentId = entry.student.toString();
        if (stats[studentId]) {
          if (entry.status === 'present') {
            stats[studentId].present += 1;
          } else if (entry.status === 'absent') {
            stats[studentId].absent += 1;
          } else if (entry.status === 'late') {
            stats[studentId].late += 1;
          }
        }
      });
    });
    
    // Calculate attendance percentage
    Object.keys(stats).forEach(studentId => {
      const student = stats[studentId];
      const attended = student.present + student.late;
      student.percentage = totalDays > 0 ? (attended / totalDays) * 100 : 0;
    });
    
    return {
      totalDays,
      stats: Object.values(stats)
    };
  } catch (error ) {
    console.error('Error getting attendance stats:', error);
    throw error;
  }
}

// Get attendance records for a specific student across all classes
export async function getStudentAttendance(studentId) {
  try {
    await dbConnect();
    
    const classes = await Class.find({
      'students.student': studentId
    })
    .populate('facultyAssignments.faculty');

    const attendanceRecords = [];

    for(const classData of classes) {
      
      const studentRecord = classData.students.find((student) => 
      {
        
        return student.student.toString() === studentId.toString() ||
        (student.student._id && student.student._id.toString() === studentId.toString());
      }
      );
  
      if (!studentRecord) continue;

      // Get all active subjects in this class
      const activeSubjects = classData.facultyAssignments.map(assignment => assignment.subject);
      // Find all attendance records that contain this student
      const classAttendanceRecords = await Attendance.find({
        'attendanceRecords.student': studentRecord.student || studentRecord.student._id
      })
      .populate({
        path: 'classId',
        select: 'name department semester'
      })
      .populate({
        path: 'markedBy',
        select: 'displayName email'
      })
      .sort({ date: -1 }); // Most recent first

  
      // Format the data to be more usable by the frontend
      // Only include records for subjects that still have faculty assigned
      const formattedRecords = classAttendanceRecords
        .filter(record => activeSubjects.includes(record.subject)) // Filter by active subjects only
        .map(record => {
          const studentAttendance = record.attendanceRecords.find(
            (rec) => {
              return rec.student.toString() === studentRecord.student.toString() || 
              (rec.student._id && rec.student._id.toString() === studentRecord.student.toString())
            }
          );
          return {
            class: record.classId,
            date: record.date,
            subject: record.subject,
            status: studentAttendance?.status || 'absent',
            remark: studentAttendance?.remark,
            markedBy: record.markedBy
          };
        });
        console.log('Formatted records:', formattedRecords);

      attendanceRecords.push(...formattedRecords);
    }
    
    return attendanceRecords;
  } catch (error ) {
    console.error('Error fetching student attendance:', error);
    throw error;
  }
}

// Get attendance summary for a student across all classes
export async function getStudentAttendanceSummary(studentId){
  try {
    await dbConnect();
    
    // Get all classes the student is enrolled in
    const classes = await Class.find({
      'students.student': studentId
    })
    .populate('facultyAssignments.faculty');
    
    const classSummaries = [];
    
    // For each class, calculate attendance stats for each subject
    for (const classData of classes) {
      // Get all subjects taught in this class (only those with active faculty assignments)
      const subjects = classData.facultyAssignments.map(assignment => assignment.subject);
      const uniqueSubjects = [...new Set(subjects)]; // Remove duplicates
      
      for (const subject of uniqueSubjects) {
        // Skip subjects that don't have faculty assigned anymore
        if (!classData.facultyAssignments.some(assignment => assignment.subject === subject)) {
          continue;
        }
        
        const attendanceRecords = await Attendance.find({ 
          classId: classData._id,
          subject: subject
        });
        
        const totalDays = attendanceRecords.length;
        let present = 0;
        let absent = 0;
        let late = 0;
        
        // Count attendance for this student in this subject
        attendanceRecords.forEach(record => {
          const studentRecord = classData.students.find((student) => 
            student.student.toString() === studentId.toString() || 
            (student.student._id && student.student._id.toString() === studentId)
          );

          console.log('Student record:', studentRecord);

          // console.log("Attendance record:", record);

          // Find this student's status in the attendance record
          const studentAttendanceRecord = record.attendanceRecords.find(
            (rec) => {
              console.log('Checking student:', rec.student.toString(), studentRecord.student.toString());
              return rec.student.toString() === studentRecord.student.toString() 
            }
          );

          // console.log('Student attendance record:', studentAttendanceRecord);

          if (studentAttendanceRecord) {
            if (studentAttendanceRecord.status === 'present') {
              present++;
            } else if (studentAttendanceRecord.status === 'absent') {
              absent++;
            } else if (studentAttendanceRecord.status === 'late') {
              late++;
            }
          }
        });
        
        const percentage = totalDays > 0 ? ((present + late) / totalDays) * 100 : 0;
        
        classSummaries.push({
          class: {
            _id: classData._id,
            name: classData.name,
            department: classData.department,
            currentSemester: classData.currentSemester || 1,
          },
          subject,
          totalDays,
          present,
          absent,
          late,
          percentage: Math.round(percentage * 10) / 10 // Round to 1 decimal place
        });
      }
    }

    // console.log('Student attendance summary:', classSummaries);
    
    return classSummaries;
  } catch (error ) {
    console.error('Error getting student attendance summary:', error);
    throw error;
  }
}

// Check if a faculty member is authorized to mark attendance for a class and subject
export async function isFacultyAuthorizedForSubject(facultyId, classId, subject) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(facultyId)) {
      return false;
    }
    
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return false;
    }
    
    // Class owner can mark attendance for any subject
    if (classObj.teacher.toString() === facultyId) {
      return true;
    }
    
    // Check if this faculty is assigned to this subject
    const isAssigned = classObj.facultyAssignments.some(
      assignment => 
        assignment.faculty.toString() === facultyId && 
        assignment.subject === subject
    );
    
    return isAssigned;
  } catch (error ) {
    console.error('Error checking faculty authorization:', error);
    return false;
  }
}

// Get subjects a faculty can mark attendance for in a class
export async function getFacultySubjectsForClass(facultyId, classId) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(facultyId)) {
      throw new Error('Invalid IDs');
    }
    
    const classObj = await Class.findById(classId);
    if (!classObj) {
      throw new Error('Class not found');
    }
    
    // Class owner can mark attendance for all subjects
    if (classObj.teacher.toString() === facultyId) {
      return classObj.facultyAssignments.map(assignment => assignment.subject);
    }
    
    // Get only subjects this faculty is assigned to
    const subjects = classObj.facultyAssignments
      .filter(assignment => assignment.faculty.toString() === facultyId)
      .map(assignment => assignment.subject);
    
    return subjects;
  } catch (error ) {
    console.error('Error getting faculty subjects:', error);
    throw error;
  }
}

// Get attendance by class and subject for a specific date range
export async function getAttendanceBySubject(
  classId, 
  subject, 
  startDate, 
  endDate
){
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error('Invalid class ID');
    }
    
    const query = {
      classId,
      subject
    };
    
    if (startDate || endDate) {
      query.date = {};
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    
    const attendanceRecords = await Attendance.find(query)
      .populate({
        path: 'attendanceRecords.student',
        select: 'displayName email'
      })
      .populate({
        path: 'markedBy',
        select: 'displayName email'
      })
      .sort({ date: 1 });
      
    return attendanceRecords;
  } catch (error ) {
    console.error('Error getting attendance by subject:', error);
    throw error;
  }
}

// Get attendance summary for a specific class
export async function getClassAttendanceSummary(classId, subject = null) {
  try {
    await dbConnect();
    
    // Get the class to check active faculty assignments
    const classData = await Class.findById(classId);
    if (!classData) {
      throw new Error('Class not found');
    }
    
    // Get all currently active subjects from faculty assignments
    const activeSubjects = classData.facultyAssignments.map(assignment => assignment.subject);
    
    // Find the most recent attendance record for each subject
    const latestAttendance = await Attendance.aggregate([
      { $match: { classId: new mongoose.Types.ObjectId(classId) } },
      { $sort: { date: -1 } },
      { $group: {
          _id: "$subject",
          lastMarked: { $first: "$date" },
          lastAttendanceId: { $first: "$_id" }
        }
      }
    ]);
    
    // Get total days of attendance per subject
    const subjectCounts = await Attendance.aggregate([
      { $match: { classId: new mongoose.Types.ObjectId(classId) } },
      { $group: {
          _id: "$subject",
          totalDays: { $sum: 1 }
        }
      }
    ]);
    
    // Filter subjects to only include those that are currently assigned to faculty
    const subjects = [...new Set(latestAttendance.map(item => item._id))]
      .filter(subject => activeSubjects.includes(subject));
    
    // Calculate total days for active subjects only
    const totalDays = subjectCounts
      .filter(item => activeSubjects.includes(item._id))
      .reduce((sum, item) => sum + item.totalDays, 0);
    
    const lastMarkedDate = latestAttendance.length > 0 ? 
      new Date(Math.max(...latestAttendance
        .filter(item => activeSubjects.includes(item._id))
        .map(item => new Date(item.lastMarked)))) : null;
    
    return {
      lastMarked: lastMarkedDate,
      totalDays,
      subjects
    };
  } catch (error) {
    console.error('Error getting class attendance summary:', error);
    throw error;
  }
}

// Get attendance summary for a specific subject in a class
export async function getSubjectAttendanceSummary(classId, subject) {
  try {
    await dbConnect();

    const query = { 
      classId: new mongoose.Types.ObjectId(classId),
      subject 
    };

    // Get total attendance records for this subject
    const totalRecords = await Attendance.find(query).countDocuments();

    // Get latest attendance date
    const latestRecord = await Attendance.findOne(query)
      .sort({ date: -1 })
      .select('date');

    // Get attendance stats for all students
    const attendanceStats = await Attendance.aggregate([
      { $match: query },
      { $unwind: "$attendanceRecords" },
      { $group: {
          _id: "$attendanceRecords.student",
          present: { 
            $sum: { $cond: [{ $eq: ["$attendanceRecords.status", "present"] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ["$attendanceRecords.status", "late"] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$attendanceRecords.status", "absent"] }, 1, 0] }
          }
      }}
    ]);

    return {
      totalClasses: totalRecords,
      lastMarkedDate: latestRecord?.date || null,
      studentStats: attendanceStats
    };
  } catch (error) {
    console.error('Error getting subject attendance summary:', error);
    throw error;
  }
}
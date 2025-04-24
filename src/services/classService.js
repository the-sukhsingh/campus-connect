import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Class from '@/models/Class';
import User from '@/models/User';
import CollegeModel from '@/models/College';
import { deleteUser, getUserByFirebaseUid } from './userService';
import Attendance from '@/models/Attendance';

// Create a new class
export async function createClass(teacherId, collegeId, classData) {

  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(teacherId) || !mongoose.Types.ObjectId.isValid(collegeId)) {
      throw new Error('Invalid IDs');
    }

    const newClass = new Class({
      name: classData.name,
      course: classData.course,
      department: classData.department,
      currentSemester: classData.currentSemester,
      totalSemesters: classData.totalSemesters || 8, // Default to 8 if not provided
      currentSemester: classData.currentSemester || 1, // Default to 1 if not provided
      batch: classData.batch,
      college: collegeId,
      teacher: teacherId,
      facultyAssignments: [],
      students: [],
      studentRequests: [],
    });

    const college = await CollegeModel.findById(collegeId);

    if (!college) {
      throw new Error('College not found');
    }

    // Add the class to the college's classes array
    college.classes = college.classes || [];
    college.classes.push(newClass._id);

    const teacher = await User.findById(teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Add the class to the teacher's classes array
    teacher.classes = teacher.classes || [];
    teacher.classes.push(newClass._id);

    await teacher.save();
    await college.save();
    await newClass.save();
    return newClass;
  } catch (error ) {
    console.error('Error creating class:', error);
    throw error;
  }
}

// Get classes created by a specific teacher
export async function getClassesByTeacher(teacherId) {
  try {
    await dbConnect();

    const user = await getUserByFirebaseUid(teacherId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'faculty' && user.role !== 'hod') {
      throw new Error('Unauthorized. Only teachers can access this endpoint');
    }

    const classes = await Class.find({ teacher: user._id })
      .populate('college', 'name')
      .populate('teacher', 'displayName email')
      .populate('students', 'displayName email college department')
      .sort({ createdAt: -1 });

    let totalStudents = 0;
    classes.forEach(cls => {
      // Count only approved students
      totalStudents += cls.students.filter((s) => s.status === 'approved').length;
    });

    return { classes, totalStudents };
  } catch (error) {
    console.error('Error getting classes by teacher:', error);
    throw error;
  }
}

// Get classes where faculty is assigned
export async function getClassesByFaculty(facultyId) {
  try {
    await dbConnect();

    const user = await getUserByFirebaseUid(facultyId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'faculty' && user.role !== 'hod') {
      throw new Error('Unauthorized. Only faculty members can access this endpoint');
    }

    // Find classes where this faculty member is assigned
    const classes = await Class.find({
      $or: [
        // { teacher: user._id }, // Classes they created
        { 'facultyAssignments.faculty': user._id } // Classes they are assigned to
      ]
    })
    .populate('college', 'name')
    .populate('teacher', 'displayName email')
    .populate({
      path: 'facultyAssignments.faculty',
      select: 'displayName email'
    })
    .populate('students', 'displayName email college department')
    .sort({ createdAt: -1 });

    // For each class, include the subjects this faculty teaches
    const classesWithSubjects = classes.map(cls => {
      const assignments = cls.facultyAssignments.filter(
        (assignment) => assignment.faculty.toString() === user._id.toString() || 
                      (assignment.faculty?._id && assignment.faculty._id.toString() === user._id.toString())
      );
      
      const subjects = assignments.map((assignment) => assignment.subject);
      
      return {
        ...cls.toObject(),
        teachingSubjects: subjects
      };
    });

    return {
      classes: classesWithSubjects,
      totalClasses: classesWithSubjects.length
    };
  } catch (error ) {
    console.error('Error getting classes by faculty:', error);
    throw error;
  }
}

// Get a class by its ID
export async function getClassById(classId) {
  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error('Invalid class ID');
    }

    const classObj = await Class.findById(classId)
      .populate('college', 'name')
      .populate('teacher', 'displayName email')
      .populate({
      path: 'students.student',
      select: 'displayName email rollNo studentId'
      });

    if (!classObj) {
      throw new Error('Class not found');
    }

    return classObj;
  } catch (error ) {
    console.error('Error getting class by ID:', error);
    throw error;
  }
}

// Assign a faculty member to a class with a specific subject
export async function assignFacultyToClass(
  classId,
  facultyId,
  subject,
  assignedById
) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(classId) || 
        !mongoose.Types.ObjectId.isValid(facultyId) || 
        !mongoose.Types.ObjectId.isValid(assignedById)) {
      throw new Error('Invalid IDs');
    }
    
    if (!subject || subject.trim() === '') {
      throw new Error('Subject name is required');
    }
    
    // Verify the class exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      throw new Error('Class not found');
    }
    
    // Verify the faculty member exists
    const faculty = await User.findById(facultyId);
    if (!faculty) {
      throw new Error('Faculty member not found');
    }
    
    // Only allow the class owner or previously assigned faculty to assign new faculty
    const assigningUser = await User.findById(assignedById);
    if (!assigningUser) {
      throw new Error('Assigning user not found');
    }
    
    if (classObj.teacher.toString() !== assignedById && 
        !classObj.facultyAssignments.some((assignment ) => 
          assignment.faculty.toString() === assignedById)) {
      throw new Error('Unauthorized. Only class owner or assigned faculty can assign other faculty');
    }
    
    // Check if this faculty is already assigned the same subject
    const existingAssignment = classObj.facultyAssignments.find(
      (assignment ) => assignment.faculty.toString() === facultyId && assignment.subject === subject
    );
    
    if (existingAssignment) {
      throw new Error(`Faculty is already assigned to teach ${subject} in this class`);
    }
    
    // Add the assignment
    const newAssignment = {
      faculty: new mongoose.Types.ObjectId(facultyId),
      subject: subject.trim(),
      assignedBy: new mongoose.Types.ObjectId(assignedById),
      assignedAt: new Date()
    };
    
    classObj.facultyAssignments.push(newAssignment);
    await classObj.save();
    
    // Update faculty's classes
    faculty.classes = faculty.classes || [];
    if (!faculty.classes.includes(classObj._id)) {
      faculty.classes.push(classObj._id);
      await faculty.save();
    }
    
    return {
      success: true,
      message: `${faculty.displayName} has been assigned to teach ${subject}`,
      assignment: newAssignment
    };
  } catch (error ) {
    console.error('Error assigning faculty to class:', error);
    throw error;
  }
}

// Remove a faculty assignment from a class
export async function removeFacultyAssignment(
  classId,
  assignmentId,
  requestedById
) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(requestedById)) {
      throw new Error('Invalid IDs');
    }
    
    // Verify the class exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      throw new Error('Class not found');
    }
    
    // Only allow the class owner to remove assignments
    if (classObj.teacher.toString() !== requestedById) {
      throw new Error('Unauthorized. Only class owner can remove faculty assignments');
    }
    
    // Find the assignment
    const assignmentIndex = classObj.facultyAssignments.findIndex(
      (assignment) => assignment._id.toString() === assignmentId
    );
    
    if (assignmentIndex === -1) {
      throw new Error('Faculty assignment not found');
    }
    
    // Cannot remove the class owner's assignment
    const assignment = classObj.facultyAssignments[assignmentIndex];
    if (assignment.faculty.toString() === classObj.teacher.toString()) {
      throw new Error('Cannot remove the class owner from faculty assignments');
    }
    
    // Remove the assignment
    classObj.facultyAssignments.splice(assignmentIndex, 1);
    await classObj.save();
    
    // Check if this was the faculty's only assignment to this class
    const facultyId = assignment.faculty.toString();
    const hasOtherAssignments = classObj.facultyAssignments.some(
      (a) => a.faculty.toString() === facultyId
    );
    
    // If no other assignments, remove class from faculty's classes
    if (!hasOtherAssignments) {
      const faculty = await User.findById(facultyId);
      if (faculty && faculty.classes) {
        faculty.classes = faculty.classes.filter(
          (cId) => cId.toString() !== classId
        );
        await faculty.save();
      }
    }
    
    return {
      success: true,
      message: 'Faculty assignment has been removed'
    };
  } catch (error ) {
    console.error('Error removing faculty assignment:', error);
    throw error;
  }
}

// Delete a class
export async function deleteClass(classId, facultyId) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(facultyId)) {
      throw new Error('Invalid IDs');
    }
    
    // Verify the class exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      throw new Error('Class not found');
    }
    console.log("classOBJ.teacher", classObj.teacher.toString(), facultyId);
    // Only allow the class owner to delete the class
    if (classObj.teacher.toString() !== facultyId.toString()) {
      throw new Error('Unauthorized. Only the class creator can delete this class');
    }
    
    // Remove class from teacher's classes array
    await User.updateOne(
      { _id: facultyId },
      { $pull: { classes: classId } }
    );
    
    // Remove class from college's classes array
    if (classObj.college) {
      await CollegeModel.updateOne(
        { _id: classObj.college },
        { $pull: { classes: classId } }
      );
    }
    
    // Remove class from any faculty member's classes array
    if (classObj.facultyAssignments && classObj.facultyAssignments.length > 0) {
      const facultyIds = classObj.facultyAssignments.map(
        assignment => assignment.faculty
      );
      
      await User.updateMany(
        { _id: { $in: facultyIds } },
        { $pull: { classes: classId } }
      );
    }

    // Delete the students of class
    if (classObj.students && classObj.students.length > 0) {
      const studentIds = classObj.students.map(
        student => student.student
      );

      for (const studentId of studentIds) {
        await deleteUser(studentId);
      }

    }
    
    // Remove the attendance records for this class
    await Attendance.deleteMany({ classId: classId });
    


    // Delete the class
    await Class.findByIdAndDelete(classId);
    
    return {
      success: true,
      message: 'Class has been deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
}

// Get student requests for a class
export async function getStudentRequestsForClass(classId, status) {
  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error('Invalid class ID');
    }

    const classObj = await Class.findById(classId);
    if (!classObj) {
      throw new Error('Class not found');
    }

    // Fetch student details from User model
    let students = [];

    if (status === 'pending') {
      // For pending status, fetch students from the studentRequests array
      if (classObj.studentRequests && classObj.studentRequests.length > 0) {
        students = await User.find({
          _id: { $in: classObj.studentRequests }
        })
        .select('displayName email college department')
        .populate('college', 'name')
        .populate('department', 'name')
        .lean();
        
        // Add status information since these are all pending requests
        students = students.map(student => ({
          ...student,
          status: 'pending',
          joinRequestDate: new Date() // We don't have the exact date, so using current date
        }));
      }
    } else {
      // For approved/rejected status, use the students array with matching status
      const studentArray = classObj.students.filter(
        (s) => s.status === status
      );
      
      if (studentArray && studentArray.length > 0) {
        const studentIds = studentArray.map((s) => s.student);
        
        students = await User.find({
          _id: { $in: studentIds }
        })
        .select('displayName email college department')
        .populate('college', 'name')
        .populate('department', 'name')
        .lean();
        
        // Add status information from the class object
        students = students.map(student => {
          const studentEntry = classObj.students.find(
            (s) => s.student.toString() === student._id.toString()
          );
          
          return {
            ...student,
            status: studentEntry ? studentEntry.status : status,
            joinRequestDate: studentEntry ? studentEntry.joinRequestDate : new Date()
          };
        });
      }
    }

    return students;
  } catch (error ) {
    console.error('Error getting student requests:', error);
    throw error;
  }
}


// Get all students in a class
export async function getStudentsByClass(classId) {
  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error('Invalid class ID');
    }

    const classObj = await Class.findById(classId);
    if (!classObj) {
      throw new Error('Class not found');
    }

    // Get all student IDs from the students array
    const studentIds = classObj.students.map((s) => s.student);

    // Fetch student details from User model
    const students = await User.find({ 
      _id: { $in: studentIds } 
    })
    .select('displayName email college department');

    // Add the status information from the class object
    const studentsWithStatus = students.map(student => {
      const studentEntry = classObj.students.find(
        (s) => s.student.toString() === student._id.toString()
      );
      
      return {
        ...student.toObject(),
        status: studentEntry ? studentEntry.status : 'unknown',
        joinRequestDate: studentEntry ? studentEntry.joinRequestDate : null
      };
    });

    return studentsWithStatus;
  } catch (error ) {
    console.error('Error getting students by class:', error);
    throw error;
  }
}

// Get classes a student is enrolled in
export async function getClassesByStudent(studentId) {
  try {
    await dbConnect();
    
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }
    
    if (student.role !== 'student') {
      throw new Error('User is not a student');
    }
    
    // Find classes where this student is in the students array
    const classes = await Class.find({
      'students.student': new mongoose.Types.ObjectId(studentId)
    })
    .populate('college', 'name')
    .populate('teacher', 'displayName email')
    .populate({
      path: 'facultyAssignments.faculty',
      select: 'displayName email'
    })
    .sort({ createdAt: -1 });
    
    // Add student status to each class
    const classesWithStatus = classes.map(cls => {
      const classObj = cls.toObject();
      const studentEntry = cls.students.find((s) => 
        s.student.toString() === studentId
      );
      
      return {
        ...classObj,
        studentStatus: studentEntry ? studentEntry.status : 'unknown'
      };
    });
    
    return classesWithStatus;
  } catch (error ) {
    console.error('Error getting classes by student:', error);
    throw error;
  }
}


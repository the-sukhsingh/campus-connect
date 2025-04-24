import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User';
import ClassModel from '@/models/Class';

// Get all classes for a student (both approved and pending)
export async function getClassesForStudent(studentId) {
  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new Error('Invalid student ID');
    }

    // Find student data
    const student = await UserModel.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // Find classes where the student exists in the students array
    const classes = await ClassModel.find({
      'students.student': student._id
    })
    .populate('createdBy', 'displayName email')
    .sort({ createdAt: -1 });

    // Add the status from the students array to each class
    return classes.map(classObj => {
      const classData = classObj.toObject();
      const studentEntry = classObj.students.find(s => 
        s.student.toString() === studentId
      );
      
      return {
        ...classData,
        status: studentEntry ? studentEntry.status : 'unknown'
      };
    });
  } catch (error) {
    console.error('Error fetching student classes:', error);
    throw error;
  }
}

// Join a class
export async function joinClass(studentId, classId) {
  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error('Invalid IDs');
    }

    // Find student and class
    const student = await UserModel.findById(studentId);
    const classObj = await ClassModel.findById(classId);

    if (!student) {
      throw new Error('Student not found');
    }

    if (!classObj) {
      throw new Error('Class not found');
    }

    // Check if already requested or joined
    const existingRequest = classObj.students.find(
      s => s.student.toString() === studentId
    );

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        throw new Error('You have already requested to join this class. Please wait for approval.');
      } else if (existingRequest.status === 'approved') {
        throw new Error('You are already enrolled in this class.');
      } else if (existingRequest.status === 'rejected') {
        throw new Error('Your previous request was rejected. Please contact your teacher.');
      }
    }

    // Add student to class with pending status
    classObj.students.push({
      student: new mongoose.Types.ObjectId(studentId),
      status: 'pending',
      joinRequestDate: new Date()
    });

    await classObj.save();
    
    return {
      _id: classObj._id,
      name: classObj.name,
      course: classObj.course,
      department: classObj.department,
      currentSemester: classObj.currentSemester,
      status: 'pending'
    };
  } catch (error) {
    console.error('Error joining class:', error);
    throw error;
  }
}
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import College from '@/models/College';
import { getCollegeByUniqueId } from './collegeService';

// Check teacher's college status
export async function getTeacherCollegeStatus(teacherId) {
  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new Error('Invalid teacher ID');
    }
    
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    
    // If teacher is not associated with any college
    if (!teacher.college) {
      return { college: null, status: null };
    }
    
    // Get college information
    const college = await College.findById(teacher.college);
    
    if (!college) {
      // Reset the college reference if college doesn't exist
      teacher.college = null;
      await teacher.save();
      return { college: null, status: null };
    }
    
    return { 
      college: {
        _id: college._id,
        name: college.name,
        code: college.code,
        domain: college.domain,
        uniqueId: college.uniqueId,
        department: teacher.department
      },
      status: college.verifiedTeachers.includes(teacher._id) ? 'approved' : teacher.collegeStatus || 'pending'
    };
  } catch (error) {
    console.error('Error getting teacher college status:', error);
    throw error;
  }
}

// Register a teacher with a college (pending HOD approval)
export async function registerTeacher(teacherId, collegeUniqueId) {
  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new Error('Invalid teacher ID');
    }
    
    // Find the college
    const college = await getCollegeByUniqueId(collegeUniqueId);
    if (!college) {
      throw new Error('College not found. Invalid college ID.');
    }
    
    // Find the teacher
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    
    // Check if teacher already registered with this college
    if (teacher.college) {
      const existingCollege = await College.findById(teacher.college);
      if (existingCollege) {
        if (existingCollege._id.toString() === college._id.toString()) {
          if (teacher.collegeStatus === 'pending') {
            throw new Error('Your request to join this college is already pending approval.');
          } else if (teacher.collegeStatus === 'approved') {
            throw new Error('You are already a member of this college.');
          } else if (teacher.collegeStatus === 'rejected') {
            // If previously rejected, allow them to submit another request
            teacher.collegeStatus = 'pending';
            college.pendingApproval = college.pendingApproval.filter((id) => id.toString() !== teacher._id.toString()) || [];
            college.pendingApproval.push(teacher._id);
            await college.save();
            await teacher.save();
            return teacher;
          }
        } else {
          throw new Error('You are already associated with another college.');
        }
      }
    }
    
    // Generate a unique faculty ID string if studentId is not already set
    // This helps avoid the duplicate key error with the compound index (college + studentId)
    if (!teacher.studentId) {
      // Generate a unique ID based on current timestamp and random suffix
      const timestamp = Date.now().toString(36);
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      teacher.studentId = `F${timestamp}${randomSuffix}`.toUpperCase();
    }
    
    // Associate teacher with college as pending
    teacher.college = college._id;
    teacher.collegeStatus = 'pending';
    teacher.pendingApproval = true;
    teacher.verificationMethod = 'hod';

    // Add teacher to college's pending teachers list
    if (!college.pendingApproval) {
      college.pendingApproval = [];
    }

    // Check if teacher is already in the pending list
    if (!college.pendingApproval.includes(teacher._id)) {
      college.pendingApproval.push(teacher._id);
    }
    await college.save();

    await teacher.save();
    
    return teacher;
  } catch (error) {
    console.error('Error registering teacher with college:', error);
    throw error;
  }
}

// Get pending teacher requests for a college
export async function getPendingTeachersByCollege(collegeId) {
  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      throw new Error('Invalid college ID');
    }
    
    const pendingTeachers = await User.find({
      college: collegeId,
      role: 'faculty',
      collegeStatus: 'pending'
    }).select('displayName email department collegeStatus createdAt');
    
    return pendingTeachers;
  } catch (error) {
    console.error('Error fetching pending teachers:', error);
    throw error;
  }
}

// Get approved teachers for a college
export async function getApprovedTeachersByCollege(collegeId) {
  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      throw new Error('Invalid college ID');
    }
    
    const approvedTeachers = await User.find({
      college: collegeId,
      role: 'faculty',
      collegeStatus: 'approved'
    }).select('displayName email department collegeStatus createdAt');
    
    return approvedTeachers;
  } catch (error) {
    console.error('Error fetching approved teachers:', error);
    throw error;
  }
}

// Update teacher's status in a college (approve or reject)
export async function updateTeacherStatus(teacherId, status) {
  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new Error('Invalid teacher ID');
    }
    
    // Find the teacher
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    
    if (!teacher.college) {
      throw new Error('Teacher is not associated with any college');
    }
    
    // Update the teacher's status
    teacher.collegeStatus = status;
    
    // If rejected, we could optionally clear the college reference
    if (status === 'rejected') {
      //TODO: Notify the teacher about rejection (if needed)
      teacher.college = null;
      // Keeping the college reference for audit purposes
      // but we could remove it if preferred
      // teacher.college = null;
    }
    
    await teacher.save();
    
    return { success: true, teacherId, status };
  } catch (error) {
    console.error('Error updating teacher status:', error);
    throw error;
  }
}
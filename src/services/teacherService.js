import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import College from '@/models/College';

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
        department: teacher.department
      },
      status: college.verifiedTeachers.includes(teacher._id) ? 'approved' : teacher.collegeStatus || 'pending'
    };
  } catch (error) {
    console.error('Error getting teacher college status:', error);
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


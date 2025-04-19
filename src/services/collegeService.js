import dbConnect from '@/lib/dbConnect';
import College from '@/models/College';
import UserModel from '@/models/User';
import mongoose from 'mongoose';
import { generateUniqueId } from '@/utils/helpers';

export async function getAllColleges() {
  try {
    await dbConnect();
    const colleges = await College.find({ active: true }).sort({ name: 1 });
    return colleges;
  } catch (error ) {
    console.error('Error fetching colleges:', error);
    throw error;
  }
}

export async function getAllCollegesAdmin() {
  try {
    await dbConnect();
    const colleges = await College.find().sort({ name: 1 });
    return colleges;
  } catch (error ) {
    console.error('Error fetching all colleges:', error);
    throw error;
  }
}

export async function getCollegeById(id) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid college ID');
    }
    
    const college = await College.findById(id);
    return college;
  } catch (error ) {
    console.error('Error fetching college by ID:', error);
    throw error;
  }
}

export async function getCollegeByCode(code) {
  try {
    await dbConnect();
    return await College.findOne({ code, active: true });
  } catch (error ) {
    console.error('Error fetching college by code:', error);
    throw error;
  }
}

export async function getCollegeByDomain(domain) {
  try {
    await dbConnect();
    const college = await College.findOne({ 
      domain: { $regex: domain, $options: 'i' },
      active: true
    });
    return college;
  } catch (error ) {
    console.error('Error fetching college by domain:', error);
    throw error;
  }
}

export async function isEmailFromCollege(email) {
  try {
    await dbConnect();
    
    if (!email || email.indexOf('@') === -1) {
      return null;
    }
    
    // Extract domain from email
    const domain = email.split('@')[1];
    
    // Find the college with this domain
    const college = await College.findOne({ 
      domain: { $regex: domain, $options: 'i' },
      active: true 
    });
    
    return college;
  } catch (error ) {
    console.error('Error checking email domain:', error);
    throw error;
  }
}

export async function createCollege(collegeData, hodId) {
  try {
    await dbConnect();
    
    // Validate required fields
    if (!collegeData.name || !collegeData.code || !collegeData.domain) {
      throw new Error('Name, code, and domain are required');
    }
    
    // Check if the HOD exists
    if (!mongoose.Types.ObjectId.isValid(hodId)) {
      throw new Error('Invalid HOD ID');
    }
    const hod = await UserModel.findById(hodId);
    if (!hod) {
      throw new Error('HOD not found');
    }
    
    // Create new college
    const newCollege = new College({
      name: collegeData.name,
      code: collegeData.code,
      domain: collegeData.domain,
      departments: collegeData.departments || [],
      hodId: collegeData.hodId || hodId, // Use provided hodId or fallback to the parameter
      uniqueId: collegeData.uniqueId || generateUniqueId(),
      verificationMethods: collegeData.verificationMethods || {
        emailDomain: true,
        inviteCode: false,
        adminApproval: false
      },
      active: collegeData.active !== undefined ? collegeData.active : true
    });
    
    await newCollege.save();
    
    // Update the HOD's college reference
    await UserModel.findByIdAndUpdate(hodId, { college: newCollege._id });
    
    return newCollege;
  } catch (error) {
    console.error('Error creating college:', error);
    
    // Check for duplicate key error
    if (error.code === 11000) {
      throw new Error('A college with this code already exists');
    }
    
    throw error;
  }
}

export async function updateCollege(id, collegeData) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid college ID');
    }
    
    // Create update object with only allowed fields
    const updateData = {
      name: collegeData.name,
      domain: collegeData.domain,
      departments: collegeData.departments,
      verificationMethods: collegeData.verificationMethods
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    // Update college
    const updatedCollege = await College.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedCollege) {
      throw new Error('College not found');
    }
    
    return updatedCollege;
  } catch (error ) {
    console.error('Error updating college:', error);
    throw error;
  }
}

export async function toggleCollegeStatus(id, active) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid college ID');
    }
    
    // Update college active status
    const updatedCollege = await College.findByIdAndUpdate(
      id,
      { $set: { active } },
      { new: true }
    );
    
    if (!updatedCollege) {
      throw new Error('College not found');
    }
    
    return updatedCollege;
  } catch (error ) {
    console.error('Error updating college status:', error);
    throw error;
  }
}

export async function getCollegeVerificationMethods(id) {
  try {
    await dbConnect();
    
    const college = await College.findById(id);
    if (!college) {
      throw new Error('College not found');
    }
    
    return college.verificationMethods;
  } catch (error ) {
    console.error('Error fetching college verification methods:', error);
    throw error;
  }
}

// Get college by unique ID (for teacher registration)
export async function getCollegeByUniqueId(uniqueId) {
  try {
    await dbConnect();
    const college = await College.findOne({ 
      uniqueId, 
      active: true 
    });
    return college;
  } catch (error ) {
    console.error('Error fetching college by unique ID:', error);
    throw error;
  }
}

// Register as a HOD (pending admin approval)
export async function registerHOD(userId, collegeId, department) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    
    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      throw new Error('Invalid college ID');
    }
    
    // Find the user
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if college exists
    const college = await College.findById(collegeId);
    if (!college) {
      throw new Error('College not found');
    }
    
    // Update user status
    user.college = new mongoose.Types.ObjectId(collegeId);
    user.department = department;
    user.role = 'hod';
    user.pendingApproval = true; // Requires admin approval
    
    await user.save();
    
    return {
      success: true,
      message: 'HOD registration submitted. Waiting for admin approval.'
    };
  } catch (error ) {
    console.error('Error registering HOD:', error);
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
    const teacher = await UserModel.findById(teacherId);
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
            throw new Error('Your request to join this college was rejected. Please contact the HOD.');
          }
        } else {
          throw new Error('You are already associated with another college.');
        }
      }
    }
    
    college.pendingApproval = college.pendingApproval || [];

    // Add teacher to pending teachers list
    if (!college.pendingApproval.includes(teacher._id)) {
      college.pendingApproval.push(teacher._id);
    }
    
    // Associate teacher with college as pending
    teacher.college = college._id;
    teacher.pendingApproval = true; // Requires HOD approval
    teacher.collegeStatus = 'pending'; // Set status to pending

    await college.save();
    await teacher.save();
    
    return {
      success: true,
      message: 'Teacher registration submitted. Waiting for HOD approval.',
      teacher
    };
  } catch (error ) {
    console.error('Error registering teacher with college:', error);
    throw error;
  }
}

// Get all teachers by college (approved only)
export async function getTeachersByCollege(collegeId) {
  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      throw new Error('Invalid college ID');
    }
    
    const college = await College.findById(collegeId)
    if (!college) {
      throw new Error('College not found');
    }

    const verifiedTeacherIds = college.verifiedTeachers || [];

    let verifiedTeachers = [];

    if (verifiedTeacherIds.length > 0) {
     for (const teacherId of verifiedTeacherIds) {
        const teacher = await UserModel.findById(teacherId)
          .select('displayName email department createdAt collegeStatus role')
          .lean();
        if (teacher) {
          verifiedTeachers.push(teacher);
        }
      }
    }

    

    if (!verifiedTeachers) {
      throw new Error('No teachers found for this college');
    }


    return verifiedTeachers;
  } catch (error ) {
    console.error('Error fetching teachers by college:', error);
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


    const college = await College.findById(collegeId)



    if (!college) {
      throw new Error('College not found');
    }

    const pendingTeachersIds = college.pendingApproval || [];
      
    let pendingTeachers = [];

    for (const teacherId of pendingTeachersIds) {
      const teacher = await UserModel.findById(teacherId)
        .select('displayName email department createdAt')
        .lean();
      if (teacher) {
        pendingTeachers.push(teacher);
      }
    }

    
    return pendingTeachers;
  } catch (error ) {
    console.error('Error fetching pending teachers:', error);
    throw error;
  }
}

// Update teacher's status in a college (approve or reject)
export async function updateTeacherStatus(
  collegeId,
  teacherId,
  status,
  department,
  isLibrarian
) {
  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(collegeId) || !mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new Error('Invalid IDs');
    }
    
    // Verify college exists
    const college = await College.findById(collegeId);
    if (!college) {
      throw new Error('College not found');
    }
    
    // Find the teacher
    const teacher = await UserModel.findById(teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    
    // Check if teacher is associated with this college
    if (!teacher.college || teacher.college.toString() !== collegeId) {
      throw new Error('Teacher is not associated with this college');
    }
    
    // Update teacher status
    if (status === 'approve') {
      // Validate department if approving
      if (department) {
        if (college.departments && college.departments.length > 0 && !college.departments.includes(department)) {
          throw new Error('Invalid department for this college');
        }
        teacher.department = department; // Set the department
      }
      
      teacher.pendingApproval = false; // Remove pending approval status
      teacher.collegeStatus = 'approved'; // Set status to approved
      teacher.isVerified = true; // Mark as verified
      
      // Set role as librarian if requested
      if (isLibrarian === true) {
        teacher.role = 'librarian';
      } else {
        teacher.role = 'faculty';
      }
      
      college.verifiedTeachers = college.verifiedTeachers || [];
      if (!college.verifiedTeachers.includes(teacher._id)) {
        college.verifiedTeachers.push(teacher._id); // Add to verified teachers
      }
      // Remove from pending teachers list
      college.pendingApproval = college.pendingApproval.filter((id) => id.toString() !== teacherId);
    } else if (status === 'reject') {
      teacher.pendingApproval = false; // Remove pending approval status
      teacher.collegeStatus = 'rejected'; // Set status to rejected
      teacher.college = null; // Remove college association
      // Remove from pending teachers list
      college.pendingApproval = college.pendingApproval.filter((id) => id.toString() !== teacherId);
    }
    
    await college.save();
    await teacher.save();
    
    return { 
      success: true, 
      teacherId, 
      status, 
      department: teacher.department,
      role: teacher.role 
    };
  } catch (error ) {
    console.error('Error updating teacher status:', error);
    throw error;
  }
}

// Get pending teacher approvals for a HOD
export async function getPendingTeachersForHOD(collegeId) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      throw new Error('Invalid college ID');
    }
    
    const pendingTeachers = await UserModel.find({
      college: new mongoose.Types.ObjectId(collegeId),
      role: 'teacher',
      pendingApproval: true
    }).select('displayName email department createdAt');
    
    return pendingTeachers;
  } catch (error ) {
    console.error('Error fetching pending teachers:', error);
    throw error;
  }
}

export async function getCollegeByUser(userId) {
  try {
    await dbConnect();
    
    const query = mongoose.Types.ObjectId.isValid(userId) 
      ? { $or: [{ _id: userId }, { firebaseUid: userId }] }
      : { firebaseUid: userId };
    const user = await UserModel.findOne(query);
    if (!user) {
      throw new Error('User not found');
    }
    
    // For HOD, use the direct link
    if (user.role === 'hod') {
      const college = await College.findOne({ hodId: user.firebaseUid });
      return college;
    }
    
    // For faculty and other roles, check if they have a college reference
    if (user.college) {
      const college = await College.findById(user.college);
      return college;
    }
    
    return null;
  } catch (error ) {
    console.error('Error fetching college for user:', error);
    throw error;
  }
}
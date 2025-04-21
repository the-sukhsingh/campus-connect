import dbConnect from '@/lib/dbConnect';
import College from '@/models/College';
import UserModel from '@/models/User';
import mongoose from 'mongoose';

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
// Server-side user service
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User';
import { isEmailFromCollege } from './collegeService';
import { Types } from 'mongoose';
import { auth } from 'firebase-admin';
import { unregisterUserFromAllEvents } from './eventService'

export async function saveUserToDb(user) {

  try {
    await dbConnect();

    // Check if user already exists in the database
    const existingUser = await UserModel.findOne({ firebaseUid: user?.uid });

    // If user exists, simply return
    if (existingUser) {
      return existingUser;
    }

    // Check if the user's email domain matches a college
    const college = await isEmailFromCollege(user.email || '');

    let isVerified = false;
    let verificationMethod = null;
    let pendingApproval = false;
    let collegeId = null;

    // If college found and it uses email domain verification
    if (college && college.verificationMethods.emailDomain) {
      isVerified = true;
      verificationMethod = 'domain';
      collegeId = college._id;
    } else if (college && college.verificationMethods.adminApproval) {
      // College requires admin approval
      pendingApproval = true;
      collegeId = college._id;
    }

    // Create a new user with default role
    const newUser = new UserModel({
      firebaseUid: user?.uid,
      email: user.email?.toLowerCase(),
      displayName: user.displayName,
      role: 'student',
      college: collegeId,
      isVerified,
      verificationMethod,
      collegeStatus: 'notlinked',
      pendingApproval,
    });

    await newUser.save();
    return newUser;
  } catch (error ) {
    console.error('Error saving user to database:', error);
    throw error;
  }
}

export async function getUserByFirebaseUid(uid) {

  try {
    await dbConnect();

    const user = await UserModel.findOne({ firebaseUid: uid });
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error ) {
    console.error('Error fetching user from database:', error);
    throw error;
  }
}

export async function getUserByEmail(email) {
  try {
    await dbConnect();
    const user = await UserModel.findOne({ email: email.toLowerCase() }).populate('college');
    return user;
  } catch (error ) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

export async function getUserById(id) {

  try {
    await dbConnect();
    const user = await UserModel.findById(id).populate('college');
    return user;
  } catch (error ) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
}

export async function getUsersByCollege(collegeId, role) {

  try {
    await dbConnect();
    const query = { college: new Types.ObjectId(collegeId) };
    if (role) {
      (query).role = role;
    }
    const users = await UserModel.find(query).populate('college');
    return users;
  } catch (error ) {
    console.error('Error fetching users by college:', error);
    throw error;
  }
}

export async function getPendingApprovalUsers(collegeId) {
  try {
    await dbConnect();
    const users = await UserModel.find({
      college: collegeId,
      pendingApproval: true,
      isVerified: false
    });
    return users;
  } catch (error ) {
    console.error('Error fetching pending approval users:', error);
    throw error;
  }
}

export async function updateUserProfile(id, userData) {
  try {
    await dbConnect();

    // Only allow updating safe fields
    const safeData = {
      displayName: userData.displayName,
      department: userData.department,
      currentSemester: userData.currentSemester,
      batch: userData.batch,
      rollNo: userData.rollNo || '',
      studentId: userData.studentId || '',
    };

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: safeData },
      { new: true }
    );

    return updatedUser;
  } catch (error ) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function updateUserRole(id, role, updatedById) {
  try {
    await dbConnect();

    // Check if the updating user is an admin
    const updatingUser = await UserModel.findById(updatedById);
    if (!updatingUser || updatingUser.role !== 'hod') {
      throw new Error('Only admins can update roles');
    }

    // Update the user's role
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true }
    );

    return updatedUser;
  } catch (error ) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

export async function approveUser(userId, role, approverUserId) {
  try {
    await dbConnect();

    // Check if the approver is an admin
    const approver = await UserModel.findById(approverUserId);
    if (!approver || approver.role !== 'hod') {
      throw new Error('Only admins can approve users');
    }

    // Update the user's status
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          isVerified: true,
          verificationMethod: 'hod',
          pendingApproval: false,
          role
        }
      },
      { new: true }
    );

    return updatedUser;
  } catch (error ) {
    console.error('Error approving user:', error);
    throw error;
  }
}

export async function rejectUser(userId, approverUserId) {
  try {
    await dbConnect();

    // Check if the approver is an admin
    const approver = await UserModel.findById(approverUserId);
    if (!approver || approver.role !== 'hod') {
      throw new Error('Only admins can reject users');
    }

    // Delete the user from our database
    // Note: This does not remove the Firebase auth account
    await UserModel.findByIdAndDelete(userId);

    return true;
  } catch (error ) {
    console.error('Error rejecting user:', error);
    throw error;
  }
}

export async function linkStudentWithCollege(userId, collegeId, studentId, department) {
  try {
    await dbConnect();

    // Check if the studentId is already linked to another user in the same college
    const existingUser = await UserModel.findOne({
      college: collegeId,
      studentId,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return {
        success: false,
        message: 'Student ID is already linked to another account'
      };
    }

    // Update the user
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          college: new Types.ObjectId(collegeId),
          studentId,
          department,
          role: 'student'
        }
      },
      { new: true }
    ).populate('college');

    return {
      success: true,
      user: updatedUser,
      message: 'Successfully linked with college'
    };
  } catch (error) {
    console.error('Error linking student with college:', error);

    // Check for duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      return {
        success: false,
        message: 'Student ID is already linked to another account'
      };
    }

    throw error;
  }
}

export async function deleteUser(userId){
  try {
    await dbConnect();


    // Check if the user exists

    const user = await UserModel.findById(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Delete the Firebase auth account

    // Delete the user from our database
    // Note: This does not remove the Firebase auth account
    
    await auth.deleteUser(user.firebaseUid).catch(error => {
      console.error('Error deleting user from Firebase:', error);
    });
    
    // Cancel any event registrations associated with the user
    await unregisterUserFromAllEvents(userId);
    
    await UserModel.findByIdAndDelete(userId);


    return {
      success: true,
      message: 'User has been deleted successfully'
    };
  } catch (error ) {
    console.error('Error deleting user:', error);
    throw error;
  }
}
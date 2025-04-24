import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User';
import { isEmailFromCollege } from '@/services/collegeService';

export async function POST(req) {
  try {
    await dbConnect();
    
    const data = await req.json();

    const timestamp = Date.now().toString(36);
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    
    // Handle both standard requests and firebaseUser object format
    const firebaseUid = data.firebaseUid || data.firebaseUser?.uid;
    const email = data.email || data.firebaseUser?.email;
    const displayName = data.displayName || data.firebaseUser?.displayName;
    const role = data.role || 'user'; // Default role
    
    if (!firebaseUid) {
      return NextResponse.json({ 
        success: false,
        message: 'Firebase UID is required'
      }, { status: 400 });
    }
    
    // Check if user already exists in the database
    let user = await UserModel.findOne({ firebaseUid });
    
    if (user) {
      // Update existing user if role is not already set
      if (!user.role || user.role === 'user') {
        user.role = role;
        await user.save();
      }
      
      return NextResponse.json({ 
        success: true, 
        user,
        message: 'User found and returned'
      });
    }
    
    // Check if the user's email domain matches a college
    const college = email ? await isEmailFromCollege(email) : null;

    let isVerified = true; // Auto-verify all users
    let verificationMethod = null;
    let collegeId = null;

    // If college found, associate user with it
    if (college) {
      verificationMethod = 'domain';
      collegeId = college._id;
    }

    // Create a new user
    user = new UserModel({
      firebaseUid,
      email: email?.toLowerCase(),
      displayName,
      role,
      isVerified,
      verificationMethod,
      studentId: `${timestamp}-${randomSuffix}`,
      college: collegeId
    });
    
    await user.save();
    
    return NextResponse.json({ 
      success: true, 
      user,
      message: 'User created successfully' 
    });
    
  } catch (error) {
    console.error('Error in user API:', error);
    
    // Check for duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      return NextResponse.json({ 
        success: false, 
        message: 'A user with this information already exists'
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'An error occurred while creating/updating the user'
    }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);

    const firebaseUid = searchParams.get('firebaseUid');
    const email = searchParams.get('email');
    
    if (!firebaseUid && !email) {
      return NextResponse.json({ 
        success: false,
        message: 'Firebase UID or email is required'
      }, { status: 400 });
    }

    // If email is provided, decode and convert it to lowercase
    const decodedEmail = decodeURIComponent(email || '');
    const emailToLower = decodedEmail.toLowerCase();
    
    const user = await UserModel.findOne(
      { 
        ...(firebaseUid ? { firebaseUid } : {}), 
        ...(email ? { email: emailToLower } : {}) 
      }
    ).populate('college');
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      user
    });
    
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'An error occurred while fetching the user'
    }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    
    const data = await req.json();
    const { firebaseUid, targetUserId, ...updateData } = data;
    
    if (!firebaseUid) {
      return NextResponse.json({ 
        success: false,
        message: 'Firebase UID is required'
      }, { status: 400 });
    }
    
    // Remove unsafe fields from updateData
    const safeUpdateData = {
      displayName: updateData.displayName,
      department: updateData.department,
      semester: updateData.currentSemester,
      batch: updateData.batch,
      role: updateData.role,
      rollNo: updateData.rollNo,
      studentId: updateData.studentId,
    };
    
    const user = await UserModel.findOneAndUpdate(
      { _id: targetUserId },
      { $set: safeUpdateData },
      { new: true }
    ).populate('college');
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      user,
      message: 'User updated successfully'
    });
    
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'An error occurred while updating the user'
    }, { status: 500 });
  }
}
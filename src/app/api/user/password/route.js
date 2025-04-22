import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User';

export async function POST(req) {
  try {
    await dbConnect();
    
    const data = await req.json();
    const { uid, newPassword } = data;
    
    if (!uid) {
      return NextResponse.json({ 
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }
    
    // Find the user by Firebase UID
    const user = await UserModel.findOne({ firebaseUid: uid });
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Update the user record to mark password as changed
    user.passwordChanged = true;
    user.isFirstLogin = false; // Set to false if you want to allow the user to log in again
    await user.save();
    
    return NextResponse.json({ 
      success: true,
      message: 'Password status updated successfully',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        passwordChanged: user.passwordChanged
      }
    });
    
  } catch (error) {
    console.error('Error updating password status:', error);
    return NextResponse.json({ 
      success: false,
      message: error.message || 'An error occurred while updating password status'
    }, { status: 500 });
  }
}
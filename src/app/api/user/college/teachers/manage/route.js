import { NextResponse } from "next/server";
import { getUserByFirebaseUid } from "@/services/userService";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import College from "@/models/College";
import mongoose from "mongoose";
import { auth } from "@/config/firebaseAdmin";

// PATCH: Update teacher details
export async function PATCH(request) {
  try {
    const data = await request.json();
    const { firebaseUid, teacherId, updates } = data;
    
    if (!firebaseUid || !teacherId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify user is HOD
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user || user.role !== 'hod') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    // Find the teacher to update
    const teacher = await UserModel.findById(teacherId);
    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }
    
    // Verify teacher belongs to HOD's college
    if (!teacher.college || !user.college || 
        teacher.college.toString() !== user.college.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized. Teacher does not belong to your college' },
        { status: 403 }
      );
    }

    // Apply allowed updates
    const allowedUpdates = {
      displayName: updates.displayName,
      department: updates.department,
      isLibrarian: updates.isLibrarian
    };

    // Filter out undefined fields
    Object.keys(allowedUpdates).forEach(key => 
      allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    // Update role if librarian status is changed
    if (allowedUpdates.isLibrarian !== undefined) {
      teacher.role = allowedUpdates.isLibrarian ? 'librarian' : 'faculty';
      delete allowedUpdates.isLibrarian;
    }

    // Update other fields
    Object.assign(teacher, allowedUpdates);
    await teacher.save();

    return NextResponse.json({ 
      success: true, 
      teacher,
      message: 'Teacher updated successfully'
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update teacher' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a teacher
export async function DELETE(request) {
  try {
    const data = await request.json();
    const { firebaseUid, teacherId } = data;
    
    if (!firebaseUid || !teacherId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify user is HOD
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user || user.role !== 'hod') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    // Find the teacher to delete
    const teacher = await UserModel.findById(teacherId);
    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }
    
    // Verify teacher belongs to HOD's college
    if (!teacher.college || !user.college || 
        teacher.college.toString() !== user.college.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized. Teacher does not belong to your college' },
        { status: 403 }
      );
    }

    // Get firebase UID to delete the account from Firebase Auth
    const teacherFirebaseUid = teacher.firebaseUid;
    
    // Remove from the college's verified teachers list
    if (teacher.college) {
      const college = await College.findById(teacher.college);
      if (college && college.verifiedTeachers) {
        college.verifiedTeachers = college.verifiedTeachers.filter(
          id => id.toString() !== teacherId.toString()
        );
        await college.save();
      }
    }
    
    // Delete the teacher from MongoDB
    await UserModel.findByIdAndDelete(teacherId);
    
    // Delete the user from Firebase Authentication
    if (teacherFirebaseUid) {
      await auth.deleteUser(teacherFirebaseUid).catch(error => {
        console.error('Error deleting teacher from Firebase:', error);
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Teacher removed successfully'
    });
  } catch (error) {
    console.error('Error removing teacher:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove teacher' },
      { status: 500 }
    );
  }
}
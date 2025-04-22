import { NextResponse } from "next/server";
import { getClassById, deleteClass } from "@/services/classService";
import { getUserByFirebaseUid } from "@/services/userService";
import dbConnect from "@/lib/dbConnect";
import Class from "@/models/Class";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const classId = (await params).id;

    if (!uid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists and is a teacher or HOD
    const user = await getUserByFirebaseUid(uid);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role !== "faculty" && user.role !== "hod") {
      return NextResponse.json(
        { error: "Unauthorized. Only teachers can access this endpoint" },
        { status: 403 }
      );
    }

    // Get the class data
    const classData = await getClassById(classId);
    
    return NextResponse.json({ class: classData });
  } catch (error) {
    console.error("Error fetching class data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch class data" },
      { status: 500 }
    );
  }
}

// PATCH: Update class details
export async function PATCH(request, { params }) {
  try {
    const classId = (await params).id;
    const { firebaseUid, updateData } = await request.json();
    
    if (!firebaseUid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    if (!updateData) {
      return NextResponse.json(
        { error: "Update data is required" },
        { status: 400 }
      );
    }
    
    // Check if user exists and is a teacher or HOD
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role !== "faculty" && user.role !== "hod") {
      return NextResponse.json(
        { error: "Unauthorized. Only teachers can update classes" },
        { status: 403 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Check if class exists
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return NextResponse.json(
        { error: "Invalid class ID" },
        { status: 400 }
      );
    }

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // Check if the user is the class owner
    if (classObj.teacher.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "Unauthorized. Only the class creator can update this class" },
        { status: 403 }
      );
    }

    // Update all allowed fields
    const allowedUpdates = {
      name: updateData.name,
      course: updateData.course, 
      department: updateData.department,
      semester: updateData.semester,
      batch: updateData.batch
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(
      key => allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    // Update class
    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { $set: allowedUpdates },
      { new: true }
    );

    if (!updatedClass) {
      return NextResponse.json(
        { error: "Failed to update class" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Class updated successfully",
      class: updatedClass
    });

  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update class" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a class
export async function DELETE(request, { params }) {
  try {
    const classId = (await params).id;
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get("uid");

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists and is a teacher or HOD
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role !== "faculty" && user.role !== "hod") {
      return NextResponse.json(
        { error: "Unauthorized. Only teachers can delete classes" },
        { status: 403 }
      );
    }

    // Delete the class and handle references cleanup
    const result = await deleteClass(classId, user._id);

    return NextResponse.json({
      success: true,
      message: "Class deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete class" },
      { status: 500 }
    );
  }
}
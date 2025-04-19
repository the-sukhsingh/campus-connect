import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Class from "@/models/Class";
import { Types } from "mongoose";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const classId = searchParams.get('classId');

    if (!uid || !classId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify the user exists and is a faculty member
    const user = await User.findOne({ firebaseUid: uid, role: { $in: ['faculty', 'hod'] } });
    if (!user) {
      return NextResponse.json(
        { error: "User not found or not authorized" },
        { status: 404 }
      );
    }

    // Find the class and populate faculty assignments
    const classData = await Class.findById(classId)
      .populate({
        path: 'facultyAssignments.faculty',
        select: '_id firebaseUid email displayName'
      })
      .populate({
        path: 'facultyAssignments.assignedBy',
        select: '_id firebaseUid email displayName'
      })
      .populate('teacher', '_id firebaseUid email displayName')
      .populate('college');

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // Check if user is the class owner (teacher) or is assigned to this class
    const isClassOwner = classData.teacher && 
      classData.teacher._id.toString() === user._id.toString();

    const isAssignedFaculty = classData.facultyAssignments &&
      classData.facultyAssignments.some(
        (assignment) => assignment.faculty && 
        assignment.faculty._id.toString() === user._id.toString()
      );

    if (!isClassOwner && !isAssignedFaculty) {
      return NextResponse.json(
        { error: "You do not have permission to access this class" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      class: classData,
      isClassOwner
    });
  } catch (error) {
    console.error("Error fetching faculty assignments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch faculty assignments" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    const { firebaseUid, classId, facultyId, subject } = data;

    if (!firebaseUid || !classId || !facultyId || !subject) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify the user exists and is a faculty member
    const user = await User.findOne({ firebaseUid, role: { $in: ['faculty', 'hod'] } });
    if (!user) {
      return NextResponse.json(
        { error: "User not found or not authorized" },
        { status: 404 }
      );
    }

    // Find the class
    const classData = await Class.findById(classId).populate('teacher');
    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // Check if user is the class owner (teacher)
    if (!classData.teacher || classData.teacher._id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "Only the class creator can assign faculty members" },
        { status: 403 }
      );
    }

    // Find the faculty to be assigned
    const facultyToAssign = await User.findOne({ 
      _id: facultyId,
      role: { $in: ['faculty', 'hod'] },
      college: classData.college
    });

    if (!facultyToAssign) {
      return NextResponse.json(
        { error: "Faculty member not found or not in the same college" },
        { status: 404 }
      );
    }

    // Check if faculty is already assigned to this subject
    const existingAssignment = classData.facultyAssignments?.find(
      (assignment) => 
        assignment.subject === subject && 
        assignment.faculty.toString() === facultyToAssign._id.toString()
    );

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Faculty is already assigned to this subject" },
        { status: 400 }
      );
    }

    // Create a new faculty assignment
    const newAssignment = {
      _id: new Types.ObjectId(),
      faculty: facultyToAssign._id,
      subject,
      assignedBy: user._id,
      assignedAt: new Date()
    };

    // Add the assignment to the class
    if (!classData.facultyAssignments) {
      classData.facultyAssignments = [];
    }
    
    classData.facultyAssignments.push(newAssignment);
    await classData.save();

    return NextResponse.json({
      message: "Faculty assigned successfully",
      assignment: newAssignment
    });
  } catch (error) {
    console.error("Error assigning faculty:", error);
    return NextResponse.json(
      { error: error.message || "Failed to assign faculty" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const classId = searchParams.get('classId');
    const assignmentId = searchParams.get('assignmentId');

    if (!uid || !classId || !assignmentId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    
    // Verify the user exists and is a faculty member
    const user = await User.findOne({ firebaseUid: uid, role: { $in: ['faculty', 'hod'] } });
    if (!user) {
      return NextResponse.json(
        { error: "User not found or not authorized" },
        { status: 404 }
      );
    }
    
    // Find the class
    const classData = await Class.findById(classId).populate('teacher');
    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }
    
    const assignmentIdObj = classData.facultyAssignments?.find(
      (assignment) => assignment._id.toString() === assignmentId
    );

    if (!assignmentIdObj) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }


    // Check if user is the class owner (teacher)
    if (!classData.teacher || classData.teacher._id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "Only the class creator can remove faculty assignments" },
        { status: 403 }
      );
    }

    // Find the assignment index
    const assignmentIndex = classData.facultyAssignments?.findIndex(
      (assignment) => assignment._id.toString() === assignmentId
    );

    if (assignmentIndex === -1 || assignmentIndex === undefined) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Remove the assignment
    classData.facultyAssignments.splice(assignmentIndex, 1);
    await classData.save();

    return NextResponse.json({
      message: "Faculty assignment removed successfully"
    });
  } catch (error) {
    console.error("Error removing faculty assignment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove faculty assignment" },
      { status: 500 }
    );
  }
}
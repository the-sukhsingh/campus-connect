import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { getClassById } from '@/services/classService';
import UserModel from '@/models/User';
import { auth } from '@/config/firebaseAdmin';

// GET: Fetch pending student requests for a class
export async function GET(request) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    const classId = request.nextUrl.searchParams.get('classId');
    const status = request.nextUrl.searchParams.get('status') || 'pending';

    if (!uid || !classId) {
      return NextResponse.json(
        { error: 'User ID and Class ID are required' },
        { status: 400 }
      );
    }

    const user = await getUserByFirebaseUid(uid);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'faculty' && user.role !== 'hod') {
      return NextResponse.json(
        { error: 'Unauthorized. Only teachers can view student requests' },
        { status: 403 }
      );
    }

    // Get class info to verify teacher is associated with the class
    const classInfo = await getClassById(classId);
    if (!classInfo) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if teacher is associated with this class
    if (classInfo.teacher._id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized. You are not the teacher for this class' },
        { status: 403 }
      );
    }

    // Get student requests for this class with the specified status
    const students = await getStudentRequestsForClass(classId, status);
    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error('Error fetching student requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch student requests' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {

    const { firebaseUid, classId, studentId } = await request.json();

    if (!firebaseUid || !classId || !studentId) {
      return NextResponse.json(
        { error: 'User ID, Class ID, and Student ID are required' },
        { status: 400 }
      );
    }

    const user = await getUserByFirebaseUid(firebaseUid);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const classInfo = await getClassById(classId);

    if (!classInfo) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if teacher is associated with this class
    if (classInfo.teacher._id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized. You are not the teacher for this class' },
        { status: 403 }
      );
    }

    // Check if the student is in the class
    const studentRequest = classInfo.students.find(
      (request) => request.student.toString() === studentId
    );
    if (!studentRequest) {
      return NextResponse.json(
        { error: 'Student not found in this class' },
        { status: 404 }
      );
    }

    // Remove the student request from the class
    classInfo.students = classInfo.students.filter(
      (request) => request.student.toString() !== studentId
    );

    await classInfo.save();


    const student = await UserModel.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentFirebaseUid = student.firebaseUid;

    // Delete the student
    await UserModel.findByIdAndDelete(studentId);

    // Delete the student from firebase
    await auth.deleteUser(studentFirebaseUid).catch((error) => {
      console.error('Error deleting user from Firebase:', error);
      return NextResponse.json(
        { error: 'Failed to delete user from Firebase' },
        { status: 500 }
      );
    });

    

    console.log(`Student with ID ${studentId} deleted successfully.`);

    return NextResponse.json({ success: true, message: 'Student request deleted successfully' });


  } catch (error) {
    console.error('Error deleting student request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete student request' },
      { status: 500 }
    );
  }
}
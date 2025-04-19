import { NextResponse } from 'next/server';
import { requestBookReturn } from '@/services/bookBorrowingService';
import { getUserByFirebaseUid } from '@/services/userService';

export async function PUT(
  request,
  { params }) {
  try {
    const borrowingId = (await params).id;
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(uid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Faculty, students, HODs, and librarians can request returns for their books
    if (!['student', 'faculty', 'librarian', 'hod'].includes(dbUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized to request book returns' },
        { status: 403 }
      );
    }

    // Request book return
    const borrowing = await requestBookReturn(borrowingId, dbUser._id.toString());

    return NextResponse.json({
      success: true,
      message: 'Return request submitted successfully',
      borrowing,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to request book return' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';

export async function GET(request, { params }) {
  try {
    const { uid } = await params;
    const user = await getUserByFirebaseUid(uid);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
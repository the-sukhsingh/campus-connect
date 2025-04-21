import { NextResponse } from 'next/server';
import { getRooms, createRoom, updateRoom, deleteRoom, getRoomById } from '@/services/roomService';
import { getUserByFirebaseUid } from '@/services/userService';

export async function GET(request) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    let collegeId = searchParams.get('collegeId');
    const firebaseUid = searchParams.get('uid');
    const action = searchParams.get('action');
    const roomId = searchParams.get('roomId');

    let dbUser;

    if(firebaseUid) {
        dbUser = await getUserByFirebaseUid(firebaseUid);
    }

    // If action is get-room, get a specific room by ID
    if (action === 'get-room' && roomId) {
      const room = await getRoomById(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }
      return NextResponse.json({ room });
    }

    // For regular GET requests without specific room ID
    if (!collegeId) {
        collegeId = dbUser?.college || null;
    }

    console.log("collegeId", collegeId);
    // Get rooms, optionally filtered by collegeId
    const rooms = await getRooms(collegeId);
    
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { firebaseUid, ...roomData } = body;
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if the user is a HOD
    if (dbUser.role !== 'hod') {
      return NextResponse.json({ error: 'Unauthorized. Only HODs can create rooms' }, { status: 403 });
    }
    
    // Check if collegeId is present in the roomData
    if (!roomData.collegeId) {
      roomData.collegeId = dbUser.college;
    }
    
    // Create the room
    const room = await createRoom(roomData);
    
    return NextResponse.json(room);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { firebaseUid, id, ...roomData } = body;
    
    if (!firebaseUid || !id) {
      return NextResponse.json({ error: 'User ID and Room ID are required' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if the user is a HOD
    if (dbUser.role !== 'hod') {
      return NextResponse.json({ error: 'Unauthorized. Only HODs can update rooms' }, { status: 403 });
    }
    
    // Update the room
    const updatedRoom = await updateRoom(id, roomData);
    
    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const firebaseUid = searchParams.get('uid');
    
    if (!id || !firebaseUid) {
      return NextResponse.json({ error: 'Room ID and User ID are required' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if the user is a HOD
    if (dbUser.role !== 'hod') {
      return NextResponse.json({ error: 'Unauthorized. Only HODs can delete rooms' }, { status: 403 });
    }
    
    // Delete the room
    await deleteRoom(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
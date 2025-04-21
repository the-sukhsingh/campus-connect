import { NextResponse } from 'next/server';
import { getRoomById, updateRoom, deleteRoom } from '@/services/roomService';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const room = await getRoomById(id);
    
    return NextResponse.json(room);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch room' }, { status: error.message === 'Room not found' ? 404 : 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const roomData = await request.json();
    
    // Update room data
    const updatedRoom = await updateRoom(id, roomData);
    
    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update room' }, 
      { status: error.message === 'Room not found' ? 404 : 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Delete the room
    await deleteRoom(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete room' }, 
      { status: error.message === 'Room not found' ? 404 : 500 }
    );
  }
}
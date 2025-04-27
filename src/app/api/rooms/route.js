import { NextResponse } from 'next/server';
import { getRooms, createRoom, updateRoom, deleteRoom, getRoomById } from '@/services/roomService';
import { getUserByFirebaseUid } from '@/services/userService';
import dbConnect from '@/lib/dbConnect';
import Room from '@/models/Room';
import { generateSasUrl } from '@/services/azureStorageService';

export async function GET(request) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    let collegeId = searchParams.get('collegeId');
    const firebaseUid = searchParams.get('uid');
    const action = searchParams.get('action');
    const roomId = searchParams.get('roomId');
    const building = searchParams.get('building');
    const type = searchParams.get('type');
    const capacity = searchParams.get('capacity');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

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
      
      // Add viewUrl if the room has an image
      if (room.imageUrl) {
        try {
          room.viewUrl = await generateSasUrl(room.imageUrl);
        } catch (error) {
          console.error('Error generating SAS URL for room image:', error);
          // Continue without viewUrl if there's an error
        }
      }
      
      return NextResponse.json({ room });
    }
    
    // If action is get-buildings, return unique building names
    if (action === 'get-buildings') {
      await dbConnect();
      const collegeFilter = dbUser?.college ? { collegeId: dbUser.college } : {};
      const buildings = await Room.distinct('building', collegeFilter);
      return NextResponse.json({ buildings });
    }
    
    // If action is get-room-types, return unique room types
    if (action === 'get-room-types') {
      await dbConnect();
      const collegeFilter = dbUser?.college ? { collegeId: dbUser.college } : {};
      
      // Get all standard room types
      const standardRoomTypes = await Room.distinct('type', collegeFilter);
      
      // Get all rooms with 'other' type that have otherType values
      const otherRooms = await Room.find({ 
        ...collegeFilter, 
        type: 'other',
        otherType: { $exists: true, $ne: '' }
      }).select('otherType').lean();
      
      // Create a set of unique room types, including otherType values
      const roomTypesSet = new Set(standardRoomTypes);
      
      // Add otherType values to the set
      otherRooms.forEach(room => {
        if (room.otherType) {
          roomTypesSet.add(room.otherType);
        }
      });
      
      // Convert set back to array
      const roomTypes = Array.from(roomTypesSet);
      
      return NextResponse.json({ roomTypes });
    }

    // For regular GET requests without specific room ID
    if (!collegeId) {
        collegeId = dbUser?.college || null;
    }

    // Build the query for filtering
    let query = collegeId ? { collegeId } : {};
    
    // Apply additional filters if provided
    if (building) query.building = building;
    
    // Special handling for room type filtering
    if (type) {
      // Check if the type matches a standard room type
      const isStandardType = ['classroom', 'laboratory', 'conference', 'auditorium', 'other'].includes(type);
      
      if (isStandardType) {
        // If it's a standard type, filter directly by type
        query.type = type;
      } else {
        // If it's not a standard type, it might be a custom room type (otherType)
        query.$or = [
          { type: type }, // Still try to match against type (legacy data)
          { type: 'other', otherType: type } // Match against otherType field
        ];
      }
    }
    
    if (capacity) query.capacity = { $gte: parseInt(capacity) };
    
    if (search) {
      // If we already have an $or condition (from type filtering)
      if (query.$or) {
        // Create a new $and condition to combine with existing $or
        query.$and = [
          { $or: query.$or }, // Include existing $or condition
          { $or: [
            { name: { $regex: search, $options: 'i' } },
            { building: { $regex: search, $options: 'i' } },
            { otherType: { $regex: search, $options: 'i' } } // Include otherType in search
          ]}
        ];
        // Remove the original $or as it's now part of $and
        delete query.$or;
      } else {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { building: { $regex: search, $options: 'i' } },
          { otherType: { $regex: search, $options: 'i' } } // Include otherType in search
        ];
      }
    }
    
    // Connect to database
    await dbConnect();
    
    // Get total count for pagination
    const total = await Room.countDocuments(query);
    
    // Get rooms with pagination
    const rooms = await Room.find(query)
      .sort({ building: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    // Add viewUrl to rooms with images
    const roomsWithViewUrl = await Promise.all(rooms.map(async (room) => {
      if (room.imageUrl) {
        try {
          room.viewUrl = await generateSasUrl(room.imageUrl);
        } catch (error) {
          console.error('Error generating SAS URL for room image:', error);
          // Continue without viewUrl if there's an error
        }
      }
      return room;
    }));
    
    return NextResponse.json({ 
      rooms: roomsWithViewUrl,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to parse multipart form data
async function parseFormData(request) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  
  // Extract file if present
  const imageFile = formData.get('image');
  
  // Parse JSON fields that might be stringified
  if (data.facilities && typeof data.facilities === 'string') {
    try {
      data.facilities = JSON.parse(data.facilities);
    } catch (e) {
      data.facilities = data.facilities.split(',').map(item => item.trim());
    }
  }
  
  // Convert numeric fields
  if (data.floor) data.floor = parseInt(data.floor);
  if (data.capacity) data.capacity = parseInt(data.capacity);
  
  // Convert boolean fields
  if (data.isActive !== undefined) {
    data.isActive = data.isActive === 'true';
  }
  
  return { data, imageFile: imageFile instanceof File ? imageFile : null };
}

export async function POST(request) {
  try {
    // Check if the request is multipart form data
    const contentType = request.headers.get('content-type') || '';
    
    let roomData;
    let imageFile = null;
    let firebaseUid;
    
    if (contentType.includes('multipart/form-data')) {
      const { data, imageFile: parsedImageFile } = await parseFormData(request);
      roomData = data;
      imageFile = parsedImageFile;
      firebaseUid = roomData.firebaseUid;
      delete roomData.firebaseUid;  // Remove this from roomData as it's not part of the room model
    } else {
      const body = await request.json();
      ({ firebaseUid, ...roomData } = body);
    }
    
    if (!firebaseUid) {
      const searchParams = request.nextUrl.searchParams;
      firebaseUid = searchParams.get('uid');
      
      if (!firebaseUid) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }
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
    const room = await createRoom(roomData, imageFile);
    
    return NextResponse.json({ room, message: 'Room created successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    let roomData;
    let imageFile = null;
    let firebaseUid;
    let roomId;
    
    if (contentType.includes('multipart/form-data')) {
      const { data, imageFile: parsedImageFile } = await parseFormData(request);
      roomData = data;
      imageFile = parsedImageFile;
      firebaseUid = roomData.firebaseUid;
      roomId = roomData.id || roomData._id;
      
      // Remove these from roomData as they're not part of the room model
      delete roomData.firebaseUid;
      delete roomData.id;
      delete roomData._id;
    } else {
      const body = await request.json();
      ({ firebaseUid, id, ...roomData } = body);
      roomId = id;
    }
    
    if (!firebaseUid || !roomId) {
      const searchParams = request.nextUrl.searchParams;
      firebaseUid = firebaseUid || searchParams.get('uid');
      roomId = roomId || searchParams.get('roomId');
      
      if (!firebaseUid || !roomId) {
        return NextResponse.json({ error: 'User ID and Room ID are required' }, { status: 400 });
      }
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
    const updatedRoom = await updateRoom(roomId, roomData, imageFile);
    
    return NextResponse.json({ room: updatedRoom, message: 'Room updated successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('roomId') || searchParams.get('id');
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
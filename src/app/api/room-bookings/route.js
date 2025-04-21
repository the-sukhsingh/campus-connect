import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RoomBooking from '@/models/RoomBooking';
import Room from '@/models/Room';
import { getUserByFirebaseUid } from '@/services/userService';
import { getAvailableTimeSlots } from '@/services/roomService';

// Get room bookings - can be filtered by status, room, or user
export async function GET(request) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const firebaseUid = searchParams.get('uid');
    const status = searchParams.get('status');
    const roomId = searchParams.get('roomId');
    const action = searchParams.get('action');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle get-available-slots action
    if (action === 'get-available-slots' && roomId && date) {
      const availableSlots = await getAvailableTimeSlots(roomId, date);
      return NextResponse.json({ availableSlots });
    }
    
    await dbConnect();
    
    // Build query based on filters
    const query = {};
    
    // If status filter is provided
    if (status) {
      query.status = status;
    }
    
    // If room filter is provided
    if (roomId) {
      query.room = roomId;
    }
    
    // If the user is not a HOD, filter by their own bookings
    if (dbUser.role !== 'hod') {
      query.requestedBy = dbUser._id;
    } else {
      // For HODs, show bookings from their college
      if (dbUser.college) {
        // We need to join with rooms to filter by college
        const collegeRooms = await Room.find({ collegeId: dbUser.college }).select('_id');
        const roomIds = collegeRooms.map(room => room._id);
        query.room = { $in: roomIds };
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get bookings with pagination
    const bookings = await RoomBooking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('room')
      .populate('requestedBy', 'displayName email role')
      .populate('approvedBy', 'displayName email role');
    
    // Get total count for pagination
    const totalBookings = await RoomBooking.countDocuments(query);
    
    const totalPages = Math.ceil(totalBookings / limit);
    
    return NextResponse.json({
      bookings,
      pagination: {
        totalBookings,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new booking request
export async function POST(request) {
  try {
    const body = await request.json();
    const { firebaseUid, roomId, title, purpose, date, startTime, endTime, attendees, additionalNotes, recurring, recurringPattern, recurringEndDate } = body;
    
    if (!firebaseUid || !roomId || !title || !purpose || !date || !startTime || !endTime || !attendees) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    await dbConnect();
    
    // Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    // Check if room is active
    if (room.isActive === false) {
      return NextResponse.json({ error: 'This room is not available for booking' }, { status: 400 });
    }
    
    // Check if attendees count exceeds room capacity
    if (attendees > room.capacity) {
      return NextResponse.json({ error: `Number of attendees exceeds room capacity of ${room.capacity}` }, { status: 400 });
    }
    
    // Check for time conflicts
    const bookingDate = new Date(date);
    const existingBookings = await RoomBooking.find({
      room: roomId,
      date: bookingDate,
      status: { $in: ['pending', 'approved'] },
      $or: [
        // New booking starts during an existing booking
        { 
          startTime: { $lte: startTime }, 
          endTime: { $gt: startTime } 
        },
        // New booking ends during an existing booking
        { 
          startTime: { $lt: endTime }, 
          endTime: { $gte: endTime } 
        },
        // New booking completely contains an existing booking
        { 
          startTime: { $gte: startTime }, 
          endTime: { $lte: endTime } 
        }
      ]
    });
    
    if (existingBookings.length > 0) {
      return NextResponse.json({ error: 'Room is already booked for this time slot' }, { status: 409 });
    }
    
    // Create the booking
    const booking = new RoomBooking({
      room: roomId,
      requestedBy: dbUser._id,
      title,
      purpose,
      date: bookingDate,
      startTime,
      endTime,
      attendees,
      additionalNotes,
      recurring: recurring || false,
      recurringPattern: recurring ? recurringPattern : null,
      recurringEndDate: recurring && recurringEndDate ? new Date(recurringEndDate) : null
    });
    
    await booking.save();
    
    // Return the created booking with populated references
    const populatedBooking = await RoomBooking.findById(booking._id)
      .populate('room')
      .populate('requestedBy', 'displayName email role');
    
    return NextResponse.json(populatedBooking);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update booking status (approve/reject)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { firebaseUid, bookingId, action, rejectionReason } = body;
    
    if (!firebaseUid || !bookingId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (action !== 'approve' && action !== 'reject' && action !== 'cancel') {
      return NextResponse.json({ error: 'Invalid action. Must be "approve", "reject", or "cancel"' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    await dbConnect();
    
    // Find the booking
    const booking = await RoomBooking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Check permissions
    if (action === 'cancel') {
      // Only the requester can cancel their own booking
      if (booking.requestedBy.toString() !== dbUser._id.toString()) {
        return NextResponse.json({ error: 'Unauthorized. You can only cancel your own bookings' }, { status: 403 });
      }
      
      // Can only cancel pending or approved bookings
      if (booking.status !== 'pending' && booking.status !== 'approved') {
        return NextResponse.json({ error: 'This booking cannot be cancelled' }, { status: 400 });
      }
      
      booking.status = 'canceled';
    } else {
      // For approve/reject, only HODs can perform these actions
      if (dbUser.role !== 'hod') {
        return NextResponse.json({ error: 'Unauthorized. Only HODs can approve or reject bookings' }, { status: 403 });
      }
      
      // Can only approve or reject pending bookings
      if (booking.status !== 'pending') {
        return NextResponse.json({ error: 'Only pending bookings can be approved or rejected' }, { status: 400 });
      }
      
      if (action === 'approve') {
        booking.status = 'approved';
        booking.approvedBy = dbUser._id;
        booking.approvedAt = new Date();
      } else {
        booking.status = 'rejected';
        booking.rejectionReason = rejectionReason;
      }
    }
    
    await booking.save();
    
    // Return the updated booking with populated references
    const updatedBooking = await RoomBooking.findById(booking._id)
      .populate('room')
      .populate('requestedBy', 'displayName email role')
      .populate('approvedBy', 'displayName email role');
    
    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
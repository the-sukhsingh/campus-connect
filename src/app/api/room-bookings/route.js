import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RoomBooking from '@/models/RoomBooking';
import Room from '@/models/Room';
import User from '@/models/User';

// POST - Create a new room booking
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { 
      firebaseUid, 
      room, 
      title, 
      purpose, 
      date, 
      startTime, 
      endTime, 
      attendees, 
      additionalNotes 
    } = body;


    // Validate inputs
    if (!room || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert startTime and endTime to 24-hour format (if not already)
    const startHour = Number(startTime.split(':')[0]);
    const endHour = Number(endTime.split(':')[0]);

    // Check that end time is after start time and within the same day
    if (endHour <= startHour) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Check if the room exists
    const roomId = await Room.findById(room);
    if (!roomId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if the room is available for the requested time
    const existingBookings = await RoomBooking.find({
      room:roomId,
      date,
      $or: [
        // Booking that starts during the requested time
        {
          startTime: { $gte: startTime, $lt: endTime }
        },
        // Booking that ends during the requested time
        {
          endTime: { $gt: startTime, $lte: endTime }
        },
        // Booking that completely encompasses the requested time
        {
          startTime: { $lte: startTime },
          endTime: { $gte: endTime }
        }
      ],
      status: { $ne: 'cancelled' } // Exclude cancelled bookings
    });

    if (existingBookings.length > 0) {
      return NextResponse.json({ 
        error: 'Room is not available for the selected time slot',
        conflictingBookings: existingBookings 
      }, { status: 409 });
    }

    // Find the user in the database
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create new booking
    const booking = new RoomBooking({
      room: room,
      requestedBy: user._id,
      title,
      purpose: purpose || 'meeting',
      date,
      startTime,
      endTime,
      attendees: Number(attendees) || 1,
      status: 'pending', // Default status is pending
      additionalNotes,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await booking.save();

    return NextResponse.json({ 
      message: 'Room booking created successfully', 
      booking 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating room booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

// GET - Fetch room bookings
export async function GET(request) {
  try {
    await dbConnect();
    
    // Parse URL and get query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const uid = searchParams.get('uid');
    const room = searchParams.get('room');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const bookingId = searchParams.get('bookingId');
    const status = searchParams.get('status');
   

    // Find the user in the database
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }


    // Route based on action
    if (action === 'get-my-bookings') {
      console.log("Action: get-my-bookings");
      let query ={ requestedBy: user._id };

      // If a status is provided, filter by that status
      if (status) {
        query.status = status;
      }

      const bookings = await RoomBooking.find(query)
      .sort({ date: 1, startTime: 1 }) // Sort by date and time
      .populate('room', 'name building floor type'); // Populate room details
      
      return NextResponse.json({ bookings });
    }
    
    else if (action === 'get-all-bookings' && ['admin', 'hod'].includes(user.role)) {
      console.log("Action: get-all-bookings");
      // Only admin and HOD can see all bookings
      const bookings = await RoomBooking.find({})
        .sort({ date: 1, startTime: 1 })
        .populate('room', 'name building floor type')
        .populate('requestedBy', 'displayName email');
        
      return NextResponse.json({ bookings });
    }
    
    else if (action === 'get-room-bookings' && room) {
      console.log("Action: get-room-bookings");
      // Build query based on provided parameters
      const query = {
        room
      };
      
      // Add date range if specified
      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      
      const bookings = await RoomBooking.find(query)
        .sort({ date: 1, startTime: 1 })
        .populate('requestedBy', 'displayName email');
        

      return NextResponse.json({ bookings });
    }
    
    else if (action === 'get-booking-details' && bookingId) {
      console.log("Action: get-booking-details");
      const booking = await RoomBooking.findById(bookingId)
        .populate('room', 'name building floor type capacity amenities')
        .populate('requestedBy', 'displayName email');
        
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      
      // Check if user has permission to view this booking
      const canView = user.role === 'admin' || 
                       user.role === 'hod' ||
                       booking.requestedBy.toString() === user._id.toString();
                       
      if (!canView) {
        return NextResponse.json({ error: 'Not authorized to view this booking' }, { status: 403 });
      }
      
      return NextResponse.json({ booking });
    }
    
    else {

      if(user.role === 'hod' && status){
        const bookings = await RoomBooking.find({ 
          collegeId: user.college,
          status: status,
         })
          .sort({ date: 1, startTime: 1 })
          .populate('room', 'name building floor type')
          .populate('requestedBy', 'displayName email role');
        
        return NextResponse.json({ bookings });
      }

      return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching room bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// PUT - Update a room booking
export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { firebaseUid, bookingId, status, reason } = body;

    console.log("Firebase,bookingID, status and reason is",firebaseUid, bookingId, status, reason);
    

    // Find the user in the database
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the booking
    const booking = await RoomBooking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check permission
    const isOwner = booking.requestedBy.toString() === user._id.toString();
    const isAdminOrHOD = ['admin', 'hod'].includes(user.role);
    
    if (!isOwner && !isAdminOrHOD) {
      return NextResponse.json({ error: 'Not authorized to update this booking' }, { status: 403 });
    }

    // If owner is updating, they can only cancel their booking
    if (isOwner && !isAdminOrHOD && status !== 'cancelled') {
      return NextResponse.json({ 
        error: 'You can only cancel your own bookings' 
      }, { status: 403 });
    }

    // Update booking
    booking.status = status;
    if (reason) {
      booking.statusReason = reason;
    }
    booking.updatedAt = new Date();
    booking.updatedBy = user._id;

    await booking.save();

    return NextResponse.json({ 
      message: 'Booking updated successfully', 
      booking 
    });

  } catch (error) {
    console.error('Error updating room booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

// DELETE - Cancel a room booking
export async function DELETE(request) {
  try {
    await dbConnect();
    
    // Parse URL and get query parameters
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const bookingId = searchParams.get('bookingId');
    
    if (!uid || !bookingId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }


    // Find the user in the database
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the booking
    const booking = await RoomBooking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check permission
    const isOwner = booking.requestedBy.toString() === user._id.toString();
    const isAdminOrHOD = ['admin', 'hod'].includes(user.role);
    
    if (!isOwner && !isAdminOrHOD) {
      return NextResponse.json({ error: 'Not authorized to cancel this booking' }, { status: 403 });
    }

    // Mark booking as cancelled instead of deleting
    booking.status = 'cancelled';
    booking.statusReason = 'Cancelled by user';
    booking.updatedAt = new Date();
    booking.updatedBy = user._id;

    await booking.save();

    return NextResponse.json({ 
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling room booking:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}
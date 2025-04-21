import dbConnect from '@/lib/dbConnect';
import RoomBooking from '@/models/RoomBooking';
import Room from '@/models/Room';
import { checkRoomAvailability } from './roomService';
import mongoose from 'mongoose';

// Get bookings with optional filtering
export async function getBookings(filters = {}, page = 1, limit = 10) {
  try {
    await dbConnect();
    
    const query = {};
    
    // Apply filters if provided
    if (filters.room) query.room = filters.room;
    if (filters.status) query.status = filters.status;
    if (filters.requestedBy) query.requestedBy = filters.requestedBy;
    if (filters.date) {
      const date = new Date(filters.date);
      date.setHours(0, 0, 0, 0);
      query.date = date;
    }
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      dateFrom.setHours(0, 0, 0, 0);
      query.date = { ...query.date, $gte: dateFrom };
    }
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      query.date = { ...query.date, $lte: dateTo };
    }
    
    // Count total bookings matching the query
    const total = await RoomBooking.countDocuments(query);
    
    // Get paginated booking results
    const bookings = await RoomBooking.find(query)
      .populate('room', 'name building roomNumber')
      .populate('requestedBy', 'displayName email')
      .populate('approvedBy', 'displayName email')
      .sort({ date: 1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return { bookings, total, page, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    console.error('Error getting bookings:', error);
    throw error;
  }
}

// Get a single booking by ID
export async function getBookingById(bookingId) {
  try {
    await dbConnect();
    
    const booking = await RoomBooking.findById(bookingId)
      .populate('room')
      .populate('requestedBy', 'displayName email')
      .populate('approvedBy', 'displayName email');
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    return booking;
  } catch (error) {
    console.error(`Error getting booking ${bookingId}:`, error);
    throw error;
  }
}

// Get bookings for a specific user
export async function getUserBookings(userId, status = null, page = 1, limit = 10) {
  try {
    await dbConnect();
    
    const query = { requestedBy: userId };
    if (status) {
      query.status = status;
    }
    
    // Count total bookings for this user
    const total = await RoomBooking.countDocuments(query);
    
    // Get paginated booking results
    const bookings = await RoomBooking.find(query)
      .populate('room', 'name building roomNumber')
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return { bookings, total, page, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    console.error(`Error getting bookings for user ${userId}:`, error);
    throw error;
  }
}

// Get upcoming bookings for a specific room
export async function getRoomBookings(roomId, startDate = new Date(), endDate = null, status = ['approved']) {
  try {
    await dbConnect();
    
    // Normalize start date to beginning of day
    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);
    
    // Create date filter
    const dateFilter = { $gte: normalizedStartDate };
    if (endDate) {
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = normalizedEndDate;
    }
    
    // Get bookings
    const bookings = await RoomBooking.find({
      room: roomId,
      date: dateFilter,
      status: { $in: Array.isArray(status) ? status : [status] }
    })
      .populate('requestedBy', 'displayName email')
      .sort({ date: 1, startTime: 1 });
    
    return bookings;
  } catch (error) {
    console.error(`Error getting bookings for room ${roomId}:`, error);
    throw error;
  }
}

// Create a new booking
export async function createBooking(bookingData, userId) {
  try {
    await dbConnect();
    
    // Check if the requested room exists
    const room = await Room.findById(bookingData.room);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Check if the room is available for the requested time slot
    const { isAvailable, conflictingBookings } = await checkRoomAvailability(
      bookingData.room,
      bookingData.date,
      bookingData.startTime,
      bookingData.endTime
    );
    
    if (!isAvailable) {
      throw new Error('Room is not available for the requested time slot');
    }
    
    // Create the booking
    const booking = new RoomBooking({
      ...bookingData,
      requestedBy: userId
    });
    
    await booking.save();
    return booking;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

// Update a booking's status (approve/reject)
export async function updateBookingStatus(bookingId, status, approverId = null, rejectionReason = null) {
  try {
    await dbConnect();
    
    const updateData = {
      status,
    };
    
    if (status === 'approved' && approverId) {
      updateData.approvedBy = approverId;
      updateData.approvedAt = new Date();
    }
    
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    const booking = await RoomBooking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('room')
      .populate('requestedBy', 'displayName email');
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    return booking;
  } catch (error) {
    console.error(`Error updating booking status ${bookingId}:`, error);
    throw error;
  }
}

// Cancel a booking
export async function cancelBooking(bookingId, userId) {
  try {
    await dbConnect();
    
    // First check if the booking exists and belongs to the user
    const booking = await RoomBooking.findById(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.requestedBy.toString() !== userId.toString()) {
      throw new Error('You are not authorized to cancel this booking');
    }
    
    // Check if the booking is already canceled or rejected
    if (['canceled', 'rejected'].includes(booking.status)) {
      throw new Error(`Booking is already ${booking.status}`);
    }
    
    // Update the booking status
    booking.status = 'canceled';
    await booking.save();
    
    return booking;
  } catch (error) {
    console.error(`Error canceling booking ${bookingId}:`, error);
    throw error;
  }
}

// Get daily bookings for a date range (for calendar view)
export async function getBookingsByDateRange(startDate, endDate, roomId = null, status = ['approved', 'pending']) {
  try {
    await dbConnect();
    
    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);
    
    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setHours(23, 59, 59, 999);
    
    const query = {
      date: {
        $gte: normalizedStartDate,
        $lte: normalizedEndDate
      },
      status: { $in: Array.isArray(status) ? status : [status] }
    };
    
    if (roomId) {
      query.room = roomId;
    }
    
    const bookings = await RoomBooking.find(query)
      .populate('room', 'name building roomNumber')
      .populate('requestedBy', 'displayName email')
      .sort({ date: 1, startTime: 1 });
    
    return bookings;
  } catch (error) {
    console.error('Error getting bookings by date range:', error);
    throw error;
  }
}
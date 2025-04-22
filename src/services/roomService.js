import dbConnect from '@/lib/dbConnect';
import Room from '@/models/Room';
import RoomBooking from '@/models/RoomBooking';
import mongoose from 'mongoose';

// Get all rooms, optionally filtered by collegeId
export async function getRooms(collegeId = null) {
  await dbConnect();

  console.log("collegeId in getRooms", collegeId);
  
//   const query = collegeId ? { collegeId } : {};
  
  const rooms = await Room.find(collegeId ? { collegeId } : {}).lean();

  console.log("rooms", rooms);

  return rooms;
}

// Get a single room by ID
export async function getRoomById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid room ID');
  }
  
  await dbConnect();
  
  const room = await Room.findById(id).lean();
  
  if (!room) {
    throw new Error('Room not found');
  }
  
  return room;
}

// Create a new room
export async function createRoom(roomData) {
  await dbConnect();
  
  const room = new Room(roomData);
  await room.save();
  
  return room.toObject();
}

// Update a room
export async function updateRoom(id, roomData) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid room ID');
  }
  
  await dbConnect();
  
  const room = await Room.findByIdAndUpdate(
    id,
    { $set: roomData },
    { new: true, runValidators: true }
  ).lean();
  
  if (!room) {
    throw new Error('Room not found');
  }
  
  return room;
}

// Delete a room
export async function deleteRoom(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid room ID');
  }
  
  await dbConnect();
  
  const result = await Room.findByIdAndDelete(id);
  
  if (!result) {
    throw new Error('Room not found');
  }
  
  return true;
}

// Check room availability for a specific date and time slot
export async function checkRoomAvailability(roomId, date, startTime, endTime) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      throw new Error('Invalid room ID');
    }
    
    // Convert date to Date object if it's a string
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // Check for conflicting bookings
    const conflictingBookings = await RoomBooking.find({
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
    }).populate('requestedBy', 'displayName email');
    
    return {
      isAvailable: conflictingBookings.length === 0,
      conflictingBookings
    };
  } catch (error) {
    console.error('Error checking room availability:', error);
    throw error;
  }
}

// Get available time slots for a room on a specific date
export async function getAvailableTimeSlots(roomId, date) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      throw new Error('Invalid room ID');
    }
    
    // Convert date to Date object if it's a string
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // Get all bookings for this room on this date with pending or approved status
    const bookings = await RoomBooking.find({
      room: roomId,
      date: bookingDate,
      status: { $in: ['pending', 'approved'] }
    }).sort({ startTime: 1 });
    
    // Generate default time slots (8 AM to 8 PM in 1-hour blocks)
    const timeSlots = [
      { time: '08:00 - 09:00', isAvailable: true },
      { time: '09:00 - 10:00', isAvailable: true },
      { time: '10:00 - 11:00', isAvailable: true },
      { time: '11:00 - 12:00', isAvailable: true },
      { time: '12:00 - 13:00', isAvailable: true },
      { time: '13:00 - 14:00', isAvailable: true },
      { time: '14:00 - 15:00', isAvailable: true },
      { time: '15:00 - 16:00', isAvailable: true },
      { time: '16:00 - 17:00', isAvailable: true },
    ];
    
    // Mark booked slots as unavailable
    bookings.forEach(booking => {
      // Parse start and end times
      const [startHour, startMinute] = booking.startTime.split(':').map(Number);
      const [endHour, endMinute] = booking.endTime.split(':').map(Number);
      
      // Iterate through all slots that overlap with this booking
      timeSlots.forEach((slot, index) => {
        // Parse slot time range
        const [slotStart, slotEnd] = slot.time.split(' - ');
        const [slotStartHour, slotStartMinute] = slotStart.split(':').map(Number);
        const [slotEndHour, slotEndMinute] = slotEnd.split(':').map(Number);
        
        // Check if booking overlaps with this slot
        // A booking overlaps if it starts before the slot ends AND ends after the slot starts
        if ((startHour < slotEndHour || (startHour === slotEndHour && startMinute < slotEndMinute)) &&
            (endHour > slotStartHour || (endHour === slotStartHour && endMinute > slotStartMinute))) {
          timeSlots[index].isAvailable = false;
        }
      });
    });
    
    return timeSlots;
  } catch (error) {
    console.error('Error getting available time slots:', error);
    throw error;
  }
}
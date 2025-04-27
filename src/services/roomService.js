import dbConnect from '@/lib/dbConnect';
import Room from '@/models/Room';
import RoomBooking from '@/models/RoomBooking';
import mongoose from 'mongoose';
import { uploadFile, deleteFile } from './azureStorageService';

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
export async function createRoom(roomData, imageFile = null) {
  await dbConnect();
  // Validate otherType field if room type is 'other'
  if (roomData.type === 'other' && !roomData.otherType) {
    throw new Error('When selecting "other" as room type, you must specify the otherType field');
  }
  
  // Clear otherType if type is not 'other' to keep data clean
  if (roomData.type !== 'other') {
    roomData.otherType = '';
  }
  
  // Upload image if provided
  if (imageFile) {
    try {
      console.log("imageFile", imageFile);
      console.log("imageFile", imageFile);
      // Convert the File object to a buffer for Azure storage
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const uploadResult = await uploadFile(
        buffer,
        imageFile.name,
        imageFile.type
      );
      roomData.imageUrl = uploadResult.url;
    } catch (error) {
      console.error('Error uploading room image:', error);
      throw new Error('Failed to upload room image: ' + error.message);
    }
  }
  let room;
  try{
    room = new Room(roomData);
    await room.save();
  }catch(error){
    console.error('Error creating room:', error);
    // Delete the uploaded image if room creation fails
    if (roomData.imageUrl) {
      try {
        await deleteFile(roomData.imageUrl);
      } catch (deleteError) {
        console.warn('Failed to delete uploaded room image:', deleteError);
        // Continue with the error handling even if deletion fails
      }
    }

    throw new Error('Failed to create room: ' + error.message);
  }
  
  return room.toObject();
}

// Update a room
export async function updateRoom(id, roomData, imageFile = null) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid room ID');
  }
  
  await dbConnect();
  
  // Get current room data for potential image deletion
  const existingRoom = await Room.findById(id);
  if (!existingRoom) {
    throw new Error('Room not found');
  }
  
  // Validate otherType field if room type is 'other'
  if (roomData.type === 'other' && !roomData.otherType) {
    throw new Error('When selecting "other" as room type, you must specify the otherType field');
  }
  
  // Clear otherType if type is not 'other' to keep data clean
  if (roomData.type !== 'other') {
    roomData.otherType = '';
  }
  
  // Handle image upload if a new image is provided
  if (imageFile) {
    try {
      // Delete old image if exists
      if (existingRoom.imageUrl) {
        try {
          await deleteFile(existingRoom.imageUrl);
        } catch (deleteError) {
          console.warn('Failed to delete old room image:', deleteError);
          // Continue with the update even if deletion fails
        }
      }
      
      // Upload new image
      const uploadResult = await uploadFile(
        imageFile.buffer,
        imageFile.originalname,
        imageFile.mimetype
      );
      roomData.imageUrl = uploadResult.url;
    } catch (error) {
      console.error('Error uploading room image:', error);
      throw new Error('Failed to upload room image: ' + error.message);
    }
  }
  
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
  
  // Get room data to delete associated image if exists
  const room = await Room.findById(id);
  
  if (!room) {
    throw new Error('Room not found');
  }
  
  // Delete the associated image if exists
  if (room.imageUrl) {
    try {
      await deleteFile(room.imageUrl);
    } catch (error) {
      console.warn('Failed to delete room image:', error);
      // Continue with the room deletion even if image deletion fails
    }
  }
  
  // Delete the room
  await Room.findByIdAndDelete(id);
  
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
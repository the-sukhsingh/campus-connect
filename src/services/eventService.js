import dbConnect from '@/lib/dbConnect';
import Event from '@/models/Event';

// Get all events for a specific college
export async function getAllEvents(collegeId) {
  try {
    await dbConnect();
  
    const events = await Event.find({ collegeId })
      .populate({
        path: 'organizer',
        select: 'displayName email role'
      })
      .sort({ date: 1 }); // Sort by date ascending
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

// Get events organized by a specific user in a specific college
export async function getEventsByOrganizer(organizerId, collegeId) {
  try {
    await dbConnect();
    const events = await Event.find({ 
      organizer: organizerId,
      collegeId: collegeId 
    })
      .populate({
        path: 'organizer',
        select: 'displayName email role'
      })
      .sort({ date: 1 });
    return events;
  } catch (error) {
    console.error('Error fetching organizer events:', error);
    throw error;
  }
}

// Get a specific event by ID and verify it belongs to the user's college
export async function getEventById(eventId, collegeId) {
  try {
    await dbConnect();
    const event = await Event.findOne({ 
      _id: eventId,
      collegeId: collegeId
    })
      .populate({
        path: 'organizer',
        select: 'displayName email role'
      }).populate({
        path: 'attendees',
        select: 'displayName email rollNo department year batch'
      })
    return event;
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
}

// Create a new event
export async function createEvent(eventData) {
  try {
    await dbConnect();

    const newEvent = new Event({
      ...eventData,
      collegeId: eventData.collegeId,
    });


    await newEvent.save();
    return newEvent;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

// Update an existing event
export async function updateEvent(eventId, eventData) {
  try {
    await dbConnect();
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      eventData,
      { new: true }
    );
    return updatedEvent;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

// Delete an event
export async function deleteEvent(eventId) {
  try {
    await dbConnect();
    const result = await Event.findByIdAndDelete(eventId);
    return !!result;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

// Register user for an event (RSVP)
export async function registerForEvent(eventId, userId) {
  try {
    await dbConnect();
    
    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return { success: false, message: 'Event not found' };
    }
    
    // Check if event is in the past
    if (new Date(event.date) < new Date()) {
      return { success: false, message: 'Cannot register for past events' };
    }
    
    // Check if user is already registered
    if (event.attendees.includes(userId)) {
      return { success: false, message: 'You are already registered for this event' };
    }
    
    // Check if event has reached maximum capacity
    if (event.maxAttendees > 0 && event.attendees.length >= event.maxAttendees) {
      return { success: false, message: 'Event has reached maximum capacity' };
    }
    
    // Add user to attendees
    event.attendees.push(userId);
    await event.save();
    
    // Return the updated event with populated fields
    const updatedEvent = await Event.findById(eventId)
      .populate({
        path: 'organizer',
        select: 'displayName email role'
      })
      .populate({
        path: 'attendees',
        select: 'displayName email role'
      });
    
    return { 
      success: true, 
      message: 'Successfully registered for the event',
      event: updatedEvent
    };
  } catch (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
}

// Cancel registration for an event
export async function cancelEventRegistration(eventId, userId) {
  try {
    await dbConnect();
    
    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return { success: false, message: 'Event not found' };
    }
    
    // Check if event is in the past
    if (new Date(event.date) < new Date()) {
      return { success: false, message: 'Cannot cancel registration for past events' };
    }
    
    // Check if user is registered
    if (!event.attendees.includes(userId)) {
      return { success: false, message: 'You are not registered for this event' };
    }
    
    // Remove user from attendees
    event.attendees = event.attendees.filter(
      (attendeeId) => attendeeId.toString() !== userId
    );
    await event.save();
    
    // Return the updated event with populated fields
    const updatedEvent = await Event.findById(eventId)
      .populate({
        path: 'organizer',
        select: 'displayName email role'
      })
      .populate({
        path: 'attendees',
        select: 'displayName email role'
      });
    
    return { 
      success: true, 
      message: 'Successfully canceled event registration',
      event: updatedEvent
    };
  } catch (error) {
    console.error('Error canceling event registration:', error);
    throw error;
  }
}

// Get events a user has registered for in their college
export async function getRegisteredEvents(userId, collegeId) {
  try {
    await dbConnect();
    const events = await Event.find({ 
      attendees: userId,
      collegeId: collegeId 
    })
      .populate({
        path: 'organizer',
        select: 'displayName email role'
      })
      .sort({ date: 1 });
    return events;
  } catch (error) {
    console.error('Error fetching registered events:', error);
    throw error;
  }
}

// Check if a user is registered for an event
export async function isUserRegistered(eventId, userId) {
  try {
    await dbConnect();
    const event = await Event.findById(eventId);
    if (!event) return false;
    return event.attendees.some((attendeeId) => attendeeId.toString() === userId);
  } catch (error) {
    console.error('Error checking registration status:', error);
    throw error;
  }
}
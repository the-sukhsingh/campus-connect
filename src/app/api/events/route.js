import { NextResponse } from 'next/server';
import Event from '@/models/Event';
import { 
  getAllEvents, 
  getEventsByOrganizer, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  registerForEvent,
  cancelEventRegistration,
  getRegisteredEvents,
  isUserRegistered
} from '@/services/eventService';
import { getUserByFirebaseUid } from '@/services/userService';

export async function GET(request) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const firebaseUid = searchParams.get('uid');
    const eventId = searchParams.get('eventId');
    const collegeIdFromRequest = searchParams.get('collegeId');

    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get the user's college ID for filtering events
    const collegeId = collegeIdFromRequest || dbUser.college;

    
    if (!collegeId) {
      return NextResponse.json({ error: 'User is not associated with a college' }, { status: 400 });
    }
    
    // Handle different actions
    if (action === 'get-all-events') {
      // Get all events for the user's college
      const events = await getAllEvents(collegeId);
      return NextResponse.json({ events });
    } 
    else if (action === 'get-user-events') {
      // Get events for a specific organizer in the user's college
      const events = await getEventsByOrganizer(dbUser._id.toString(), collegeId);
      return NextResponse.json({ events });
    }
    else if (action === 'get-registered-events') {
      // Get events the user has registered for in their college
      const events = await getRegisteredEvents(dbUser._id.toString(), collegeId);
      return NextResponse.json({ events });
    }
    else if (action === 'get-event' && eventId) {
      // Get a specific event from the user's college
      const event = await getEventById(eventId, collegeId);
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      
      // Check if current user is registered for this event
      const isRegistered = await isUserRegistered(eventId, dbUser._id.toString());
      
      // Get the populated event with attendees
      const populatedEvent = await Event.findById(eventId)
        .populate({
          path: 'organizer',
          select: 'displayName email role'
        })
        .populate({
          path: 'attendees',
          select: 'displayName email rollNo role department year batch'
        });
      
      return NextResponse.json({ 
        event: populatedEvent, 
        isRegistered 
      });
    }
    else if (action === 'check-registration' && eventId) {
      // Check if the user is registered for a specific event
      const isRegistered = await isUserRegistered(eventId, dbUser._id.toString());
      return NextResponse.json({ isRegistered });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { firebaseUid, eventData, collegeId } = body;
    
    if (!firebaseUid || !eventData || !collegeId) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!firebaseUid || !eventData || !collegeId) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    if (!collegeId) {
      return NextResponse.json({ error: 'User is not associated with a college' }, { status: 400 });
    }

    
    // Check if the user is a faculty or hod only
    if (!['faculty', 'hod'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Unauthorized. Only faculty and HODs can create events.' }, { status: 403 });
    }
    
    // Add organizer and collegeId to event data
    const newEventData = {
      ...eventData,
      organizer: dbUser._id.toString(),
      collegeId: collegeId,
    };
    

    // Create the event
    const savedEvent = await createEvent(newEventData);
    
    return NextResponse.json({ 
      success: true, 
      event: savedEvent 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { firebaseUid, eventId, eventData, action } = body;
    
    if (!firebaseUid || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get the user's college ID
    const collegeId = dbUser.college;
    
    if (!collegeId) {
      return NextResponse.json({ error: 'User is not associated with a college' }, { status: 400 });
    }
    
    // First, verify the event belongs to the user's college
    const eventExists = await getEventById(eventId, collegeId);
    if (!eventExists) {
      return NextResponse.json({ error: 'Event not found or not accessible' }, { status: 404 });
    }
    
    // Handle registration (RSVP) actions
    if (action === 'register') {
      // Register the user for the event
      const result = await registerForEvent(eventId, dbUser._id.toString());
      return NextResponse.json(result);
    } 
    else if (action === 'cancel-registration') {
      // Cancel the user's registration
      const result = await cancelEventRegistration(eventId, dbUser._id.toString());
      return NextResponse.json(result);
    }
    // Handle regular event update
    else if (eventData) {
      // Check if the user is the organizer or an admin
      const isOrganizer = eventExists.organizer.toString() === dbUser._id.toString();
      const isAdmin = dbUser.role === 'hod';
      
      if (!isOrganizer && !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized to update this event' }, { status: 403 });
      }
      
      // Update the event
      const updatedEvent = await updateEvent(eventId, eventData);
      
      return NextResponse.json({ 
        success: true, 
        event: updatedEvent 
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const firebaseUid = searchParams.get('uid');
    const eventId = searchParams.get('eventId');
    
    if (!firebaseUid || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get the user's college ID
    const collegeId = dbUser.college;
    
    if (!collegeId) {
      return NextResponse.json({ error: 'User is not associated with a college' }, { status: 400 });
    }
    
    // Verify the event belongs to the user's college
    const event = await getEventById(eventId, collegeId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found or not accessible' }, { status: 404 });
    }
    
    // Check if the user is the organizer or an admin
    const isOrganizer = event.organizer.toString() === dbUser._id.toString();
    const isAdmin = dbUser.role === 'hod';
    
    if (!isOrganizer && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to delete this event' }, { status: 403 });
    }
    
    // Delete the event
    const success = await deleteEvent(eventId);
    
    return NextResponse.json({ 
      success: success 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
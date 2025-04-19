import mongoose, { Schema} from 'mongoose';

// Define the schema
const EventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  organizer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collegeId: {
    type: Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  attendees: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxAttendees: {
    type: Number,
    default: 0 // 0 means unlimited attendees
  }
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

// Create index for faster searches
// EventSchema.index({ title: 'text', category: 'text', venue: 'text' });

// Define and export the model (if it doesn't already exist)
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

export default Event;
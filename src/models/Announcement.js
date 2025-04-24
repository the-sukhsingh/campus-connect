import mongoose, { Schema } from 'mongoose';

// Define the schema
const AnnouncementSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['general', 'class', 'book'],
    default: 'general'
  },
  bookId: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collegeId: {
    type: Schema.Types.ObjectId,
    ref: 'College',
    default: null
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  expiryDate: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 30); // Default expiry is 30 days
      return date;
    }
  }
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

// Define and export the model (if it doesn't already exist)
const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);

export default Announcement;
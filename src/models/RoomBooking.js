import mongoose, { Schema } from 'mongoose';

const RoomBookingSchema = new Schema({
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String, // Format: HH:MM in 24-hour format
    required: true,
  },
  endTime: {
    type: String, // Format: HH:MM in 24-hour format
    required: true,
  },
  attendees: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
    trim: true,
  },
  additionalNotes: {
    type: String,
    trim: true,
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  recurring: {
    type: Boolean,
    default: false,
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', null],
    default: null,
  },
  collegeId: {
    type: Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  recurringEndDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Create indices for common queries
RoomBookingSchema.index({ room: 1, date: 1 });
RoomBookingSchema.index({ requestedBy: 1 });
RoomBookingSchema.index({ status: 1 });

export default mongoose.models.RoomBooking || mongoose.model('RoomBooking', RoomBookingSchema);
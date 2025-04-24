import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a room name'],
    trim: true,
  },
  building: {
    type: String,
    required: [true, 'Please provide a building name'],
    trim: true,
  },
  floor: {
    type: Number,
    required: [true, 'Please provide a floor number'],
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide room capacity'],
    min: [1, 'Capacity must be at least 1'],
  },
  type: {
    type: String,
    required: [true, 'Please provide room type'],
    enum: ['classroom', 'laboratory', 'conference', 'auditorium', 'other'],
    default: 'classroom',
  },
  otherType: {
    type: String,
    trim: true,
  },
  facilities: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'Please provide a college ID'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
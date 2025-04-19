import mongoose, { Schema } from 'mongoose';


// Define the schema
const AttendanceSchema = new Schema({
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  attendanceRecords: [{
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'absent',
      required: true,
    },
    remark: {
      type: String,
    }
  }],
  markedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  locked: {
    type: Boolean,
    default: false, // Default to true to lock attendance after saving
  },
  lockedAt: {
    type: Date
  }
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

// Compound index to ensure uniqueness for class, subject and date combination
// AttendanceSchema.index({ classId: 1, subject: 1, date: 1 }, { unique: true });

// Define and export the model (if it doesn't already exist)
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

export default Attendance;
import mongoose, { Schema } from 'mongoose';



const FacultyAssignmentSchema = new Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
});

// Define schema for student with status
const StudentWithStatusSchema = new Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  joinRequestDate: {
    type: Date,
    default: Date.now
  }
});

const ClassSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: String,
    required: false,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    required: true,
    trim: true
  },
  batch: {
    type: String,
    required: false,
    trim: true
  },
  uniqueId: {
    type: String,
    required: true,
    unique: true,
    default: () => Math.random().toString(36).substring(2, 8).toUpperCase() // Generate random unique ID
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  facultyAssignments: [FacultyAssignmentSchema],
  students: [StudentWithStatusSchema],
  studentRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create compound indexes for better query performance
// ClassSchema.index({ college: 1, department: 1 });
// ClassSchema.index({ teacher: 1 });
// ClassSchema.index({ uniqueId: 1 });

export default mongoose.models.Class || mongoose.model('Class', ClassSchema);
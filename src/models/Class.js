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

  totalSemesters: {
    type: Number,
    // required: true,
    default: 8
  },
  currentSemester: {
    type: Number,
    // required: true,
    default: 1
  },
  batch: {
    type: String,
    required: false,
    trim: true
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


export default mongoose.models.Class || mongoose.model('Class', ClassSchema);
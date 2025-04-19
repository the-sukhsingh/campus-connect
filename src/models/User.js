import mongoose, { Schema } from 'mongoose';



const UserSchema = new Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  displayName: {
    type: String,
    required: false,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    default: 'student',
    enum: ['user', 'hod', 'faculty', 'student', 'librarian'],
  },
  rollNo: {
    type: String,
    trim: true,
  },
  college: {
    type: Schema.Types.ObjectId,
    ref: 'College',
  },
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
  },
  classes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Class',
    },
  ],
  studentId: {
    type: String,
    trim: true,
    unique: true,
  },
  department: {
    type: String,
    trim: true,
  },
  semester: {
    type: String,
    trim: true,
  },
  batch: {
    type: String,
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationMethod: {
    type: String,
    enum: ['domain', 'invite', 'hod', null],
  },

  collegeStatus: {
    type: String,
    enum: ['notlinked', 'pending', 'approved', 'rejected'],
    default: 'notlinked',
    required: true,
  },

  pendingApproval: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

// Create compound indexes for better query performance
// UserSchema.index({ college: 1, studentId: 1 }, { unique: true, sparse: true });
// UserSchema.index({ college: 1, role: 1 });
// UserSchema.index({ email: 1, college: 1 });

// // Pre-save middleware to ensure studentId is unique within a college
// UserSchema.pre('save', async function (next) {
//   if (this.isModified('studentId') && this.studentId && this.college) {
//     const exists = await mongoose.models.User?.findOne({
//       college: this.college,
//       studentId: this.studentId,
//       _id: { $ne: this._id }
//     });
//     if (exists) {
//       throw new Error('StudentId must be unique within a college');
//     }
//   }
//   next();
// });

const UserModel = mongoose?.models?.User || mongoose.model('User', UserSchema);

export default UserModel;
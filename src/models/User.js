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
    default: true, // Changed default to true as we're auto-verifying users
  },
  verificationMethod: {
    type: String,
    enum: ['domain', 'invite', 'hod', 'faculty', null],
  },
  collegeStatus: {
    type: String,
    enum: ['notlinked', 'linked', 'rejected'], // Changed 'pending' and 'approved' to just 'linked'
    default: 'notlinked',
    required: true,
  },
  passwordChanged: {
    type: Boolean,
    default: false, // Default to false for new users, requiring them to change password
  },
  isFirstLogin: {
    type: Boolean,
    default: true, // Default to true for new users
  }
}, {
  timestamps: true,
});

// Create compound indexes for better query performance
// UserSchema.index({ college: 1, studentId: 1 }, { unique: true, sparse: true });
// UserSchema.index({ college: 1, role: 1 });
// UserSchema.index({ email: 1, college: 1 });

const UserModel = mongoose?.models?.User || mongoose.model('User', UserSchema);

export default UserModel;
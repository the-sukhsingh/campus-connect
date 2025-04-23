import mongoose from 'mongoose';

// Schema for push notification tokens
const PushTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'hod', 'admin', 'librarian'],
    required: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create a compound index to optimize queries
PushTokenSchema.index({ user: 1, token: 1 });
PushTokenSchema.index({ role: 1, active: 1 });
PushTokenSchema.index({ collegeId: 1, role: 1, active: 1 });

// Use existing model if it exists, or create new one
const PushToken = mongoose.models.PushToken || mongoose.model('PushToken', PushTokenSchema);

export default PushToken;
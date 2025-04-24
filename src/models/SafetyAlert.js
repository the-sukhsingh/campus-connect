import mongoose from 'mongoose';

const SafetyAlertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active',
  },
  resolvedAt: {
    type: Date,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

// Create indexes for common queries
SafetyAlertSchema.index({ collegeId: 1, status: 1 });
SafetyAlertSchema.index({ createdBy: 1 });

const SafetyAlert = mongoose.models.SafetyAlert || mongoose.model('SafetyAlert', SafetyAlertSchema);

export default SafetyAlert;
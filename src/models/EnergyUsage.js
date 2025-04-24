import mongoose from 'mongoose';

const energyUsageSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  kwh: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  billDocument: {
    type: String, // URL to stored document
  }
}, { timestamps: true });

// Create indexes for efficient querying
energyUsageSchema.index({ college: 1, startDate: -1 });
energyUsageSchema.index({ submittedBy: 1 });

const EnergyUsage = mongoose.models.EnergyUsage || mongoose.model('EnergyUsage', energyUsageSchema);

export default EnergyUsage;
import mongoose, { Schema } from 'mongoose';



// Define the schema
const CollegeSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  domain: {
    type: String,
    trim: true, // Remove required: true to allow empty domain
  },
  hodId:{
    type: String,
    required: true,
    trim: true,
  },

  verifiedTeachers:{
    type:[mongoose.Types.ObjectId],
    ref: 'User',
  },

  pendingApproval:{
    type:[mongoose.Types.ObjectId],
    ref: 'User',
  },
  classes: {
    type: [mongoose.Types.ObjectId],
    ref: 'Class',
  },
  uniqueId: {
    type: String,
    required: true,
    unique: true,
    default: () => {
      return Math.random().toString(36).substring(2, 10); // Generate a random unique ID
    }
  },
  verificationMethods: {
    emailDomain: {
      type: Boolean,
      default: true,
    },
    inviteCode: {
      type: Boolean,
      default: false,
    },
    adminApproval: {
      type: Boolean,
      default: false,
    },
  },
  departments: [{
    type: String,
    trim: true,
  }],
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});


// Define and export the model (if it doesn't already exist)
const CollegeModel = mongoose.models.College || mongoose.model('College', CollegeSchema);

export default CollegeModel;
import mongoose, { Schema } from 'mongoose';

const NoteSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: false,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: false,
  },
  college: {
    type: Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  tags: [{
    type: String,
    trim: true,
  }]
}, {
  timestamps: true,
});

// Create indexes for better query performance
NoteSchema.index({ title: 'text', description: 'text', subject: 'text' });
NoteSchema.index({ department: 1, semester: 1 });
NoteSchema.index({ college: 1 });
NoteSchema.index({ uploadedBy: 1 });
NoteSchema.index({ class: 1 });

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);
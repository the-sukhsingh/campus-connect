import mongoose, { Schema } from 'mongoose';

const NoteFavoriteSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  noteId: {
    type: Schema.Types.ObjectId,
    ref: 'Note',
    required: true,
  }
}, {
  timestamps: true,
});

// Create a compound index to ensure a user can only favorite a note once
NoteFavoriteSchema.index({ userId: 1, noteId: 1 }, { unique: true });

export default mongoose.models.NoteFavorite || mongoose.model('NoteFavorite', NoteFavoriteSchema);
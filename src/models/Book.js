import mongoose, { Schema } from 'mongoose';


const BookSchema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    ISBN: { type: String },
    uniqueCode: { type: String, sparse: true, index: true }, // Unique code for quick lookups
    publisher: { type: String },
    publishYear: { type: Number },
    description: { type: String },
    copies: { type: Number, required: true, default: 1 },
    availableCopies: { type: Number, required: true, default: function() { return this.get('copies'); } },
    genre: { type: String, required: true },
    category: { type: String },
    language: { type: String, default: 'English' },
    pages: { type: Number },
    location: { type: String }, // Physical location in the library
    image: { type: String }, // URL to book cover image
    college: { type: Schema.Types.ObjectId, ref: 'College', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);


// Create compound index on college and uniqueCode to ensure codes are unique within a college
BookSchema.index({ college: 1, uniqueCode: 1 }, { 
  unique: true, 
  sparse: true, // Allow null/undefined values for uniqueCode
  name: 'college_uniqueCode' 
});

export default mongoose.models.Book || mongoose.model('Book', BookSchema);
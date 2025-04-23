import mongoose, { Schema } from 'mongoose';

const BookCopySchema = new Schema(
  {
    book: { 
      type: Schema.Types.ObjectId, 
      ref: 'Book', 
      required: true 
    },
    copyNumber: { 
      type: Number, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['available', 'borrowed', 'maintenance', 'lost'], 
      default: 'available', 
      required: true 
    },
    condition: { 
      type: String, 
      enum: ['new', 'good', 'fair', 'poor'], 
      default: 'good' 
    },
    acquiredDate: { 
      type: Date, 
      default: Date.now 
    },
    barcode: { 
      type: String 
    },
    notes: { 
      type: String 
    },
    college: { 
      type: Schema.Types.ObjectId, 
      ref: 'College', 
      required: true 
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure uniqueness of copy numbers within a book
BookCopySchema.index(
  { book: 1, copyNumber: 1 }, 
  { unique: true, name: 'book_copyNumber' }
);


export default mongoose.models.BookCopy || mongoose.model('BookCopy', BookCopySchema);
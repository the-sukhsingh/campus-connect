import mongoose, { Schema} from 'mongoose';

// Define the schema
const BookBorrowingSchema = new Schema({
  book: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  bookCopy: {
    type: Schema.Types.ObjectId,
    ref: 'BookCopy',
    required: true
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date
  },
  returnRequested: {
    type: Date
  },
  returnApproved: {
    type: Date
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['borrowed', 'return-requested', 'returned'],
    default: 'borrowed',
    required: true
  },
  fine: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

// Create compound index for faster lookups
BookBorrowingSchema.index({ bookCopy: 1, status: 1 });
BookBorrowingSchema.index({ student: 1, status: 1 });

// Define and export the model (if it doesn't already exist)
const BookBorrowing = mongoose.models.BookBorrowing || mongoose.model('BookBorrowing', BookBorrowingSchema);

export default BookBorrowing;
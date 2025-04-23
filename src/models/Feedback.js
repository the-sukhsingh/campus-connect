import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title for the feedback"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a description of the problem"],
      trim: true,
    },
    problemType: {
      type: String,
      required: [true, "Please specify the type of problem"],
      enum: ["Technical", "Infrastructure", "Academic", "Administrative", "Other"],
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userRole: {
      type: String,
      enum: ["student", "faculty", "librarian"],
      required: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
    },
    response: {
      text: String,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      respondedAt: Date,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);
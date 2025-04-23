import dbConnect from "../lib/dbConnect";
import Feedback from "../models/Feedback";
import User from "../models/User";
import mongoose from "mongoose";

export async function createFeedback(feedbackData) {
  await dbConnect();
  
  try {
    const feedback = new Feedback(feedbackData);
    await feedback.save();
    return feedback;
  } catch (error) {
    console.error("Error creating feedback:", error);
    throw error;
  }
}

export async function getFeedbackById(id) {
  await dbConnect();
  
  try {
    const feedback = await Feedback.findById(id)
      .populate('submittedBy', 'name email')
      .populate('response.respondedBy', 'name email')
      .populate('college', 'name');
    return feedback;
  } catch (error) {
    console.error("Error fetching feedback:", error);
    throw error;
  }
}

export async function getFeedbackByCollege(collegeId, status) {
  await dbConnect();
  
  try {
    const query = { college: collegeId };
    if (status && status !== 'All') {
      query.status = status;
    }
    
    const feedbacks = await Feedback.find(query)
      .populate('submittedBy', 'displayName email role')
      .populate('response.respondedBy', 'name email')
      .sort({ createdAt: -1 });
    return feedbacks;
  } catch (error) {
    console.error("Error fetching college feedbacks:", error);
    throw error;
  }
}

export async function getFeedbackByUser(userId) {
  await dbConnect();
  console.log("Fetching feedback for user:", userId);
  try {
    const feedbacks = await Feedback.find({ submittedBy: userId })
      .populate('college', 'name')
      .populate('submittedBy', 'displayName email')
        .populate('response.respondedBy', 'displayName email role')
      .sort({ createdAt: -1 });
    return feedbacks;
  } catch (error) {
    console.error("Error fetching user feedbacks:", error);
    throw error;
  }
}

export async function updateFeedbackStatus(id, status, response = null) {
  await dbConnect();
  
  try {
    const updateData = { status };
    if (response) {
      updateData.response = response;
    }
    
    const feedback = await Feedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('submittedBy', 'name email');
    
    return feedback;
  } catch (error) {
    console.error("Error updating feedback status:", error);
    throw error;
  }
}

export async function getFeedbackStats(collegeId) {
  await dbConnect();
  
  try {
    const stats = await Feedback.aggregate([
      { $match: { college: new mongoose.Types.ObjectId(collegeId) } },
      { $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statsMap = {
      "Pending": 0,
      "In Progress": 0,
      "Resolved": 0,
      "Rejected": 0
    };
    
    stats.forEach(item => {
      statsMap[item._id] = item.count;
    });
    
    return statsMap;
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    throw error;
  }
}
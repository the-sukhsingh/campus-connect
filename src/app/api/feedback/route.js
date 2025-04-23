import { NextResponse } from "next/server";
import { 
  createFeedback, 
  getFeedbackById, 
  getFeedbackByCollege, 
  getFeedbackByUser, 
  updateFeedbackStatus,
  getFeedbackStats 
} from "@/services/feedbackService";

// Create new feedback
export async function POST(request) {
  try {
    const data = await request.json();
    console.log("Received data:", data);
    const feedback = await createFeedback(data);
    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}

// Get feedback(s) based on query parameters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const collegeId = searchParams.get("collegeId");
    const status = searchParams.get("status");
    const stats = searchParams.get("stats");

    // Get feedback by ID
    if (id) {
      const feedback = await getFeedbackById(id);
      if (!feedback) {
        return NextResponse.json(
          { error: "Feedback not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(feedback);
    }
    
    // Get stats for a college
    if (stats === 'true' && collegeId) {
        console.log("Fetching stats for college:", collegeId);
      const statsData = await getFeedbackStats(collegeId);
      return NextResponse.json(statsData);
    }

    // Get feedback by user
    if (userId) {
      const feedbacks = await getFeedbackByUser(userId);
      return NextResponse.json(feedbacks);
    }

    // Get feedback by college with optional status filter
    if (collegeId) {
      const feedbacks = await getFeedbackByCollege(collegeId, status);
      return NextResponse.json(feedbacks);
    }

    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

// Update feedback status and/or add response
export async function PATCH(request) {
  try {
    const data = await request.json();
    const { id, status, response } = data;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const updatedFeedback = await updateFeedbackStatus(id, status, response);
    
    if (!updatedFeedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedFeedback);
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}
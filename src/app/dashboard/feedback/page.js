'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import FeedbackForm from '@/components/FeedbackForm';
import FeedbackList from '@/components/FeedbackList';

const Feedback = () => {
  const { user,dbUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState('submit');

  useEffect(() => {
    if (dbUser?._id) {
      fetchUserFeedbacks();
    }
  }, [dbUser]);

  const fetchUserFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/feedback?userId=${dbUser._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      const data = await response.json();
      console.log("User feedbacks:", data);
      setFeedbacks(data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSuccess = () => {
    fetchUserFeedbacks();
    setActiveTab('view');
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Please log in to access feedback features.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Feedback System</h1>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('submit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'submit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Submit New Feedback
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'view'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              View My Submissions
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'submit' && (
        <FeedbackForm onSubmitSuccess={handleSubmitSuccess} />
      )}

      {activeTab === 'view' && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">My Feedback Submissions</h2>
          
          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Loading your feedbacks...</p>
            </div>
          ) : (
            <FeedbackList feedbacks={feedbacks} isHOD={false} />
          )}
        </div>
      )}
    </div>
  );
};

export default Feedback;

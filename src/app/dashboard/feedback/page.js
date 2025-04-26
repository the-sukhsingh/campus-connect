'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import FeedbackForm from '@/components/FeedbackForm';
import FeedbackList from '@/components/FeedbackList';

const Feedback = () => {
  const { user, dbUser } = useAuth();
  const { theme } = useTheme();
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
      <div className={`flex justify-center items-center h-64 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
        <p>Please log in to access feedback features.</p>
      </div>
    );
  }

  return (
    <div className={` mx-auto min-h-svh p-6 ${theme === 'dark' ? 'text-gray-100 bg-[var(--background)]' : 'text-gray-800'}`}>
      <h1 className={`text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Feedback System</h1>

      <div className="mb-6">
        <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('submit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'submit'
                  ? theme === 'dark'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-amber-500 text-amber-600'
                  : theme === 'dark'
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Submit New Feedback
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'view'
                  ? theme === 'dark'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-amber-500 text-amber-600'
                  : theme === 'dark'
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              View My Submissions
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'submit' && (
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg p-6 transition-colors duration-200`}>
          <FeedbackForm onSubmitSuccess={handleSubmitSuccess} />
        </div>
      )}

      {activeTab === 'view' && (
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg p-6 transition-colors duration-200`}>

          {loading ? (
            <div className="text-center py-10">
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading your feedbacks...</p>
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

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import FeedbackList from '@/components/FeedbackList';

const HODFeedback = () => {
  const { user, dbUser } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({
    Pending: 0,
    'In Progress': 0,
    Resolved: 0,
    Rejected: 0
  });
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    console.log("User:", dbUser);
    if (dbUser) {
        console.log("User in this:", dbUser);
      fetchFeedbackStats();
      fetchFeedbacks();
    }
  }, [dbUser, activeFilter]);

  const fetchFeedbackStats = async () => {
    try {
      const response = await fetch(`/api/feedback?collegeId=${dbUser.college._id}&stats=true`);
      if (response.ok) {
        const statsData = await response.json();
        console.log("Stats Data:", statsData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
    }
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
        console.log("dbuser:", dbUser);
      const url = `/api/feedback?collegeId=${dbUser.college._id}${activeFilter !== 'All' ? `&status=${activeFilter}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch feedbacks');
      }
      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status, responseText = null) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status,
          response: responseText ? {
            text: responseText,
            respondedBy: dbUser._id,
            respondedAt: new Date().toISOString()
          } : undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update feedback status');
      }

      // Refresh the feedbacks and stats
      fetchFeedbacks();
      fetchFeedbackStats();
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Failed to update feedback status. Please try again.');
    }
  };

  if(!user) {
    return (
      <div className="flex justify-center items-center h-64 bg-[var(--background)] text-[var(--foreground)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
    
  if (dbUser?.role !== 'hod') {
    return (
      <div className="flex justify-center items-center h-64 bg-[var(--background)] text-[var(--foreground)]">
        <p className={`${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>You are not authorized to access this page.</p>
      </div>
    );
  }

  const totalFeedbacks = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-[var(--background)] text-[var(--foreground)]">
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-6">Feedback Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div 
          className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg p-4 cursor-pointer ${
            activeFilter === 'All' ? `ring-2 ${theme === 'dark' ? 'ring-blue-400' : 'ring-blue-500'}` : ''
          }`}
          onClick={() => setActiveFilter('All')}
        >
          <div className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>All</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">{totalFeedbacks}</div>
        </div>
        
        <div 
          className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg p-4 cursor-pointer ${
            activeFilter === 'Pending' ? `ring-2 ${theme === 'dark' ? 'ring-blue-400' : 'ring-blue-500'}` : ''
          }`}
          onClick={() => setActiveFilter('Pending')}
        >
          <div className={`font-medium ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>Pending</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">{stats.Pending}</div>
        </div>
        
        <div 
          className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg p-4 cursor-pointer ${
            activeFilter === 'In Progress' ? `ring-2 ${theme === 'dark' ? 'ring-blue-400' : 'ring-blue-500'}` : ''
          }`}
          onClick={() => setActiveFilter('In Progress')}
        >
          <div className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>In Progress</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">{stats['In Progress']}</div>
        </div>
        
        <div 
          className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg p-4 cursor-pointer ${
            activeFilter === 'Resolved' ? `ring-2 ${theme === 'dark' ? 'ring-blue-400' : 'ring-blue-500'}` : ''
          }`}
          onClick={() => setActiveFilter('Resolved')}
        >
          <div className={`font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Resolved</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">{stats.Resolved}</div>
        </div>
        
        <div 
          className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg p-4 cursor-pointer ${
            activeFilter === 'Rejected' ? `ring-2 ${theme === 'dark' ? 'ring-blue-400' : 'ring-blue-500'}` : ''
          }`}
          onClick={() => setActiveFilter('Rejected')}
        >
          <div className={`font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Rejected</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">{stats.Rejected}</div>
        </div>
      </div>

      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg p-6`}>
        <h2 className={`text-xl font-semibold mb-4 text-[var(--foreground)]`}>
          {activeFilter === 'All' ? 'All Feedbacks' : `${activeFilter} Feedbacks`}
        </h2>
        
        {loading ? (
          <div className="text-center py-10">
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading feedbacks...</p>
          </div>
        ) : (
          <FeedbackList 
            feedbacks={feedbacks} 
            isHOD={true}
            onUpdateStatus={handleUpdateStatus}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
};

export default HODFeedback;

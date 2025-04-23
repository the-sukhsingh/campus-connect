'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import FeedbackList from '@/components/FeedbackList';

const HODFeedback = () => {
  const { user, dbUser } = useAuth();
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
        console.log("Feedbacks:", data);
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
    return (<>
        <div>Loading...</div>
    </>)
  }
    
  if (dbUser?.role !== 'hod') {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">You are not authorized to access this page.</p>
      </div>
    );
  }

  const totalFeedbacks = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Feedback Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div 
          className={`bg-white shadow-md rounded-lg p-4 cursor-pointer ${
            activeFilter === 'All' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setActiveFilter('All')}
        >
          <div className="font-medium text-gray-700">All</div>
          <div className="text-2xl font-bold text-gray-800">{totalFeedbacks}</div>
        </div>
        
        <div 
          className={`bg-white shadow-md rounded-lg p-4 cursor-pointer ${
            activeFilter === 'Pending' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setActiveFilter('Pending')}
        >
          <div className="font-medium text-yellow-600">Pending</div>
          <div className="text-2xl font-bold text-gray-800">{stats.Pending}</div>
        </div>
        
        <div 
          className={`bg-white shadow-md rounded-lg p-4 cursor-pointer ${
            activeFilter === 'In Progress' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setActiveFilter('In Progress')}
        >
          <div className="font-medium text-blue-600">In Progress</div>
          <div className="text-2xl font-bold text-gray-800">{stats['In Progress']}</div>
        </div>
        
        <div 
          className={`bg-white shadow-md rounded-lg p-4 cursor-pointer ${
            activeFilter === 'Resolved' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setActiveFilter('Resolved')}
        >
          <div className="font-medium text-green-600">Resolved</div>
          <div className="text-2xl font-bold text-gray-800">{stats.Resolved}</div>
        </div>
        
        <div 
          className={`bg-white shadow-md rounded-lg p-4 cursor-pointer ${
            activeFilter === 'Rejected' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setActiveFilter('Rejected')}
        >
          <div className="font-medium text-red-600">Rejected</div>
          <div className="text-2xl font-bold text-gray-800">{stats.Rejected}</div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {activeFilter === 'All' ? 'All Feedbacks' : `${activeFilter} Feedbacks`}
        </h2>
        
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading feedbacks...</p>
          </div>
        ) : (
          <FeedbackList 
            feedbacks={feedbacks} 
            isHOD={true}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </div>
    </div>
  );
};

export default HODFeedback;

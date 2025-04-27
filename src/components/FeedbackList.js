'use client'
import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
const FeedbackList = ({ feedbacks, isHOD, onUpdateStatus }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const { theme } = useTheme();
  
  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Function to get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Function to get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low':
        return 'bg-gray-100 text-gray-800';
      case 'Medium':
        return 'bg-blue-100 text-blue-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmitResponse = async (id, newStatus) => {
    if (onUpdateStatus) {
      await onUpdateStatus(id, newStatus, responseText);
      setResponseText('');
      setExpandedId(null);
    }
  };

  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No feedback submissions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <div 
          key={feedback._id} 
          className={`${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-white border-gray-200'
          } border rounded-lg p-6 shadow-sm transition-colors duration-200`}
        >
          <div className="p-4 cursor-pointer">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{feedback.title}</h3>
              <div className="flex space-x-4 mt-1">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatDate(feedback.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                feedback.priority === 'Critical' 
                  ? theme === 'dark' ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800' 
                  : feedback.priority === 'High' 
                  ? theme === 'dark' ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-800'
                  : feedback.priority === 'Medium' 
                  ? theme === 'dark' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                  : theme === 'dark' ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
              }`}>
                {feedback.priority}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                theme === 'dark' ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
              }`}>
                {feedback.problemType || 'Other'}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                feedback.status === 'Open' 
                  ? theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'
                  : feedback.status === 'In Progress' 
                  ? theme === 'dark' ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                  : theme === 'dark' ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
              }`}>
                {feedback.status}
              </span>
            </div>
          </div>
            
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Submitted by:</span> {feedback.submittedBy?.displayName || 'unknown'} ({feedback.userRole})
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Problem type:</span> {feedback.problemType}
              {feedback.location && (
                <span> | <span className="font-medium">Location:</span> {feedback.location}</span>
              )}
            </div>
            
            <div className='flex items-center justify-between '>

            <div className="text-sm text-gray-400">
              Submitted on {formatDate(feedback.createdAt)}
            </div>
            {
              isHOD || feedback.response && (<>
                <button onClick={() => setExpandedId(expandedId === feedback._id ? null : feedback._id)}
                  className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm rounded-md`}>
                  {
                    expandedId === feedback._id ? 'Hide Details' : 'View Details'
                  }
                </button>
              </>)
            }
            </div>
          </div>
          
          {expandedId === feedback._id && (
            <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="mb-4">
                <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Description:</h4>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-line`}>{feedback.description}</p>
              </div>
              
              {feedback.response && feedback.response.text && (
                <div className={`mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'} p-3 rounded-md`}>
                  <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Response:</h4>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{feedback.response.text}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    Responded by: {feedback.response.respondedBy?.displayName || 'Unknown'} on {formatDate(feedback.response.respondedAt)}
                  </p>
                </div>
              )}
              
              {isHOD && (
                <div className="mt-4">
                  <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Update Status:</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Pending', 'In Progress', 'Resolved', 'Rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleSubmitResponse(feedback._id, status)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          feedback.status === status
                            ? 'bg-gray-700 text-white'
                            : theme === 'dark' 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-3">
                    <label htmlFor="response" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Response (optional)
                    </label>
                    <textarea
                      id="response"
                      rows="3"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-gray-300' 
                        : 'border-gray-300 text-gray-900'
                      }`}
                      placeholder="Add a response to this feedback"
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleSubmitResponse(feedback._id, feedback.status)}
                      className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm rounded-md`}
                    >
                      Submit Response
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FeedbackList;
import React, { useState, useEffect } from 'react';

const FeedbackList = ({ feedbacks, isHOD, onUpdateStatus }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [responseText, setResponseText] = useState('');
  
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
          className="bg-white shadow-md rounded-lg overflow-hidden"
        >
          <div className="p-4 cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-800">{feedback.title}</h3>
              <div className="flex space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                  {feedback.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
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
              feedback.response && (<>
                <button onClick={() => setExpandedId(expandedId === feedback._id ? null : feedback._id)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">

                  View Response 
                </button>
              </>)
            }
            </div>
          </div>
          
          {expandedId === feedback._id && (
            <div className="p-4 border-t border-gray-200">
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Description:</h4>
                <p className="text-gray-600 whitespace-pre-line">{feedback.description}</p>
              </div>
              
              {feedback.response && feedback.response.text && (
                <div className="mb-4 bg-blue-50 p-3 rounded-md">
                  <h4 className="font-medium text-gray-700 mb-1">Response:</h4>
                  <p className="text-gray-600">{feedback.response.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Responded by: {feedback.response.respondedBy?.displayName || 'Unknown'} on {formatDate(feedback.response.respondedAt)}
                  </p>
                </div>
              )}
              
              {isHOD && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Update Status:</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Pending', 'In Progress', 'Resolved', 'Rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleSubmitResponse(feedback._id, status)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          feedback.status === status
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-3">
                    <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-1">
                      Response (optional)
                    </label>
                    <textarea
                      id="response"
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a response to this feedback"
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleSubmitResponse(feedback._id, feedback.status)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
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
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const FeedbackForm = ({ onSubmitSuccess }) => {
  const { user, dbUser } = useAuth();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problemType: '',
    location: '',
    priority: 'Medium'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const feedbackData = {
        ...formData,
        submittedBy: dbUser._id,
        userRole: dbUser.role,
        college: dbUser.college
      };
      
      console.log("Submitting feedback data:", feedbackData);

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      setSuccess('Feedback submitted successfully!');
      setFormData({
        title: '',
        description: '',
        problemType: '',
        location: '',
        priority: 'Medium'
      });
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} shadow-md rounded-lg p-6 max-w-2xl mx-auto transition-colors duration-200`}>
      
      {error && (
        <div className={`${theme === 'dark' ? 'bg-red-900/30 border-red-600 text-red-300' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded mb-4`}>
          {error}
        </div>
      )}
      
      {success && (
        <div className={`${theme === 'dark' ? 'bg-green-900/30 border-green-600 text-green-300' : 'bg-green-100 border-green-400 text-green-700'} border px-4 py-3 rounded mb-4`}>
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Title field - full width */}
        <div className="w-full">
          <label htmlFor="title" className={`block font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
            placeholder="Brief title describing the issue"
          />
        </div>
        
        {/* Two column grid for problem type and priority */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="problemType" className={`block font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              Problem Type
            </label>
            <select
              id="problemType"
              name="problemType"
              value={formData.problemType}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
            >
              <option value="">Select a problem type</option>
              <option value="Technical">Technical</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Academic">Academic</option>
              <option value="Administrative">Administrative</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="priority" className={`block font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
        
        {/* Location field - full width */}
        <div className="w-full">
          <label htmlFor="location" className={`block font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
            Location (if applicable)
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
            placeholder="Room number, building name, etc."
          />
        </div>
        
        {/* Description field - full width */}
        <div className="w-full">
          <label htmlFor="description" className={`block font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="5"
            className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
            placeholder="Please provide details about the problem"
          />
        </div>
        
        {/* Submit button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${
              theme === 'dark' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            } ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
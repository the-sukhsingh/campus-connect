'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { withRoleProtection } from '@/utils/withRoleProtection';
import Link from 'next/link';

function EditAnnouncementPage({ params }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const announcementId = unwrappedParams.id;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [announcement, setAnnouncement] = useState(null);
  
  // Form data state updated to include expiry date
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expiryDate: ''
  });

  // Format date string to YYYY-MM-DD for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Fetch announcement details on component mount
  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!user || !announcementId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/announcements?action=get-by-id&id=${announcementId}&uid=${user?.uid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch announcement');
        }
        
        const data = await response.json();
        const announcement = data.announcement;
        
        if (!announcement) {
          throw new Error('Announcement not found');
        }
        
        setAnnouncement(announcement);
        setFormData({
          title: announcement.title,
          content: announcement.content,
          expiryDate: announcement.expiryDate ? formatDateForInput(announcement.expiryDate) : ''
        });
        
      } catch (error) {
        console.error('Error fetching announcement:', error);
        setMessage({
          type: 'error',
          text: error.message || 'Failed to load announcement'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnnouncement();
  }, [user, announcementId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setMessage({
        type: 'error',
        text: 'You must be logged in to update an announcement'
      });
      return;
    }
    
    // Validate form
    if (!formData.title.trim() || !formData.content.trim()) {
      setMessage({
        type: 'error',
        text: 'Title and content are required'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          action: 'update',
          announcementId,
          announcement: {
            ...formData,
            expiryDate: formData.expiryDate || undefined
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update announcement');
      }
      
      setMessage({
        type: 'success',
        text: 'Announcement updated successfully!'
      });
      
      // Redirect after successful submission
      setTimeout(() => {
        router.push('/dashboard/faculty/announcements');
      }, 2000);
      
    } catch (error) {
      console.error('Error updating announcement:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update announcement. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!announcement && !isLoading) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Error</p>
          <p>Announcement not found or you do not have permission to edit it.</p>
          <Link 
            href="/dashboard/faculty/announcements"
            className="mt-4 inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
          >
            Back to Announcements
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Edit Announcement</h1>
          <p className="text-gray-600 mt-1">
            Update your announcement details
          </p>
        </div>
        <Link
          href="/dashboard/faculty/announcements"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
        >
          Cancel & Return
        </Link>
      </div>

      {message.text && (
        <div 
          className={`p-4 mb-6 border-l-4 ${
            message.type === 'error' 
              ? 'bg-red-100 border-red-500 text-red-700' 
              : 'bg-green-100 border-green-500 text-green-700'
          }`} 
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Announcement Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter announcement title"
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Announcement Content *
              </label>
              <textarea
                id="content"
                name="content"
                rows={8}
                required
                value={formData.content}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter announcement details"
              ></textarea>
            </div>

            {/* Expiry Date */}
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                id="expiryDate"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating Announcement...
                </>
              ) : (
                'Update Announcement'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing HOD and faculty access
export default withRoleProtection(EditAnnouncementPage, ['hod', 'faculty']);
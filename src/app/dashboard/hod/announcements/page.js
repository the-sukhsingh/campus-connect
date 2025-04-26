'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function HodAnnouncementsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expiryDate: '',
    announcementId: ''
  });

  // Fetch all announcements in the college
  const fetchAnnouncements = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/announcements?uid=${user?.uid}&action=get-college-announcements`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setMessage({
        type: 'error',
        text: 'Failed to fetch announcements. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAnnouncements();
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date string to YYYY-MM-DD for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Handle announcement creation
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          action: 'create',
          announcement: {
            title: formData.title,
            content: formData.content,
            expiryDate: formData.expiryDate || undefined
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create announcement');
      }

      setMessage({
        type: 'success',
        text: 'Announcement created successfully!'
      });
      setFormData({
        title: '',
        content: '',
        expiryDate: '',
        announcementId: ''
      });
      setIsFormOpen(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create announcement. Please try again.'
      });
    }
  };

  // Handle announcement update
  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    if (!user || !formData.announcementId) return;

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          action: 'update',
          announcementId: formData.announcementId,
          announcement: {
            title: formData.title,
            content: formData.content,
            expiryDate: formData.expiryDate || undefined
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update announcement');
      }

      setMessage({
        type: 'success',
        text: 'Announcement updated successfully!'
      });
      setFormData({
        title: '',
        content: '',
        expiryDate: '',
        announcementId: ''
      });
      setIsFormOpen(false);
      setIsUpdateMode(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update announcement. Please try again.'
      });
    }
  };

  // Handle announcement deletion
  const handleDeleteAnnouncement = async (announcementId) => {
    if (!user) return;

    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          action: 'delete',
          announcementId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete announcement');
      }

      setMessage({
        type: 'success',
        text: 'Announcement deleted successfully!'
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to delete announcement. Please try again.'
      });
    }
  };

  // Handle edit button click
  const handleEditClick = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      expiryDate: announcement.expiryDate ? formatDateForInput(announcement.expiryDate) : '',
      announcementId: announcement._id
    });
    setIsUpdateMode(true);
    setIsFormOpen(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel form editing
  const handleCancelForm = () => {
    setFormData({
      title: '',
      content: '',
      expiryDate: '',
      announcementId: ''
    });
    setIsFormOpen(false);
    setIsUpdateMode(false);
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Manage Announcements</h1>
        <div>
          
          {!isFormOpen && (
            <button
              onClick={() => {
                setIsFormOpen(true);
                setIsUpdateMode(false);
                setFormData({
                  title: '',
                  content: '',
                  expiryDate: '',
                  announcementId: ''
                });
              }}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Announcement
            </button>
          )}
        </div>
      </div>

      {/* Notification message */}
      {message && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'error' ? (
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm">{message.text}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setMessage(null)}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none ${
                    message.type === 'error' ? 'text-red-500 hover:bg-red-100' : 'text-green-500 hover:bg-green-100'
                  }`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit announcement form */}
      {isFormOpen && (
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-6 mb-6`}>
          <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {isUpdateMode ? 'Edit Announcement' : 'Create New Announcement'}
          </h2>
          <form onSubmit={isUpdateMode ? handleUpdateAnnouncement : handleCreateAnnouncement}>
            <div className="mb-4">
              <label htmlFor="title" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'} rounded-md`}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="content" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Content *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={4}
                className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'} rounded-md`}
                required
              ></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="expiryDate" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Expiry Date <span className="text-xs text-gray-500">(Optional - when to automatically delete this announcement)</span>
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'} rounded-md`}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelForm}
                className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md ${theme === 'dark' ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isUpdateMode ? 'Update Announcement' : 'Create Announcement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements list */}
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg overflow-hidden`}>
        <div className={`px-6 py-4 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b`}>
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>All College Announcements</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className={`p-6 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>No announcements found.</p>
          </div>
        ) : (
          <div>
            <ul className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {announcements.map((announcement) => {
                const isExpired = announcement.expiryDate && new Date(announcement.expiryDate) < new Date();
                
                return (
                  <li key={announcement._id} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <div className="px-6 py-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{announcement.title}</h3>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Posted: {formatDate(announcement.createdAt)}
                        </span>
                      </div>
                      <div className={`whitespace-pre-wrap mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{announcement.content}</div>
                      <div className="flex justify-between items-center">
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          By: {announcement.createdBy?.displayName || announcement.createdBy?.email}
                          <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                            {announcement.createdBy?.role}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {announcement.expiryDate && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              isExpired 
                                ? (theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
                                : (theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
                            }`}>
                              {isExpired ? 'Expired' : 'Expires'}: {formatDate(announcement.expiryDate)}
                            </span>
                          )}
                          <button
                            onClick={() => handleEditClick(announcement)}
                            className={`inline-flex items-center px-2 py-1 border border-transparent rounded text-xs font-medium ${theme === 'dark' ? 'text-indigo-300 bg-indigo-900 hover:bg-indigo-800' : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement._id)}
                            className={`inline-flex items-center px-2 py-1 border border-transparent rounded text-xs font-medium ${theme === 'dark' ? 'text-red-300 bg-red-900 hover:bg-red-800' : 'text-red-700 bg-red-100 hover:bg-red-200'}`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing only HOD access
export default withRoleProtection(HodAnnouncementsPage, ['hod']);
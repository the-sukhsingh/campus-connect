'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function AnnouncementsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [classes, setClasses] = useState({});
  
  // Function to fetch faculty's announcements
  const fetchAnnouncements = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/announcements?action=get-my-announcements&uid=${user?.uid}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      
      const data = await response.json();
      setAnnouncements(data.announcements || []);
      
      // Extract all unique class IDs from announcements
      const classIds = data.announcements
        .filter(a => a.classId)
        .map(a => a.classId)
        .filter((value, index, self) => self.indexOf(value) === index);
      
      // If there are class-specific announcements, fetch class details
      if (classIds.length > 0) {
        fetchClassDetails(classIds);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError(error.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch class details for announcements
  const fetchClassDetails = async (classIds) => {
    try {
      const classesData = {};
      
      // Fetch classes taught by this faculty
      const response = await fetch(`/api/user/college/teachers?uid=${user?.uid}&action=assigned-classes`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Create a lookup object with class ID as key
        if (data.classes && data.classes.length > 0) {
          data.classes.forEach(classItem => {
            classesData[classItem._id] = classItem;
          });
        }
        
        setClasses(classesData);
      }
    } catch (error) {
      console.error('Error fetching class details:', error);
    }
  };
  
  // Load announcements on component mount
  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user]);
  
  // Handle announcement deletion
  const handleDelete = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          action: 'delete',
          announcementId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete announcement');
      }
      
      setMessage({
        type: 'success',
        text: 'Announcement deleted successfully!'
      });
      
      // Remove the deleted announcement from the list
      setAnnouncements(announcements.filter(a => a._id !== announcementId));
      
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to delete announcement'
      });
    }
  };
  
  // Function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-[var(--background)] text-white' : 'bg-gray-50'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>My Announcements</h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your announcements
          </p>
        </div>
        <Link
          href="/dashboard/faculty/announcements/create"
          className={`py-2 px-4 rounded transition-colors ${
            theme === 'dark'
              ? 'bg-indigo-700 hover:bg-indigo-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          Create New Announcement
        </Link>
      </div>

      {message.text && (
        <div 
          className={`p-4 mb-6 border-l-4 ${
            message.type === 'error' 
              ? (theme === 'dark' ? 'bg-red-900/30 border-red-500 text-red-200' : 'bg-red-100 border-red-500 text-red-700') 
              : (theme === 'dark' ? 'bg-green-900/30 border-green-500 text-green-200' : 'bg-green-100 border-green-500 text-green-700')
          }`} 
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
        </div>
      ) : error ? (
        <div className={`p-4 mb-4 border-l-4 ${theme === 'dark' ? 'bg-red-900/30 border-red-500 text-red-200' : 'bg-red-100 border-red-500 text-red-700'}`} role="alert">
          <p>{error}</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className={`rounded-lg shadow-sm p-8 text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>You haven&apos;t created any announcements yet.</p>
          <Link
            href="/dashboard/faculty/announcements/create"
            className={`inline-block py-2 px-4 rounded transition-colors ${
              theme === 'dark'
                ? 'bg-indigo-700 hover:bg-indigo-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            Create Your First Announcement
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {announcements.map((announcement) => (
            <div key={announcement._id} className={`rounded-lg shadow-md p-6 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className={`text-xl font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{announcement.title}</h2>
                  {announcement.classId && classes[announcement.classId] && (
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                        </svg>
                        Class: {classes[announcement.classId].name} ({classes[announcement.classId].department})
                      </span>
                    </div>
                  )}
                  {!announcement.classId && (
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        General Announcement
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/dashboard/faculty/announcements/edit/${announcement._id}`)}
                    className={`${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(announcement._id)}
                    className={`${theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Posted: {formatDate(announcement.createdAt)}
                {announcement.updatedAt !== announcement.createdAt && 
                  ` (Edited: ${formatDate(announcement.updatedAt)})`}
                {announcement.expiryDate && 
                  ` (Expires: ${formatDate(announcement.expiryDate)})`}
              </p>
              
              <div className="prose max-w-none">
                <p className={`whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{announcement.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing HOD and faculty access
export default withRoleProtection(AnnouncementsPage, ['hod', 'faculty']);
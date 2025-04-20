'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function AnnouncementsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
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
      
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError(error.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
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
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Announcements</h1>
          <p className="text-gray-600 mt-1">
            Manage your announcements
          </p>
        </div>
        <Link
          href="/dashboard/faculty/announcements/create"
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors"
        >
          Create New Announcement
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

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-gray-100 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600 mb-4">You haven&apos;t created any announcements yet.</p>
          <Link
            href="/dashboard/faculty/announcements/create"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors"
          >
            Create Your First Announcement
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {announcements.map((announcement) => (
            <div key={announcement._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold mb-2">{announcement.title}</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/dashboard/faculty/announcements/edit/${announcement._id}`)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(announcement._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                Posted: {formatDate(announcement.createdAt)}
                {announcement.updatedAt !== announcement.createdAt && 
                  ` (Edited: ${formatDate(announcement.updatedAt)})`}
                {announcement.expiryDate && 
                  ` (Expires: ${formatDate(announcement.expiryDate)})`}
              </p>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
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
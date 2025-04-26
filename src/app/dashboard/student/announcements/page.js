'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';

function StudentAnnouncementsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Function to fetch student's announcements
  const fetchAnnouncements = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get announcements relevant to the student (college-wide and for their classes)
      const response = await fetch(`/api/announcements?action=get-all&uid=${user?.uid}`);
      
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
  
  // Load announcements when component mounts
  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user]);
  
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
  
  // Function to open announcement details modal
  const openAnnouncementModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };
  
  // Function to close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-[var(--background)] text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            View all announcements for your college and classes
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center">
          <button 
            onClick={() => fetchAnnouncements()} 
            className={`flex items-center px-4 py-2 rounded-md ${
              theme === 'dark' 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {message.text && (
        <div 
          className={`p-4 mb-6 border-l-4 ${
            message.type === 'error' 
              ? 'bg-red-100 border-red-500 text-red-700' 
              : 'bg-green-100 border-green-500 text-green-700'
          } ${theme === 'dark' && message.type === 'error' ? 'bg-red-900/30' : ''}
          ${theme === 'dark' && message.type !== 'error' ? 'bg-green-900/30 text-green-200' : ''}`}
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Modal for viewing full announcement */}
      {showModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto`}>
            <div className={`flex justify-between items-start p-5 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-xl font-semibold">{selectedAnnouncement.title}</h3>
              <button 
                onClick={closeModal}
                className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-500'} focus:outline-none`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              {selectedAnnouncement.classId && (
                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    theme === 'dark' ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                    Class: {selectedAnnouncement.classId?.name} ({selectedAnnouncement.classId?.department})
                  </span>
                </div>
              )}
              {!selectedAnnouncement.classId && (
                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    theme === 'dark' ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    General Announcement
                  </span>
                </div>
              )}
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} mb-4`}>
                Posted: {formatDate(selectedAnnouncement.createdAt)}
                {selectedAnnouncement.updatedAt !== selectedAnnouncement.createdAt && 
                  ` (Updated: ${formatDate(selectedAnnouncement.updatedAt)})`}
                {selectedAnnouncement.expiryDate && 
                  ` (Expires: ${formatDate(selectedAnnouncement.expiryDate)})`}
              </p>
              <div className="mt-2">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                  Posted by: {selectedAnnouncement.createdBy?.displayName || selectedAnnouncement.createdBy?.email}
                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedAnnouncement.createdBy?.role}
                  </span>
                </p>
              </div>
              <div className="prose max-w-none mt-4">
                <p className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} whitespace-pre-wrap`}>{selectedAnnouncement.content}</p>
              </div>
            </div>
           
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
        </div>
      ) : error ? (
        <div className={`${theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-100 border-red-500 text-red-700'} border-l-4 p-4 mb-4`} role="alert">
          <p>{error}</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg shadow-sm p-8 text-center`}>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>There are no announcements available at this time.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {announcements.map((announcement) => (
            <div 
              key={announcement._id} 
              className={`${
                theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-white hover:shadow-lg'
              } rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200`}
              onClick={() => openAnnouncementModal(announcement)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-1">{announcement.title}</h2>
                  {announcement.classId && (
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        theme === 'dark' ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                        </svg>
                        {announcement.classId.name} ({announcement.classId.department})
                      </span>
                    </div>
                  )}
                  {!announcement.classId && (
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        theme === 'dark' ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        General Announcement
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatDate(announcement.createdAt)}
                  </span>
                </div>
              </div>
              
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} mb-2`}>
                Posted by: {announcement.createdBy?.displayName || announcement.createdBy?.email}
              </p>
              
              <div className="prose max-w-none line-clamp-3">
                <p className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{announcement.content}</p>
              </div>
              
              <button 
                className={`mt-4 text-sm ${
                  theme === 'dark' 
                    ? 'text-indigo-400 hover:text-indigo-300' 
                    : 'text-indigo-600 hover:text-indigo-800'
                } focus:outline-none`}
                onClick={(e) => {
                  e.stopPropagation();
                  openAnnouncementModal(announcement);
                }}
              >
                Read more
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing only student access
export default withRoleProtection(StudentAnnouncementsPage, ['student']);
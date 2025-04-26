'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { withRoleProtection } from '@/utils/withRoleProtection';
import Link from 'next/link';

function CreateAnnouncementPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form data state - updated to include expiry date and class selection
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expiryDate: '',
    classId: ''  
  });

  // Fetch assigned classes for this faculty
  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/user/college/teachers?uid=${user?.uid}&action=assigned-classes`);
        const responseSecond = await fetch(`/api/user/teacher/classes?uid=${user?.uid}`);
        if (!response.ok) {
          throw new Error('Failed to fetch classes');
        }
        if (!responseSecond.ok) {
          throw new Error('Failed to fetch classes');
        }
        const dataSecond = await responseSecond.json();
        const data = await response.json();
        setClasses([...data.classes, ...dataSecond.classes || []]);
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, [user]);

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
        text: 'You must be logged in to create an announcement'
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
          action: 'create',
          announcement: {
            title: formData.title,
            content: formData.content,
            expiryDate: formData.expiryDate || undefined,
            classId: formData.classId || undefined
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create announcement');
      }
      
      setMessage({
        type: 'success',
        text: 'Announcement created successfully!'
      });
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        expiryDate: '',
        classId: ''
      });
      
      // Redirect after successful submission
      setTimeout(() => {
        router.push('/dashboard/faculty/announcements');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating announcement:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create announcement. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-[var(--background)] text-white' : 'bg-gray-50'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Create New Announcement
          </h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Share important information with your students
          </p>
        </div>
        <Link
          href="/dashboard/faculty/announcements"
          className={`px-4 py-2 rounded transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          Cancel & Return
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

      <div className={`rounded-lg shadow-md p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Announcement Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter announcement title"
              />
            </div>

            {/* Class Selection */}
            <div>
              <label htmlFor="classId" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Target Class (Optional)
              </label>
              <select
                id="classId"
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">All Students (General Announcement)</option>
                {loading ? (
                  <option disabled>Loading classes...</option>
                ) : (
                  classes.map((classItem) => (
                    <option key={classItem._id} value={classItem._id}>
                      {classItem.name} ({classItem.department})
                    </option>
                  ))
                )}
              </select>
              <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Leave empty to create a general announcement
              </p>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Announcement Content *
              </label>
              <textarea
                id="content"
                name="content"
                rows={6}
                required
                value={formData.content}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter announcement details"
              ></textarea>
            </div>

            {/* Expiry Date */}
            <div>
              <label htmlFor="expiryDate" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Expiry Date (Optional)
              </label>
              <input
                id="expiryDate"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Leave empty for an announcement with no expiry date
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                theme === 'dark'
                  ? 'bg-indigo-700 hover:bg-indigo-600'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Announcement...
                </>
              ) : (
                'Create Announcement'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing HOD and faculty access
export default withRoleProtection(CreateAnnouncementPage, ['hod', 'faculty']);
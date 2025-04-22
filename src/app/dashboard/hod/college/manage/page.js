'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';



function CollegeManagePage() {
  const { user } = useAuth();
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  
  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    domain: '',
    departments: '',
    active: true
  });

  // Fetch college information
  useEffect(() => {
    const fetchCollegeInfo = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/user/college?uid=${user?.uid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch college information');
        }
        
        const data = await response.json();
        
        if (data.college) {
          setCollegeInfo(data.college);
          // Initialize form data with college info
          setFormData({
            name: data.college.name,
            code: data.college.code,
            domain: data.college.domain || '',
            departments: data.college.departments?.join(', ') || '',
            active: data.college.active
          });
        }
      } catch (error ) {
        console.error('Error fetching college data:', error);
        setMessage({
          type: 'error',
          text: 'Failed to load college information. Please try again later.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCollegeInfo();
  }, [user]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'active') {
      setFormData(prev => ({
        ...prev,
        active: value === 'true'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !collegeInfo) {
      setMessage({
        type: 'error',
        text: 'College information not loaded'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Process departments string into array
      const departments = formData.departments
        ? formData.departments.split(',').map(dep => dep.trim()).filter(dep => dep.length > 0)
        : [];
      
      const response = await fetch('/api/user/college', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          collegeId: collegeInfo._id,
          updates: {
            name: formData.name,
            code: formData.code,
            domain: formData.domain,
            departments,
            active: formData.active
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update college');
      }
      
      const data = await response.json();
      setCollegeInfo(data.college);
      
      setMessage({
        type: 'success',
        text: 'College updated successfully!'
      });
      
      setIsEditing(false);
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update college'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">College Management</h1>
          <p className="text-gray-600 mt-1">
            Update your college information and manage settings
          </p>
        </div>
        
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : !collegeInfo ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No college found. Please create your college first.
              </p>
              <div className="mt-4">
                <Link 
                  href="/dashboard/hod/college/setup" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:shadow-outline-indigo"
                >
                  Setup College
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">College Details</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Details
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data to current college info
                    setFormData({
                      name: collegeInfo.name,
                      code: collegeInfo.code,
                      domain: collegeInfo.domain || '',
                      departments: collegeInfo.departments?.join(', ') || '',
                      active: collegeInfo.active
                    });
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50">
            <div className="border rounded-md overflow-hidden">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="bg-white p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        College Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                        College Code
                      </label>
                      <input
                        id="code"
                        name="code"
                        type="text"
                        required
                        value={formData.code}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Domain
                      </label>
                      <input
                        id="domain"
                        name="domain"
                        type="text"
                        value={formData.domain}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., gndu.ac.in"
                      />
                    </div>
                    <div>
                      <label htmlFor="active" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        id="active"
                        name="active"
                        value={formData.active.toString()}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="departments" className="block text-sm font-medium text-gray-700 mb-1">
                      Departments (comma-separated)
                    </label>
                    <textarea
                      id="departments"
                      name="departments"
                      value={formData.departments}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-white p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">College Name</h3>
                      <p className="mt-1 text-sm text-gray-900">{collegeInfo.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">College Code</h3>
                      <p className="mt-1 text-sm text-gray-900">{collegeInfo.code}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email Domain</h3>
                      <p className="mt-1 text-sm text-gray-900">{collegeInfo.domain || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <p className="mt-1 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          collegeInfo.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {collegeInfo.active ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500">Departments</h3>
                      {collegeInfo.departments && collegeInfo.departments.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {collegeInfo.departments.map((dept, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800"
                            >
                              {dept}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">No departments specified</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created On</h3>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(collegeInfo.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          
        </div>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing only HOD access
export default withRoleProtection(CollegeManagePage, ['hod']);
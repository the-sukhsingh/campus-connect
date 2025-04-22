'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function TeachersManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState([]);
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pending'
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedDepartments, setSelectedDepartments] = useState({});
  const [librarianSelections, setLibrarianSelections] = useState({});

  // New state for Add Faculty functionality
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFacultyData, setNewFacultyData] = useState({
    email: '',
    displayName: '',
    department: '',
    isLibrarian: false,
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch college and teachers data
  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Fetch college information for this HOD
      const collegeResponse = await fetch(`/api/user/college?uid=${user?.uid}`);

      if (!collegeResponse.ok) {
        throw new Error('Failed to fetch college information');
      }

      const collegeData = await collegeResponse.json();

      if (!collegeData.college) {
        setCollegeInfo(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setCollegeInfo(collegeData.college);

      // Fetch all teachers in this college
      const teachersResponse = await fetch(`/api/user/college/teachers?uid=${user?.uid}&collegeId=${collegeData.college._id}`);

      if (!teachersResponse.ok) {
        throw new Error('Failed to fetch teachers');
      }

      const teachersData = await teachersResponse.json();
      console.log("Teacher's data:", teachersData.teachers);
      setTeachers(teachersData.teachers || []);

      
    } catch (error ) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data. Please try again.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle department selection change
  const handleDepartmentChange = (teacherId, department) => {
    setSelectedDepartments({
      ...selectedDepartments,
      [teacherId]: department
    });
  };

  // Handle librarian checkbox change
  const handleLibrarianChange = (teacherId, isLibrarian) => {
    setLibrarianSelections({
      ...librarianSelections,
      [teacherId]: isLibrarian
    });
  };

  

  // Handle refresh action
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
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

  // Handle opening the add faculty modal
  const openAddFacultyModal = () => {
    if (collegeInfo && collegeInfo.departments && collegeInfo.departments.length > 0) {
      setNewFacultyData({
        ...newFacultyData,
        department: collegeInfo.departments[0]
      });
    }
    setShowAddModal(true);
  };

  // Handle input change for new faculty form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewFacultyData({
      ...newFacultyData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  // Validate the new faculty form
  const validateFacultyForm = () => {
    const errors = {};
    
    if (!newFacultyData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newFacultyData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!newFacultyData.displayName.trim()) {
      errors.displayName = 'Name is required';
    }
    
    if (!newFacultyData.department) {
      errors.department = 'Department is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle creating a new faculty account
  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    
    if (!validateFacultyForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorUid: user?.uid,
          creatorRole: 'hod',
          userData: {
            email: newFacultyData.email.toLowerCase(),
            displayName: newFacultyData.displayName,
            role: 'faculty',
            department: newFacultyData.department,
            isLibrarian: newFacultyData.isLibrarian,
            collegeId: collegeInfo._id
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create faculty account');
      }
      
      const data = await response.json();
      
      // Add the new faculty to the teachers list
      if (data.user) {
        setTeachers(prev => [
          ...prev,
          {
            ...data.user,
            status: 'approved'
          }
        ]);
      }
      
      // Close the modal and reset form
      setShowAddModal(false);
      setNewFacultyData({
        email: '',
        displayName: '',
        department: collegeInfo.departments?.[0] || '',
        isLibrarian: false,
      });
      
      // Show success message
      setMessage({
        type: 'success',
        text: `Faculty account created successfully! An email with login instructions has been sent to ${newFacultyData.email}.`
      });
      
      // Clear the message after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Error creating faculty account. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Teachers Management</h1>
          <p className="text-gray-600 mt-1">
            Manage teachers in your college
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Add Faculty Button */}
          {collegeInfo && (
            <button
              onClick={openAddFacultyModal}
              className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors"
              title="Add new faculty member"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Faculty
            </button>
          )}
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 px-4 rounded transition-colors"
            title="Refresh data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <Link
            href="/dashboard/hod"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
          >
            Back to Dashboard
          </Link>
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
                You need to set up your college first. Please go to the College Setup page.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/dashboard/hod/college/setup')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none"
                >
                  Set Up College
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Teachers tab navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Teachers
              </button>
            </nav>
          </div>

          {activeTab === 'all' ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">All Teachers</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Showing all teachers approved for your college
                </p>
              </div>
              {teachers.length === 0 ? (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  No teachers have been approved yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teachers.map((teacher) => (
                        <tr key={teacher._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.displayName || 'Unnamed Teacher'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{teacher.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {teacher.department || 'Not specified'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {teacher.role || 'Not specified'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Approved
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(teacher.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Teacher Requests</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Review and manage teacher requests to join your college
                  </p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center p-2 border border-transparent rounded-md text-indigo-600 hover:bg-indigo-50"
                  title="Refresh pending requests"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              {pendingTeachers.length === 0 ? (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  No pending teacher requests at this time.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Request Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Librarian
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingTeachers.map((teacher) => (
                        <tr key={teacher._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.displayName || 'Unnamed Teacher'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{teacher.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(teacher.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={selectedDepartments[teacher._id] || ''}
                              onChange={(e) => handleDepartmentChange(teacher._id, e.target.value)}
                              className="text-sm border-gray-300 rounded-md"
                            >
                              {collegeInfo.departments?.map((department) => (
                                <option key={department} value={department}>
                                  {department}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={librarianSelections[teacher._id] || false}
                              onChange={(e) => handleLibrarianChange(teacher._id, e.target.checked)}
                              className="form-checkbox h-5 w-5 text-indigo-600"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleTeacherAction(teacher._id, 'approve')}
                                disabled={isSubmitting}
                                className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none ${
                                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleTeacherAction(teacher._id, 'reject')}
                                disabled={isSubmitting}
                                className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none ${
                                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </>
      )}

      {/* Add Faculty Modal */}
      {showAddModal && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 bg-opacity-50 transition-opacity" onClick={() => setShowAddModal(false)}></div>
          
          <div className="relative bg-white rounded-lg max-w-lg w-full mx-4 shadow-xl transform transition-all">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Create Faculty Account</h3>
                <button 
                  type="button" 
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setShowAddModal(false)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateFaculty}>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newFacultyData.email}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="faculty@example.com"
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={newFacultyData.displayName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border ${validationErrors.displayName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="Dr. John Smith"
                  />
                  {validationErrors.displayName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.displayName}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    id="department"
                    name="department"
                    value={newFacultyData.department}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border ${validationErrors.department ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                  >
                    {collegeInfo.departments?.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                  {validationErrors.department && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.department}</p>
                  )}
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isLibrarian"
                    name="isLibrarian"
                    checked={newFacultyData.isLibrarian}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isLibrarian" className="ml-2 block text-sm text-gray-900">
                    Assign as librarian
                  </label>
                </div>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        A temporary password will be generated and sent to the faculty member&apos;s email address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 text-right border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing only HOD access
export default withRoleProtection(TeachersManagementPage, ['hod']);
'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, Trash2 } from 'lucide-react';

function TeachersManagementPage() {
  const { theme } = useTheme();
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

  // State for Add Faculty functionality
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFacultyData, setNewFacultyData] = useState({
    email: '',
    displayName: '',
    department: '',
    isLibrarian: false,
  });

  // State for Edit Faculty functionality
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTeacherId, setEditTeacherId] = useState(null);
  const [editFacultyData, setEditFacultyData] = useState({
    displayName: '',
    department: '',
    isLibrarian: false,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [editValidationErrors, setEditValidationErrors] = useState({});

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


    } catch (error) {
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
        text: `Faculty account created successfully!`
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

  // Handle opening the edit modal and populate data
  const openEditModal = (teacher) => {
    setEditTeacherId(teacher._id);
    setEditFacultyData({
      displayName: teacher.displayName || '',
      department: teacher.department || (collegeInfo.departments?.[0] || ''),
      isLibrarian: teacher.role === 'librarian',
    });
    setShowEditModal(true);
  };

  // Handle input change for edit form
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFacultyData({
      ...editFacultyData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear validation error when field is edited
    if (editValidationErrors[name]) {
      setEditValidationErrors({
        ...editValidationErrors,
        [name]: ''
      });
    }
  };

  // Validate edit faculty form
  const validateEditFacultyForm = () => {
    const errors = {};

    if (!editFacultyData.displayName.trim()) {
      errors.displayName = 'Name is required';
    }

    if (!editFacultyData.department) {
      errors.department = 'Department is required';
    }

    setEditValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle updating a teacher
  const handleUpdateTeacher = async (e) => {
    e.preventDefault();

    if (!validateEditFacultyForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/user/college/teachers/manage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          teacherId: editTeacherId,
          updates: {
            displayName: editFacultyData.displayName,
            department: editFacultyData.department,
            isLibrarian: editFacultyData.isLibrarian,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update teacher');
      }

      const data = await response.json();

      // Update the teacher in the list
      setTeachers(prevTeachers =>
        prevTeachers.map(teacher =>
          teacher._id === editTeacherId
            ? {
              ...teacher,
              displayName: editFacultyData.displayName,
              department: editFacultyData.department,
              role: editFacultyData.isLibrarian ? 'librarian' : 'faculty'
            }
            : teacher
        )
      );

      // Close modal and reset state
      setShowEditModal(false);
      setEditTeacherId(null);
      setEditFacultyData({
        displayName: '',
        department: '',
        isLibrarian: false,
      });

      // Show success message
      setMessage({
        type: 'success',
        text: 'Teacher updated successfully!'
      });

      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update teacher. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a teacher
  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (!window.confirm(`Are you sure you want to delete ${teacherName || 'this teacher'}? This action cannot be undone and will remove their account completely.`)) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/user/college/teachers/manage', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          teacherId: teacherId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete teacher');
      }

      // Remove the teacher from the list
      setTeachers(prevTeachers =>
        prevTeachers.filter(teacher => teacher._id !== teacherId)
      );

      // Show success message
      setMessage({
        type: 'success',
        text: 'Teacher removed successfully!'
      });

      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to remove teacher. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-[var(--background)] text-[var(--foreground)]' : 'bg-[var(--background)] text-[var(--foreground)]'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Teachers Management</h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage teachers in your college
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Download Buttons */}
          {collegeInfo && (
            <div className="flex gap-2">
              <button
                onClick={() => window.open(`/api/export/teachers?uid=${user?.uid}&collegeId=${collegeInfo._id}&format=csv`, '_blank')}
                className={`inline-flex items-center gap-1 py-2 px-3 rounded border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-green-900 text-green-100 hover:bg-green-800 border-green-700' 
                    : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'
                }`}
                title="Download as CSV"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                CSV
              </button>
              <button
                onClick={() => window.open(`/api/export/teachers?uid=${user?.uid}&collegeId=${collegeInfo._id}&format=pdf`, '_blank')}
                className={`inline-flex items-center gap-1 py-2 px-3 rounded border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-blue-900 text-blue-100 hover:bg-blue-800 border-blue-700' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                }`}
                title="Download as PDF"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                PDF
              </button>
            </div>
          )}

          {/* Add Faculty Button */}
          {collegeInfo && (
            <button
              onClick={openAddFacultyModal}
              className={`inline-flex items-center gap-1 py-2 px-4 rounded transition-colors ${
                theme === 'dark'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
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
            className={`inline-flex items-center gap-1 py-2 px-4 rounded transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
            }`}
            title="Refresh data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 mb-6 border-l-4 ${
            message.type === 'error'
              ? theme === 'dark'
                ? 'bg-red-900/50 border-red-700 text-red-100'
                : 'bg-red-100 border-red-500 text-red-700'
              : theme === 'dark'
                ? 'bg-green-900/50 border-green-700 text-green-100'
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
        <div className={`border-l-4 p-4 mb-6 ${
          theme === 'dark'
            ? 'bg-yellow-900/50 border-yellow-700 text-yellow-100'
            : 'bg-yellow-50 border-yellow-400'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm ${theme === 'dark' ? 'text-yellow-100' : 'text-yellow-700'}`}>
                You need to set up your college first. Please go to the College Setup page.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/dashboard/hod/college/setup')}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md ${
                    theme === 'dark'
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  } focus:outline-none`}
                >
                  Set Up College
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={`shadow rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-4 py-5 sm:px-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg leading-6 font-medium">All Teachers</h3>
              <p className={`mt-1 max-w-2xl text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Showing all teachers approved for your college
              </p>
            </div>
            {teachers.length === 0 ? (
              <div className={`px-4 py-5 sm:p-6 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                No teachers have been approved yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  <thead className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Department
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Joined
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${theme === 'dark' ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}`}>
                    {teachers.map((teacher) => (
                      <tr key={teacher._id} className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            {teacher.displayName || 'Unnamed Teacher'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{teacher.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                            {teacher.department || 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                            {teacher.role || 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            theme === 'dark' 
                              ? 'bg-green-800 text-green-100'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            Approved
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                          {formatDate(teacher.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(teacher)}
                              className={`inline-flex items-center justify-center p-2 rounded-md ${
                                theme === 'dark' 
                                  ? 'text-blue-400 bg-blue-900/30 hover:bg-blue-900/50'
                                  : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                              } transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`}
                              title="Edit teacher"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(teacher._id, teacher.displayName)}
                              className={`inline-flex items-center justify-center p-2 rounded-md ${
                                theme === 'dark' 
                                  ? 'text-red-400 bg-red-900/30 hover:bg-red-900/50'
                                  : 'text-red-600 bg-red-50 hover:bg-red-100'
                              } transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1`}
                              title="Delete teacher"
                            >
                              <Trash2 className="h-4 w-4" />
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

        </>
      )}

      {/* Add Faculty Modal */}
      {showAddModal && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 bg-opacity-50 transition-opacity" onClick={() => setShowAddModal(false)}></div>

          <div className={`relative max-w-lg w-full mx-4 shadow-xl transform transition-all rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-5 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Create Faculty Account</h3>
                <button
                  type="button"
                  className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
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
                  <label htmlFor="email" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newFacultyData.email}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full shadow-sm py-2 px-3 rounded-md ${
                      validationErrors.email 
                        ? 'border-red-500' 
                        : theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="faculty@example.com"
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="displayName" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={newFacultyData.displayName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full shadow-sm py-2 px-3 rounded-md ${
                      validationErrors.displayName 
                        ? 'border-red-500' 
                        : theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="Dr. John Smith"
                  />
                  {validationErrors.displayName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.displayName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="department" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Department</label>
                  <select
                    id="department"
                    name="department"
                    value={newFacultyData.department}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full shadow-sm py-2 px-3 rounded-md ${
                      validationErrors.department 
                        ? 'border-red-500' 
                        : theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
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
                    className={`h-4 w-4 focus:ring-indigo-500 rounded ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600 text-indigo-500' : 'border-gray-300 text-indigo-600'
                    }`}
                  />
                  <label htmlFor="isLibrarian" className={`ml-2 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    Assign as librarian
                  </label>
                </div>

                <div className={`border-l-4 p-4 ${
                  theme === 'dark' 
                    ? 'bg-yellow-900/30 border-yellow-700'
                    : 'bg-yellow-50 border-yellow-400'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className={`h-5 w-5 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-700'}`}>
                        A temporary password will be generated. <br />
                        For Faculty accounts the password is faculty@123. <br />
                        For Librarian accounts the password is librarian@123.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`px-6 py-4 text-right border-t ${
                theme === 'dark' ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`inline-flex justify-center px-4 py-2 text-sm font-medium rounded-md mr-2 ${
                    theme === 'dark'
                      ? 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600'
                      : 'text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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

      {/* Edit Faculty Modal */}
      {showEditModal && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 bg-opacity-50 transition-opacity" onClick={() => setShowEditModal(false)}></div>

          <div className={`relative max-w-lg w-full mx-4 shadow-xl transform transition-all rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-5 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Edit Teacher Details</h3>
                <button
                  type="button"
                  className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
                  onClick={() => setShowEditModal(false)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateTeacher}>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label htmlFor="displayName" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={editFacultyData.displayName}
                    onChange={handleEditInputChange}
                    className={`mt-1 block w-full shadow-sm py-2 px-3 rounded-md ${
                      editValidationErrors.displayName 
                        ? 'border-red-500' 
                        : theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="Dr. John Smith"
                  />
                  {editValidationErrors.displayName && (
                    <p className="mt-1 text-sm text-red-600">{editValidationErrors.displayName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="department" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Department</label>
                  <select
                    id="department"
                    name="department"
                    value={editFacultyData.department}
                    onChange={handleEditInputChange}
                    className={`mt-1 block w-full shadow-sm py-2 px-3 rounded-md ${
                      editValidationErrors.department 
                        ? 'border-red-500' 
                        : theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                  >
                    {collegeInfo.departments?.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                  {editValidationErrors.department && (
                    <p className="mt-1 text-sm text-red-600">{editValidationErrors.department}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isLibrarian"
                    name="isLibrarian"
                    checked={editFacultyData.isLibrarian}
                    onChange={handleEditInputChange}
                    className={`h-4 w-4 focus:ring-indigo-500 rounded ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600 text-indigo-500' : 'border-gray-300 text-indigo-600'
                    }`}
                  />
                  <label htmlFor="isLibrarian" className={`ml-2 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    Assign as librarian
                  </label>
                </div>
              </div>

              <div className={`px-6 py-4 text-right border-t ${
                theme === 'dark' ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={`inline-flex justify-center px-4 py-2 text-sm font-medium rounded-md mr-2 ${
                    theme === 'dark'
                      ? 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600'
                      : 'text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update Teacher'
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
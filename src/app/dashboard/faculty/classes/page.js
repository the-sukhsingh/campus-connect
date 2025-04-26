'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function ClassesManagementPage() {
  const { user, dbUser } = useAuth();
  const { theme } = useTheme();
  const [classes, setClasses] = useState([]);
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);
  const [isDeletingClass, setIsDeletingClass] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    course: '',
    department: '',
    otherDepartment: '',
    totalSemesters: 8,
    currentSemester: 1,
    batch: ''
  });

  // Form state for creating a new class
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    department: dbUser?.department || '',
    otherDepartment: '',
    totalSemesters: 8,
    currentSemester: 1,
    batch: ''
  });
  // Common department options
  const [departmentOptions, setDepartmentOptions] = useState([]);

  // Fetch college and classes data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch college information for this faculty
        const collegeResponse = await fetch(`/api/user/teacher/college?uid=${user?.uid}`);

        if (!collegeResponse.ok) {
          throw new Error('Failed to fetch college information');
        }

        const collegeData = await collegeResponse.json();
        console.log('College Data:', collegeData);
        if (!collegeData.college || collegeData.status !== 'approved') {
          setCollegeInfo(null);
          setLoading(false);
          return;
        }
        setCollegeInfo(collegeData.college);
        setDepartmentOptions([collegeData.college.department, 'Other']);

        // Fetch classes created by this teacher
        const classesResponse = await fetch(`/api/user/teacher/classes?uid=${user?.uid}`);
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes');
        }

        const classesData = await classesResponse.json();
        setClasses(classesData.classes || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({
          type: 'error',
          text: 'Failed to load data. Please try again later.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission to create a new class
  const handleCreateClass = async (e) => {
    e.preventDefault();

    // Form validation
    const { name, course, department, otherDepartment, currentSemester, batch, totalSemesters } = formData;
    if (!name || !course || !department || !currentSemester || !totalSemesters || !batch || (department === 'Other' && !otherDepartment)) {
      setMessage({
        type: 'error',
        text: 'All fields are required'
      });
      return;
    }

    if (!collegeInfo || !user) {
      setMessage({
        type: 'error',
        text: 'You need to be part of a college to create classes'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/user/teacher/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          collegeId: collegeInfo._id,
          classData: {
            ...formData,
            department: department === 'Other' ? otherDepartment : department
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create class');
      }

      const data = await response.json();
      console.log('Class created:', data.class);

      // Add the new class to the list
      setClasses((prev) => [data.class, ...prev]);

      // Reset form and hide it
      setFormData({
        name: '',
        course: '',
        department: '',
        otherDepartment: '',
        semester: '',
        totalSemesters: 8,
        currentSemester: 1,
        batch: ''
      });

      setShowForm(false);

      setMessage({
        type: 'success',
        text: 'Class created successfully! Share the class ID with students to allow them to join.'
      });

      // Clear the message after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create class. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit class mode
  const handleEditClass = (classItem) => {
    setEditingClassId(classItem._id);
    setEditFormData({
      name: classItem.name || '',
      course: classItem.course || '',
      department: departmentOptions.includes(classItem.department) ? classItem.department : 'Other',
      otherDepartment: departmentOptions.includes(classItem.department) ? '' : classItem.department,
      totalSemesters: classItem.totalSemesters || 8,
      currentSemester: classItem.currentSemester || 1,
      batch: classItem.batch || ''
    });
  };

  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Close the edit form modal
  const closeEditForm = () => {
    setEditingClassId(null);
    setEditFormData({
      name: '',
      course: '',
      department: '',
      otherDepartment: '',
      totalSemesters: 8,
      currentSemester: 1,
      batch: ''
    });
  };

  // Handle update class submission
  const handleUpdateClass = async (e) => {
    e.preventDefault();

    // Form validation
    const { name, course, department, otherDepartment, currentSemester, totalSemesters, batch } = editFormData;
    if (!name || !course || !department || !currentSemester || !totalSemesters || !batch || (department === 'Other' && !otherDepartment)) {
      setMessage({
        type: 'error',
        text: 'All fields are required'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/user/teacher/classes/${editingClassId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          updateData: {
            ...editFormData,
            department: department === 'Other' ? otherDepartment : department
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update class');
      }

      const data = await response.json();

      // Update the class in the list
      setClasses((prev) =>
        prev.map((classItem) =>
          classItem._id === editingClassId ? { ...classItem, ...editFormData } : classItem
        )
      );

      // Close form and show success message
      closeEditForm();

      setMessage({
        type: 'success',
        text: 'Class updated successfully!'
      });

      // Clear the message after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update class. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle class deletion
  const handleDeleteClass = async (classItem) => {
    if (!user || !classItem?._id) return;

    // Show confirmation dialog
    if (
      !confirm(
        `Are you sure you want to delete the class "${classItem.name}"? This action cannot be undone and will remove all associated data including student enrollments and faculty assignments.`
      )
    ) {
      return;
    }

    try {
      setIsDeletingClass(true);

      const response = await fetch(`/api/user/teacher/classes/${classItem._id}?uid=${user?.uid}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete class');
      }

      // Remove the class from the list
      setClasses((prevClasses) => prevClasses.filter((cls) => cls._id !== classItem._id));

      // Show success message
      setMessage({
        type: 'success',
        text: `Class "${classItem.name}" has been deleted successfully`
      });

      // Clear the message after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    } catch (error) {
      console.error('Error deleting class:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to delete class. Please try again.'
      });
    } finally {
      setIsDeletingClass(false);
    }
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

  // Count students by status
  const getStudentCountsByStatus = (classItem) => {
    const total = classItem?.students?.length || 0;

    return total;
  };

  // Copy class ID to clipboard
  const copyClassId = (classId) => {
    navigator.clipboard.writeText(classId);
    setMessage({
      type: 'success',
      text: 'Class ID copied to clipboard!'
    });

    // Clear the message after 3 seconds
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 3000);
  };

  return (
    <div className={`p-4 md:p-6 max-w-7xl mx-auto ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1
            className={`text-2xl md:text-3xl font-bold ${
              theme === 'dark' ? 'text-white' : 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600'
            }`}
          >
            Classes Management
          </h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Create and manage your classes, approve student requests
          </p>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded-lg border-l-4 ${
            message.type === 'error'
              ? theme === 'dark'
                ? 'bg-red-900/30 border-red-700 text-red-300'
                : 'bg-red-50 border-red-500 text-red-700'
              : theme === 'dark'
              ? 'bg-green-900/30 border-green-700 text-green-300'
              : 'bg-green-50 border-green-500 text-green-700'
          }`}
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {loading && !selectedClass ? (
        <div className="flex justify-center items-center h-64">
          <div
            className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
              theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'
            }`}
          ></div>
        </div>
      ) : !collegeInfo ? (
        <div
          className={`${
            theme === 'dark' ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-400'
          } border-l-4 p-4 mb-6 rounded-lg shadow-sm`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center">
            <div
              className={`flex-shrink-0 mb-3 sm:mb-0 sm:mr-3 ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-400'
              }`}
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p
                className={`text-sm ${
                  theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
                } mb-3`}
              >
                You need to join a college before you can create classes. Please go to the Faculty Dashboard to join a college.
              </p>
              <Link
                href="/dashboard/faculty"
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                  theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-500'
                } focus:outline-none focus:shadow-outline-indigo transition duration-150 ease-in-out shadow-sm`}
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : selectedClass ? (
        <>
          <div className="mb-6">
            <button
              onClick={() => setSelectedClass(null)}
              className={`mb-4 inline-flex items-center px-3 py-2 border ${
                theme === 'dark'
                  ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              } text-sm font-medium rounded-md focus:outline-none transition-colors duration-150 ease-in-out shadow-sm`}
            >
              <svg
                className={`mr-2 h-5 w-5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Classes
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Create Class Button */}
          <div
            className={`${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'
            } rounded-lg shadow-md p-5 mb-6 transition-all duration-300 hover:shadow-lg border`}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="mb-4 sm:mb-0">
                <h2
                  className={`text-xl font-semibold ${
                    theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
                  }`}
                >
                  Your Classes
                </h2>
                <p
                  className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  } mt-1`}
                >
                  Create and manage your classes for {collegeInfo.name}
                </p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md focus:outline-none transition-colors duration-150 ease-in-out ${
                  showForm
                    ? theme === 'dark'
                      ? 'text-gray-300 bg-gray-700 hover:bg-gray-600'
                      : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                    : theme === 'dark'
                    ? 'text-white bg-indigo-500 hover:bg-indigo-600'
                    : 'text-white bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {showForm ? (
                  <>
                    <svg
                      className="mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Cancel
                  </>
                ) : (
                  <>
                    <svg
                      className="mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Create New Class
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Create Class Form */}
          {showForm && (
            <div
              className={`${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'
              } rounded-lg shadow-md p-6 mb-6 transition-all duration-300 animate-fade-in border`}
            >
              <h2
                className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
                }`}
              >
                Create New Class
              </h2>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className={`block text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}
                    >
                      Class Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                      placeholder="e.g., B.Tech Computer Science"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="course"
                      className={`block text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}
                    >
                      Course Code *
                    </label>
                    <input
                      id="course"
                      name="course"
                      type="text"
                      required
                      value={formData.course}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                      placeholder="e.g., CS101"
                    />
                  </div>
                </div>

                <div
                  className={`grid grid-cols-1 gap-4 ${
                    formData.department !== 'Other' ? 'md:grid-cols-2' : 'md:grid-cols-3'
                  }`}
                >
                  <div>
                    <label
                      htmlFor="department"
                      className={`block text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}
                    >
                      Department *
                    </label>
                    <select
                      id="department"
                      name="department"
                      required
                      value={formData.department}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                    >
                      <option value="">Select Department</option>
                      {departmentOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    className={` ${
                      formData.department !== 'Other' ? 'hidden col-span-2' : ''
                    }`}
                  >
                    {formData.department === 'Other' ? (
                      <div>
                        <label
                          htmlFor="otherDepartment"
                          className={`block text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          } mb-1`}
                        >
                          Specify Department *
                        </label>
                        <input
                          id="otherDepartment"
                          name="otherDepartment"
                          type="text"
                          required
                          value={formData.otherDepartment}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                              : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                          } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                          placeholder="e.g., Aerospace Engineering"
                        />
                      </div>
                    ) : (
                      <div className="invisible">
                        <label
                          className={`block text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          } mb-1`}
                        >
                          Placeholder
                        </label>
                        <div className="w-full px-3 py-2 border border-transparent rounded-md"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="batch"
                      className={`block text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}
                    >
                      Batch/Year *
                    </label>
                    <select
                      id="batch"
                      name="batch"
                      required
                      value={formData.batch}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="totalSemesters"
                      className={`block text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}
                    >
                      Total Semesters
                    </label>
                    <input
                      id="totalSemesters"
                      name="totalSemesters"
                      type="number"
                      min="1"
                      max="16"
                      value={formData.totalSemesters}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                    />
                    <p
                      className={`mt-1 text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Default: 8
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="currentSemester"
                      className={`block text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}
                    >
                      Current Semester
                    </label>
                    <input
                      id="currentSemester"
                      name="currentSemester"
                      type="number"
                      min="1"
                      max={formData.totalSemesters}
                      value={formData.currentSemester}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                    />
                    <p
                      className={`mt-1 text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Default: 1
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      theme === 'dark'
                        ? 'bg-indigo-500 hover:bg-indigo-600'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Class'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Classes List */}
          <div
            className={`${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'
            } rounded-lg shadow-md overflow-hidden`}
          >
            {classes.length === 0 ? (
              <div className="p-8 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-16 w-16 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
                  } mx-auto mb-4`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <p
                  className={`${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  } mb-4 text-lg`}
                >
                  You haven&apos;t created any classes yet
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className={`inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    theme === 'dark'
                      ? 'bg-indigo-500 hover:bg-indigo-600'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } focus:outline-none transition-colors duration-150 ease-in-out shadow-sm`}
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Create Your First Class
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead
                    className={`${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <tr>
                      <th
                        scope="col"
                        className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        } uppercase tracking-wider`}
                      >
                        Class
                      </th>
                      <th
                        scope="col"
                        className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        } uppercase tracking-wider`}
                      >
                        Students
                      </th>
                      <th
                        scope="col"
                        className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        } uppercase tracking-wider`}
                      >
                        Created
                      </th>
                      <th
                        scope="col"
                        className={`px-4 sm:px-6 py-3 text-xs font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        } uppercase tracking-wider text-center`}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    } divide-y ${
                      theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                    }`}
                  >
                    {classes.map((classItem) => {
                      const studentCounts =
                        getStudentCountsByStatus(classItem);
                      return (
                        <tr
                          key={classItem?._id}
                          className={`${
                            theme === 'dark'
                              ? 'hover:bg-gray-700'
                              : 'hover:bg-gray-50'
                          } transition-colors duration-150`}
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div
                              className={`text-sm font-medium ${
                                theme === 'dark'
                                  ? 'text-gray-100'
                                  : 'text-gray-900'
                              }`}
                            >
                              {classItem?.name}
                            </div>
                            <div
                              className={`text-sm ${
                                theme === 'dark'
                                  ? 'text-gray-400'
                                  : 'text-gray-500'
                              }`}
                            >
                              {`${classItem?.course} | ${classItem?.department}`}
                            </div>
                            <div
                              className={`text-xs ${
                                theme === 'dark'
                                  ? 'text-gray-500'
                                  : 'text-gray-500'
                              } mt-1`}
                            >
                              Semester {classItem?.currentSemester || 1} of{' '}
                              {classItem?.totalSemesters || 8}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span
                                className={`text-sm ${
                                  theme === 'dark'
                                    ? 'text-gray-100'
                                    : 'text-gray-900'
                                } font-medium`}
                              >
                                {`${studentCounts} student` +
                                  (studentCounts > 1 ? 's' : '')}
                              </span>
                            </div>
                          </td>
                          <td
                            className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm ${
                              theme === 'dark'
                                ? 'text-gray-400'
                                : 'text-gray-500'
                            }`}
                          >
                            {formatDate(classItem?.createdAt)}
                          </td>
                          <td
                            className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              theme === 'dark'
                                ? 'text-gray-300'
                                : 'text-gray-900'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row gap-2 justify-end items-center">
                              <div className="flex flex-row gap-2">
                                <Link
                                  href={`/dashboard/faculty/classes/manage?classId=${classItem?._id}`}
                                  className={`inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white ${
                                    theme === 'dark'
                                      ? 'bg-indigo-500 hover:bg-indigo-600'
                                      : 'bg-indigo-600 hover:bg-indigo-700'
                                  } focus:outline-none transition-colors duration-150`}
                                >
                                  Faculty
                                </Link>
                                <Link
                                  href={`/dashboard/faculty/classes/manage-students?classId=${classItem?._id}`}
                                  className={`inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white ${
                                    theme === 'dark'
                                      ? 'bg-green-500 hover:bg-green-600'
                                      : 'bg-green-600 hover:bg-green-700'
                                  } focus:outline-none transition-colors duration-150`}
                                >
                                  Students
                                </Link>
                              </div>
                              <div className="flex flex-row gap-2">
                                <button
                                  onClick={() => handleEditClass(classItem)}
                                  className={`inline-flex items-center justify-center p-2 border border-transparent text-xs font-medium rounded ${
                                    theme === 'dark'
                                      ? 'text-amber-500 bg-amber-900/30 hover:bg-amber-900/50'
                                      : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                                  } focus:outline-none transition-colors duration-150`}
                                  aria-label="Edit class"
                                  title="Edit class"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteClass(classItem)}
                                  disabled={isDeletingClass}
                                  className={`inline-flex items-center justify-center p-2 border border-transparent text-xs font-medium rounded ${
                                    theme === 'dark'
                                      ? 'text-red-500 bg-red-900/30 hover:bg-red-900/50'
                                      : 'text-red-700 bg-red-50 hover:bg-red-100'
                                  } focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150`}
                                  aria-label="Delete class"
                                  title="Delete class"
                                >
                                  {isDeletingClass ? (
                                    <svg
                                      className="animate-spin h-4 w-4"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                  ) : (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edit Class Modal - Now using a fixed overlay for better mobile experience */}
          {editingClassId && (
            <div
              className={`fixed inset-0 flex items-center justify-center bg-gray-800/75 z-50 p-4`}
            >
              <div
                className={`${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white'
                } rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2
                    className={`text-xl font-semibold ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
                    }`}
                  >
                    Edit Class
                  </h2>
                  <button
                    onClick={closeEditForm}
                    className={`${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                    } focus:outline-none`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleUpdateClass} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="edit-name"
                        className={`block text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        } mb-1`}
                      >
                        Class Name *
                      </label>
                      <input
                        id="edit-name"
                        name="name"
                        type="text"
                        required
                        value={editFormData.name}
                        onChange={handleEditInputChange}
                        className={`w-full px-3 py-2 border ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                        placeholder="e.g., Introduction to Computer Science"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="edit-course"
                        className={`block text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        } mb-1`}
                      >
                        Course Code *
                      </label>
                      <input
                        id="edit-course"
                        name="course"
                        type="text"
                        required
                        value={editFormData.course}
                        onChange={handleEditInputChange}
                        className={`w-full px-3 py-2 border ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                        placeholder="e.g., CS101"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor="edit-department"
                        className={`block text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        } mb-1`}
                      >
                        Department *
                      </label>
                      <select
                        id="edit-department"
                        name="department"
                        required
                        value={editFormData.department}
                        onChange={handleEditInputChange}
                        className={`w-full px-3 py-2 border ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                      >
                        <option value="">Select Department</option>
                        {departmentOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    {editFormData.department === 'Other' && (
                      <div>
                        <label
                          htmlFor="edit-otherDepartment"
                          className={`block text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          } mb-1`}
                        >
                          Specify Department *
                        </label>
                        <input
                          id="edit-otherDepartment"
                          name="otherDepartment"
                          type="text"
                          required
                          value={editFormData.otherDepartment}
                          onChange={handleEditInputChange}
                          className={`w-full px-3 py-2 border ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                              : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                          } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                          placeholder="e.g., Aerospace Engineering"
                        />
                      </div>
                    )}
                    <div>
                      <label
                        htmlFor="edit-batch"
                        className={`block text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        } mb-1`}
                      >
                        Batch/Year *
                      </label>
                      <select
                        id="edit-batch"
                        name="batch"
                        required
                        value={editFormData.batch}
                        onChange={handleEditInputChange}
                        className={`w-full px-3 py-2 border ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                      >
                        <option value="">Select Year</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="edit-totalSemesters"
                        className={`block text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        } mb-1`}
                      >
                        Total Semesters
                      </label>
                      <input
                        id="edit-totalSemesters"
                        name="totalSemesters"
                        type="number"
                        min="1"
                        max="16"
                        value={editFormData.totalSemesters}
                        onChange={handleEditInputChange}
                        className={`w-full px-3 py-2 border ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                      />
                      <p
                        className={`mt-1 text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        Default: 8
                      </p>
                    </div>
                    <div>
                      <label
                        htmlFor="edit-currentSemester"
                        className={`block text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        } mb-1`}
                      >
                        Current Semester
                      </label>
                      <input
                        id="edit-currentSemester"
                        name="currentSemester"
                        type="number"
                        min="1"
                        max={editFormData.totalSemesters}
                        value={editFormData.currentSemester}
                        onChange={handleEditInputChange}
                        className={`w-full px-3 py-2 border ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400'
                            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                      />
                      <p
                        className={`mt-1 text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        Default: 1
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                      type="button"
                      onClick={closeEditForm}
                      className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                        theme === 'dark'
                          ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      } focus:outline-none transition-colors duration-150`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        theme === 'dark'
                          ? 'bg-indigo-500 hover:bg-indigo-600'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                        isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Updating...
                        </div>
                      ) : (
                        'Update Class'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing faculty access
export default withRoleProtection(ClassesManagementPage, ['hod', 'faculty']);
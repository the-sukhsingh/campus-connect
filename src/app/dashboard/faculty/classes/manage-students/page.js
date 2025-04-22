'use client';

import React, { useState, useEffect } from 'react';
import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ManageStudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');

  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [upgradeData, setUpgradeData] = useState({
    newSemester: '',
    newBatch: '',
  });

  // Add state for Add Student functionality
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    email: '',
    displayName: '',
    rollNo: '',
    studentId: '',
  });
  const [validationErrors, setValidationErrors] = useState({});
  
  // Add state for bulk student addition
  const [addMode, setAddMode] = useState('single'); // 'single' or 'bulk'
  const [bulkStudents, setBulkStudents] = useState([
    { email: '', displayName: '', rollNo: '', studentId: '' }
  ]);
  const [bulkValidationErrors, setBulkValidationErrors] = useState([{}]);

  useEffect(() => {
    if (!user || !classId) return;

    const fetchClassData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user/teacher/classes/${classId}?uid=${user?.uid}`);

        if (!response.ok) {
          throw new Error('Failed to fetch class data');
        }

        const data = await response.json();
        setClassData(data.class);

        if (data.class && data.class.students) {
          const approved = data.class.students.filter((s) => s.status === 'approved');
          console.log('Approved students:', approved);
          setApprovedStudents(approved);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({
          type: 'error',
          text: error.message || 'Failed to load data. Please try again later.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [user, classId]);


  const handleRemoveStudent = async (studentId) => {
    if (!user || !classId || !studentId) return;

    if (!confirm("Are you sure you want to remove this student from the class? This action cannot be undone.")) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/user/teacher/classes/students', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          classId,
          studentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to remove student`);
      }

      // Update UI by removing student
      setApprovedStudents((prev) => prev.filter((s) => s._id !== studentId));

      setMessage({
        type: 'success',
        text: 'Student removed successfully',
      });

      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to remove student. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle bulk selection toggling
  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(approvedStudents.map(s => s._id));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual student selection
  const handleSelectStudent = (studentId) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Filter students by search term
  const filteredStudents = approvedStudents.filter((student) => {
    const searchText = searchTerm.toLowerCase();
    const name = student?.student?.displayName?.toLowerCase() || '';
    const email = student?.student?.email?.toLowerCase() || '';
    const rollNo = student?.student?.rollNo?.toLowerCase() || '';

    return name.includes(searchText) || email.includes(searchText) || rollNo.includes(searchText);
  });

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle upgrading students form submission
  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();

    if (selectedStudents.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please select at least one student to upgrade.',
      });
      return;
    }

    if (!upgradeData.newSemester) {
      setMessage({
        type: 'error',
        text: 'Please enter a new semester.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // Here you would typically call your API to handle the upgrade
      const response = await fetch('/api/user/teacher/classes/upgrade-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          classId,
          studentIds: selectedStudents,
          newSemester: upgradeData.newSemester,
          newBatch: upgradeData.newBatch || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upgrade students');
      }

      setMessage({
        type: 'success',
        text: `${selectedStudents.length} student(s) upgraded successfully!`,
      });

      // Reset state
      setSelectedStudents([]);
      setSelectAll(false);
      setShowUpgradeForm(false);
      
      // Refresh class data
      const refreshResponse = await fetch(`/api/user/teacher/classes/${classId}?uid=${user?.uid}`);
      const refreshData = await refreshResponse.json();
      setClassData(refreshData.class);
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to upgrade students. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle opening the add student modal
  const openAddStudentModal = () => {
    setNewStudentData({
      email: '',
      displayName: '',
      rollNo: '',
      studentId: ''
    });
    setValidationErrors({});
    setShowAddModal(true);
  };

  // Handle input change for new student form
  const handleStudentInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudentData({
      ...newStudentData,
      [name]: value
    });
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  // Validate the new student form
  const validateStudentForm = () => {
    const errors = {};
    
    if (!newStudentData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newStudentData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!newStudentData.displayName.trim()) {
      errors.displayName = 'Name is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle creating a new student account
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    
    if (!validateStudentForm()) {
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
          creatorRole: 'faculty',
          userData: {
            email: newStudentData.email.toLowerCase(),
            displayName: newStudentData.displayName,
            role: 'student',
            rollNo: newStudentData.rollNo || '',
            classId: classId,
            studentId: newStudentData.studentId || '',
            department: classData?.department || undefined,
            // If class has college info, add it to the student
            collegeId: classData?.college?._id || undefined,
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create student account');
      }
      
      const data = await response.json();
      
      // Refresh the student list with newly created student
      if (data.user) {
        // Need to refresh class data to get updated student list with correct format
        const refreshResponse = await fetch(`/api/user/teacher/classes/${classId}?uid=${user?.uid}`);
        const refreshData = await refreshResponse.json();
        
        if (refreshResponse.ok) {
          setClassData(refreshData.class);
          
          if (refreshData.class && refreshData.class.students) {
            const approved = refreshData.class.students.filter((s) => s.status === 'approved');

            setApprovedStudents(approved);
          }
        }
      }
      
      // Close the modal and reset form
      setShowAddModal(false);
      setNewStudentData({
        email: '',
        displayName: '',
        rollNo: '',
      });
      
      // Show success message
      setMessage({
        type: 'success',
        text: `Student account created successfully! An email with login instructions has been sent to ${newStudentData.email}.`
      });
      
      // Clear the message after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Error creating student account. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle bulk student input change
  const handleBulkStudentChange = (index, field, value) => {
    const updatedStudents = [...bulkStudents];
    updatedStudents[index][field] = value;
    setBulkStudents(updatedStudents);

    // Clear validation error when field is edited
    if (bulkValidationErrors[index]?.[field]) {
      const updatedErrors = [...bulkValidationErrors];
      updatedErrors[index][field] = '';
      setBulkValidationErrors(updatedErrors);
    }
  };

  // Add a new row for bulk student input
  const addBulkStudentRow = () => {
    setBulkStudents([...bulkStudents, { email: '', displayName: '', rollNo: '', studentId: '' }]);
    setBulkValidationErrors([...bulkValidationErrors, {}]);
  };

  // Remove a row from bulk student input
  const removeBulkStudentRow = (index) => {
    const updatedStudents = bulkStudents.filter((_, i) => i !== index);
    const updatedErrors = bulkValidationErrors.filter((_, i) => i !== index);
    setBulkStudents(updatedStudents);
    setBulkValidationErrors(updatedErrors);
  };

  // Validate bulk student form
  const validateBulkStudentForm = () => {
    const errors = bulkStudents.map((student) => {
      const studentErrors = {};
      if (!student.email.trim()) {
        studentErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(student.email)) {
        studentErrors.email = 'Please enter a valid email address';
      }
      if (!student.displayName.trim()) {
        studentErrors.displayName = 'Name is required';
      }
      return studentErrors;
    });

    setBulkValidationErrors(errors);
    return errors.every((error) => Object.keys(error).length === 0);
  };

  // Handle creating bulk student accounts
  const handleCreateBulkStudents = async (e) => {
    e.preventDefault();

    if (!validateBulkStudentForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/user/create-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorUid: user?.uid,
          creatorRole: 'faculty',
          students: bulkStudents.map((student) => ({
            email: student.email.toLowerCase(),
            displayName: student.displayName,
            role: 'student',
            rollNo: student.rollNo || '',
            studentId: student.studentId || '',
            department: classData?.department || '',
            classId: classId,
            ...(classData?.collegeId && { collegeId: classData.collegeId }),
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create student accounts');
      }

      const data = await response.json();

      // Refresh the student list with newly created students
      if (data.users) {
        const refreshResponse = await fetch(`/api/user/teacher/classes/${classId}?uid=${user?.uid}`);
        const refreshData = await refreshResponse.json();

        if (refreshResponse.ok) {
          setClassData(refreshData.class);

          if (refreshData.class && refreshData.class.students) {
            const approved = refreshData.class.students.filter((s) => s.status === 'approved');

            setApprovedStudents(approved);
          }
        }
      }

      // Close the modal and reset form
      setShowAddModal(false);
      setBulkStudents([{ email: '', displayName: '', rollNo: '', studentId: '' }]);
      setBulkValidationErrors([{}]);

      // Show success message
      setMessage({
        type: 'success',
        text: `Bulk student accounts created successfully! Emails with login instructions have been sent.`,
      });

      // Clear the message after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Error creating bulk student accounts. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Class Students</h1>
          {classData && (
            <p className="text-gray-600 mt-1">
              {classData.name} ({classData.semester}) - {classData.department}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/faculty/classes"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
        >
          Back to Classes
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="space-y-6">


          {/* Enrolled Students Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
              <div>
                <h2 className="text-lg font-semibold">Enrolled Students</h2>
                <p className="text-sm text-gray-500">
                  {approvedStudents.length} student{approvedStudents.length !== 1 ? 's' : ''} enrolled
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                {selectedStudents.length > 0 && (
                  <button
                    onClick={() => setShowUpgradeForm(!showUpgradeForm)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                  >
                    {showUpgradeForm ? 'Cancel' : `Upgrade ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
                  </button>
                )}
                <button
                  onClick={openAddStudentModal}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                >
                  Add Student
                </button>
              </div>
            </div>

            {showUpgradeForm && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Upgrade Students to New Semester/Batch</h3>
                <form onSubmit={handleUpgradeSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="newSemester" className="block text-sm font-medium text-gray-700 mb-1">
                        New Semester *
                      </label>
                      <input
                        type="text"
                        id="newSemester"
                        name="newSemester"
                        value={upgradeData.newSemester}
                        onChange={(e) => setUpgradeData({ ...upgradeData, newSemester: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Spring 2025"
                      />
                    </div>
                    <div>
                      <label htmlFor="newBatch" className="block text-sm font-medium text-gray-700 mb-1">
                        New Batch (Optional)
                      </label>
                      <input
                        type="text"
                        id="newBatch"
                        name="newBatch"
                        value={upgradeData.newBatch}
                        onChange={(e) => setUpgradeData({ ...upgradeData, newBatch: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., 2025"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || !upgradeData.newSemester || selectedStudents.length === 0}
                      className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        (isSubmitting || !upgradeData.newSemester || selectedStudents.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? 'Processing...' : 'Confirm Upgrade'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="max-w-lg w-full lg:max-w-xs relative">
                  <label htmlFor="search" className="sr-only">Search</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="search"
                      name="search"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Search students"
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {approvedStudents.length === 0 ? (
              <div className="px-6 py-4 text-center text-gray-500">
                No students enrolled in this class yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <input
                            id="select-all"
                            name="select-all"
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={selectAll}
                            onChange={handleToggleSelectAll}
                          />
                          <label htmlFor="select-all" className="ml-2 block text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </label>
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined On
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          No students match your search
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                id={`student-${student._id}`}
                                name={`student-${student._id}`}
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                checked={selectedStudents.includes(student._id)}
                                onChange={() => handleSelectStudent(student._id)}
                              />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.student?.displayName || 'Unnamed Student'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {student.student?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.student?.rollNo || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.student?.studentId || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.joinRequestDate ? formatDate(student.joinRequestDate) : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRemoveStudent(student._id)}
                              disabled={isSubmitting}
                              className={`text-red-600 hover:text-red-900 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add New Student</h3>
              
              {/* Toggle between single and bulk add */}
              <div className="mt-3 flex border border-gray-200 rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAddMode('single')}
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    addMode === 'single' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Add Single Student
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('bulk')}
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    addMode === 'bulk' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Bulk Add Students
                </button>
              </div>
            </div>
            
            {/* Single Student Form */}
            {addMode === 'single' && (
              <form onSubmit={handleCreateStudent} className="px-6 py-4 space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newStudentData.email}
                    onChange={handleStudentInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      validationErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., student@example.com"
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={newStudentData.displayName}
                    onChange={handleStudentInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      validationErrors.displayName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., John Doe"
                  />
                  {validationErrors.displayName && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.displayName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="rollNo" className="block text-sm font-medium text-gray-700">
                    Roll No *
                  </label>
                  <input
                    type="text"
                    id="rollNo"
                    name="rollNo"
                    value={newStudentData.rollNo}
                    onChange={handleStudentInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 12345"
                  />
                </div>
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                    Student ID (Optional)
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    value={newStudentData.studentId}
                    onChange={handleStudentInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 12345"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Creating...' : 'Add Student'}
                  </button>
                </div>
              </form>
            )}
            
            {/* Bulk Students Form */}
            {addMode === 'bulk' && (
              <form onSubmit={handleCreateBulkStudents} className="px-6 py-4 space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name*</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email*</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No*</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                        <th className="px-2 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bulkStudents.map((student, index) => (
                        <tr key={index}>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={student.displayName}
                              onChange={(e) => handleBulkStudentChange(index, 'displayName', e.target.value)}
                              className={`w-full px-2 py-1 border rounded-md text-sm ${
                                bulkValidationErrors[index]?.displayName ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Full Name"
                            />
                            {bulkValidationErrors[index]?.displayName && (
                              <p className="mt-1 text-xs text-red-500">{bulkValidationErrors[index].displayName}</p>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="email"
                              value={student.email}
                              onChange={(e) => handleBulkStudentChange(index, 'email', e.target.value)}
                              className={`w-full px-2 py-1 border rounded-md text-sm ${
                                bulkValidationErrors[index]?.email ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Email"
                            />
                            {bulkValidationErrors[index]?.email && (
                              <p className="mt-1 text-xs text-red-500">{bulkValidationErrors[index].email}</p>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={student.rollNo}
                              onChange={(e) => handleBulkStudentChange(index, 'rollNo', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                              placeholder="Roll No"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={student.studentId}
                              onChange={(e) => handleBulkStudentChange(index, 'studentId', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                              placeholder="Optional"
                            />
                          </td>
                          <td className="px-2 py-2">
                            {bulkStudents.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => removeBulkStudentRow(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={addBulkStudentRow}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Row
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? 'Creating...' : 'Add Students'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default withRoleProtection(ManageStudentsPage, ['hod', 'faculty']);

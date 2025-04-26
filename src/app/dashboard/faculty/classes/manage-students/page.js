'use client';

import React, { useState, useEffect } from 'react';
import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ManageStudentsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');

  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Student addition state
  const [showAddModal, setShowAddModal] = useState(false);
  const [bulkStudents, setBulkStudents] = useState([
    { email: '', displayName: '', rollNo: '', studentId: '' }
  ]);
  const [bulkValidationErrors, setBulkValidationErrors] = useState([{}]);

  // Student editing state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    rollNo: '',
    studentId: '',
    department: '',
    currentSemester: '',
    batch: ''
  });
  const [editValidationErrors, setEditValidationErrors] = useState({});

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

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditFormData({
      displayName: student.displayName || '',
      rollNo: student.rollNo || '',
      studentId: student.studentId || '',
    });
    setEditValidationErrors({});
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is edited
    if (editValidationErrors[name]) {
      setEditValidationErrors({
        ...editValidationErrors,
        [name]: ''
      });
    }
  };

  const validateEditForm = () => {
    const errors = {};
    
    if (!editFormData.displayName.trim()) {
      errors.displayName = 'Name is required';
    }
    
    if (!editFormData.rollNo.trim()) {
      errors.rollNo = 'Roll number is required';
    }
    
    // Check for duplicates in existing students
    const existingRollNoDuplicate = approvedStudents.find(
      s => s.student?.rollNo === editFormData.rollNo && s.student?._id !== editingStudent._id
    );
    
    if (existingRollNoDuplicate) {
      errors.rollNo = 'A student with this roll number already exists in the class';
    }

    if (editFormData.studentId) {
      const existingStudentIdDuplicate = approvedStudents.find(
        s => s.student?.studentId === editFormData.studentId && s.student?._id !== editingStudent._id
      );
      if (existingStudentIdDuplicate) {
        errors.studentId = 'A student with this ID already exists in the class';
      }
    }
    
    setEditValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    
    if (!validateEditForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          targetUserId: editingStudent._id,
          ...editFormData
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update student information');
      }
      
      const data = await response.json();
      
      // Update the student in the list
      setApprovedStudents(prev => 
        prev.map(s => {
          if (s.student._id === editingStudent._id) {
            return {
              ...s,
              student: {
                ...s.student,
                displayName: editFormData.displayName,
                rollNo: editFormData.rollNo,
                studentId: editFormData.studentId,
                department: editFormData.department,
                currentSemester: editFormData.semester,
                batch: editFormData.batch
              }
            };
          }
          return s;
        })
      );
      
      // Close the modal and show success message
      setShowEditModal(false);
      
      setMessage({
        type: 'success',
        text: 'Student information updated successfully'
      });
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update student. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
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
    const errors = bulkStudents.map((student, index) => {
      const studentErrors = {};
      
      // Required fields validation
      if (!student.email.trim()) {
        studentErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(student.email)) {
        studentErrors.email = 'Please enter a valid email address';
      }

      if (!student.displayName.trim()) {
        studentErrors.displayName = 'Name is required';
      }

      if (!student.rollNo.trim()) {
        studentErrors.rollNo = 'Roll number is required';
      }

      // Uniqueness validation within the form
      const emailDuplicate = bulkStudents.find(
        (s, i) => i !== index && s.email.toLowerCase() === student.email.toLowerCase()
      );
      if (emailDuplicate) {
        studentErrors.email = 'Email address must be unique';
      }

      const rollNoDuplicate = bulkStudents.find(
        (s, i) => i !== index && s.rollNo && s.rollNo === student.rollNo
      );
      if (rollNoDuplicate) {
        studentErrors.rollNo = 'Roll number must be unique';
      }

      if (student.studentId) {
        const studentIdDuplicate = bulkStudents.find(
          (s, i) => i !== index && s.studentId && s.studentId === student.studentId
        );
        if (studentIdDuplicate) {
          studentErrors.studentId = 'Student ID must be unique';
        }
      }

      // Check for duplicates in existing students
      const existingEmailDuplicate = approvedStudents.find(
        s => s.student?.email?.toLowerCase() === student.email.toLowerCase()
      );
      if (existingEmailDuplicate) {
        studentErrors.email = 'A student with this email already exists in the class';
      }

      const existingRollNoDuplicate = approvedStudents.find(
        s => s.student?.rollNo === student.rollNo
      );
      if (existingRollNoDuplicate) {
        studentErrors.rollNo = 'A student with this roll number already exists in the class';
      }

      if (student.studentId) {
        const existingStudentIdDuplicate = approvedStudents.find(
          s => s.student?.studentId === student.studentId
        );
        if (existingStudentIdDuplicate) {
          studentErrors.studentId = 'A student with this ID already exists in the class';
        }
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
      // console.log('Bulk student creation response:', data);

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
        text: `Bulk student accounts created successfully!`,
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
    <div className={`p-6 ${theme === 'dark' ? 'text-gray-200' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Manage Class Students</h1>
          {classData && (
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              {classData.name} ({classData.currentSemester}) - {classData.department}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => window.open(`/api/export/students?uid=${user?.uid}&classId=${classId}&format=csv`, '_blank')}
              className={`inline-flex items-center gap-1 ${theme === 'dark' ? 'bg-green-900/20 hover:bg-green-900/30 text-green-400 border-green-800' : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'} py-2 px-3 rounded border transition-colors`}
              title="Download as CSV"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              CSV
            </button>
            <button
              onClick={() => window.open(`/api/export/students?uid=${user?.uid}&classId=${classId}&format=pdf`, '_blank')}
              className={`inline-flex items-center gap-1 ${theme === 'dark' ? 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'} py-2 px-3 rounded border transition-colors`}
              title="Download as PDF"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              PDF
            </button>
          </div>
          <Link
            href="/dashboard/faculty/classes"
            className={`${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} py-2 px-4 rounded transition-colors`}
          >
            Back to Classes
          </Link>
        </div>
      </div>

      {message.text && (
        <div 
          className={`p-4 mb-6 border-l-4 ${
            message.type === 'error' 
              ? theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-100 border-red-500 text-red-700'
              : theme === 'dark' ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-100 border-green-500 text-green-700'
          }`} 
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Enrolled Students Section */}
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg shadow-md overflow-hidden border`}>
            <div className={`px-6 py-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-b flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0`}>
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Enrolled Students</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {approvedStudents.length} student{approvedStudents.length !== 1 ? 's' : ''} enrolled
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${
                    theme === 'dark' ? 'text-white bg-green-600 hover:bg-green-700' : 'text-white bg-green-600 hover:bg-green-700'
                  } focus:outline-none transition-colors duration-200`}
                >
                  Add Students
                </button>
              </div>
            </div>

            
            {/* Search Bar */}
            <div className={`px-6 py-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-b`}>
              <div className="flex items-center">
                <div className="max-w-lg w-full lg:max-w-xs relative">
                  <label htmlFor="search" className="sr-only">Search</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="search"
                      name="search"
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-indigo-500' : 'border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500'
                      } rounded-md leading-5 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors duration-200`}
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
              <div className={`px-6 py-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                No students enrolled in this class yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        <div className="flex items-center">
                          <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            Student
                          </label>
                        </div>
                      </th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Roll No
                      </th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Student ID
                      </th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Joined On
                      </th>
                      <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`px-6 py-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          No students match your search
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student._id} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-150`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                                  {student.student?.displayName || 'Unnamed Student'}
                                </div>
                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {student.student?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'} text-sm`}>
                            {student.student?.rollNo || 'N/A'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'} text-sm`}>
                            {student.student?.studentId || 'N/A'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {student.joinRequestDate ? formatDate(student.joinRequestDate) : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditStudent(student.student)}
                              disabled={isSubmitting}
                              className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'} mr-4 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''} transition-colors duration-150`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleRemoveStudent(student.student._id)}
                              disabled={isSubmitting}
                              className={`${theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''} transition-colors duration-150`}
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

      {/* Add Students Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-xl w-full max-w-5xl border`}>
            <div className={`px-6 py-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-b flex justify-between items-center`}>
              <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Add Students in Bulk</h3>
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
            
            <div className="px-6 pt-4 pb-2">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                Add multiple students at once. All students will be enrolled in this class automatically.
              </p>
            </div>
            
            <form onSubmit={handleCreateBulkStudents} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="overflow-x-auto mb-8">
                <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Roll No*</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Name*</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Email*</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Student ID</th>
                      <th className="px-2 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                    {bulkStudents.map((student, index) => (
                      <tr key={index} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={student.rollNo}
                            onChange={(e) => handleBulkStudentChange(index, 'rollNo', e.target.value)}
                            className={`w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-1 ${
                              theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400' 
                                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                            } transition-colors duration-200`}
                            placeholder="Roll No"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={student.displayName}
                            onChange={(e) => handleBulkStudentChange(index, 'displayName', e.target.value)}
                            className={`w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-1 ${
                              bulkValidationErrors[index]?.displayName 
                                ? theme === 'dark' ? 'border-red-500' : 'border-red-500'
                                : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                            } ${
                              theme === 'dark' 
                                ? 'bg-gray-700 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400' 
                                : 'focus:ring-indigo-500 focus:border-indigo-500'
                            } transition-colors duration-200`}
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
                            className={`w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-1 ${
                              bulkValidationErrors[index]?.email 
                                ? theme === 'dark' ? 'border-red-500' : 'border-red-500'
                                : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                            } ${
                              theme === 'dark' 
                                ? 'bg-gray-700 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400' 
                                : 'focus:ring-indigo-500 focus:border-indigo-500'
                            } transition-colors duration-200`}
                            placeholder="Email"
                          />
                          {bulkValidationErrors[index]?.email && (
                            <p className="mt-1 text-xs text-red-500">{bulkValidationErrors[index].email}</p>
                          )}
                        </td>
                        
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={student.studentId}
                            onChange={(e) => handleBulkStudentChange(index, 'studentId', e.target.value)}
                            className={`w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-1 ${
                              theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400 focus:border-indigo-400' 
                                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                            } transition-colors duration-200`}
                            placeholder="Optional"
                          />
                        </td>
                        <td className="px-2 py-2">
                          {bulkStudents.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => removeBulkStudentRow(index)}
                              className={`${theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}`}
                              title="Remove row"
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
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md ${
                    theme === 'dark' ? 'text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50' : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                  } focus:outline-none transition-colors`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Row
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    theme === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    theme === 'dark' ? 'focus:ring-green-500' : 'focus:ring-green-500'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''} transition-colors duration-200`}
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
                    'Add Students'
                  )}
                </button>
              </div>
              
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg shadow-xl p-6 w-full max-w-3xl border`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Edit Student Information</h3>
              <button 
                type="button" 
                className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} focus:outline-none`}
                onClick={() => setShowEditModal(false)}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label htmlFor="displayName" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Name*</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={editFormData.displayName}
                  onChange={handleEditInputChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    editValidationErrors.displayName ? 'border-red-500' : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                  } ${theme === 'dark' ? 'bg-gray-700 text-gray-100' : ''}`}
                />
                {editValidationErrors.displayName && (
                  <p className="mt-1 text-xs text-red-500">{editValidationErrors.displayName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="rollNo" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Roll No*</label>
                <input
                  type="text"
                  id="rollNo"
                  name="rollNo"
                  value={editFormData.rollNo}
                  onChange={handleEditInputChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    editValidationErrors.rollNo ? 'border-red-500' : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                  } ${theme === 'dark' ? 'bg-gray-700 text-gray-100' : ''}`}
                />
                {editValidationErrors.rollNo && (
                  <p className="mt-1 text-xs text-red-500">{editValidationErrors.rollNo}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="studentId" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Student ID</label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={editFormData.studentId}
                  onChange={handleEditInputChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    editValidationErrors.studentId ? 'border-red-500' : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                  } ${theme === 'dark' ? 'bg-gray-700 text-gray-100' : ''}`}
                />
                {editValidationErrors.studentId && (
                  <p className="mt-1 text-xs text-red-500">{editValidationErrors.studentId}</p>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
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
                    'Update Student'
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

export default withRoleProtection(ManageStudentsPage, ['hod', 'faculty']);
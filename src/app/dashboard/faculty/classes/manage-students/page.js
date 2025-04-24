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
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Student addition state
  const [showAddModal, setShowAddModal] = useState(false);
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
               
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                >
                  Add Students
                </button>
              </div>
            </div>

            
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
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                             
                              <div>
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

      {/* Add Students Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Add Students in Bulk</h3>
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
            
            <div className="px-6 pt-4 pb-2">
              <p className="text-sm text-gray-600 mb-4">
                Add multiple students at once. All students will be enrolled in this class automatically.
              </p>
            </div>
            
            <form onSubmit={handleCreateBulkStudents} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="overflow-x-auto mb-8">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No*</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name*</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email*</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                      <th className="px-2 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bulkStudents.map((student, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={student.rollNo}
                            onChange={(e) => handleBulkStudentChange(index, 'rollNo', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Roll No"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={student.displayName}
                            onChange={(e) => handleBulkStudentChange(index, 'displayName', e.target.value)}
                            className={`w-full px-2 py-1 border rounded-md text-sm ${
                              bulkValidationErrors[index]?.displayName ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
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
                            } focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
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
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Optional"
                          />
                        </td>
                        <td className="px-2 py-2">
                          {bulkStudents.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => removeBulkStudentRow(index)}
                              className="text-red-600 hover:text-red-900"
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
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Row
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
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
                    'Add Students'
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

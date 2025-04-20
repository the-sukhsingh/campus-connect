'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function ClassesManagementPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Form state for creating a new class
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    department: '',
    semester: '',
    batch: ''
  });

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

        if (!collegeData.college || collegeData.status !== 'approved') {
          setCollegeInfo(null);
          setLoading(false);
          return;
        }

        setCollegeInfo(collegeData.college);

        // Fetch classes created by this teacher
        const classesResponse = await fetch(`/api/user/teacher/classes?uid=${user?.uid}`);
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes');
        }

        const classesData = await classesResponse.json();
        setClasses(classesData.classes || []);

      } catch (error ) {
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission to create a new class
  const handleCreateClass = async (e) => {
    e.preventDefault();

    // Form validation
    const { name, course, department, semester, batch } = formData;
    if (!name || !course || !department || !semester || !batch) {
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          collegeId: collegeInfo._id,
          classData: formData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create class');
      }

      const data = await response.json();

      // Add the new class to the list
      setClasses(prev => [data.class, ...prev]);

      // Reset form and hide it
      setFormData({
        name: '',
        course: '',
        department: '',
        semester: '',
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

  // Handle viewing student requests for a specific class
  const handleViewRequests = async (classId) => {
    if (!user || !classId) return;

    try {
      setLoading(true);
      setSelectedClass(classId);

      const response = await fetch(`/api/user/teacher/classes/students?uid=${user?.uid}&classId=${classId}&status=pending`);

      if (!response.ok) {
        throw new Error('Failed to fetch student requests');
      }

      const data = await response.json();

      // Update to use the correct property name from the API response
      setPendingRequests(data?.students || []);

    } catch (error ) {
      console.error('Error fetching student requests:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load student requests. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle approving or rejecting a student request
  const handleStudentAction = async (studentId, classId, action) => {
    if (!user || !studentId || !classId) return;

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/user/teacher/classes/students', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          classId,
          studentId,
          action
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} student`);
      }

      // Update the pending requests list
      setPendingRequests(prev => prev.filter(request => request._id !== studentId));

      // Update the classes list to reflect the new student count
      setClasses(prev => prev.map(c => {
        if (c._id === classId) {
          const updatedClass = { ...c };
          if (action === 'approve') {
            // Find the student in the pending list and move to approved
            const approvedStudent = pendingRequests.find(s => s._id === studentId);
            if (approvedStudent) {
              updatedClass.students = [
                ...updatedClass.students.filter(s => s._id !== studentId),
                { ...approvedStudent, status: 'approved' }
              ];
            }
          } else {
            // Remove the student from the class
            updatedClass.students = updatedClass?.students.filter(s => s._id !== studentId) || [];
          }
          return updatedClass;
        }
        return c;
      }));

      setMessage({
        type: 'success',
        text: `Student ${action === 'approve' ? 'approved' : 'rejected'} successfully!`
      });

      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || `Failed to ${action} student. Please try again.`
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

  // Count students by status
  const getStudentCountsByStatus = (classItem) => {
    const counts = {
      approved: 0,
      pending: 0,
      total: classItem.students?.length || 0
    };

    classItem.students?.forEach(student => {
      if (student.status === 'approved') counts.approved++;
      if (student.status === 'pending') counts.pending++;
    });
    classItem.studentRequests?.forEach(() => {
      counts.pending++;
    });

    return counts;
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
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Classes Management</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your classes, approve student requests
          </p>
        </div>
        <Link
          href="/dashboard/faculty"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {message.text && (
        <div
          className={`p-4 mb-6 border-l-4 ${message.type === 'error'
              ? 'bg-red-100 border-red-500 text-red-700'
              : 'bg-green-100 border-green-500 text-green-700'
            }`}
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {loading && !selectedClass ? (
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
                You need to join a college before you can create classes. Please go to the Faculty Dashboard to join a college.
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard/faculty"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:shadow-outline-indigo"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : selectedClass ? (
        <>
          {/* Student Requests View */}
          <div className="mb-6">
            <button
              onClick={() => setSelectedClass(null)}
              className="mb-4 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 focus:outline-none"
            >
              <svg className="mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Classes
            </button>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">
                Student Join Requests
              </h2>

              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : pendingRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending student requests</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Request Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingRequests.map((student) => (
                        <tr key={student._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.displayName || 'Unnamed Student'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {student.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.joinRequestDate ? formatDate(student.joinRequestDate) : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleStudentAction(student._id, selectedClass, 'approve')}
                                disabled={isSubmitting}
                                className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStudentAction(student._id, selectedClass, 'reject')}
                                disabled={isSubmitting}
                                className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
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
          </div>
        </>
      ) : (
        <>
          {/* Create Class Button */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-lg font-semibold">Your Classes</h2>
                <p className="text-sm text-gray-500">Create and manage your classes for {collegeInfo.name}</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                {showForm ? (
                  <>
                    <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414z" clipRule="evenodd" />
                    </svg>
                    Cancel
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Create New Class
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Create Class Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Create New Class</h2>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Class Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Introduction to Computer Science"
                    />
                  </div>
                  <div>
                    <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                      Course Code *
                    </label>
                    <input
                      id="course"
                      name="course"
                      type="text"
                      required
                      value={formData.course}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., CS101"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <input
                      id="department"
                      name="department"
                      type="text"
                      required
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div>
                    <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                      Semester *
                    </label>
                    <input
                      id="semester"
                      name="semester"
                      type="text"
                      required
                      value={formData.semester}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Fall 2025"
                    />
                  </div>
                  <div>
                    <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-1">
                      Batch/Year *
                    </label>
                    <input
                      id="batch"
                      name="batch"
                      type="text"
                      required
                      value={formData.batch}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 2023"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full md:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
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
                      'Create Class'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Classes List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {classes.length === 0 ? (
              <div className="p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-gray-500 mb-4">
                  You haven&apos;t created any classes yet
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Your First Class
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unique ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classes.map((classItem) => {
                      const studentCounts = getStudentCountsByStatus(classItem);
                      return (
                        <tr key={classItem._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {classItem.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {`${classItem.course} | ${classItem.department} | ${classItem.semester}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                {classItem.uniqueId}
                              </span>
                              <button
                                onClick={() => copyClassId(classItem.uniqueId)}
                                className="text-gray-500 hover:text-gray-700"
                                title="Copy to clipboard"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                                  <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                                </svg>
                              </button>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Share this ID with students to let them join
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-900">
                                {studentCounts.approved} approved
                              </span>
                              {studentCounts.pending > 0 && (
                                <span className="text-xs px-2 py-0.5 mt-1 bg-yellow-100 text-yellow-800 rounded-full inline-block">
                                  {studentCounts.pending} pending
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(classItem.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col space-y-2">
                              {studentCounts.pending > 0 && (
                                <button
                                  onClick={() => handleViewRequests(classItem._id)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none"
                                >
                                  View Requests ({studentCounts.pending})
                                </button>
                              )}
                              <Link
                                href={`/dashboard/faculty/classes/manage?classId=${classItem._id}`}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                              >
                                Manage Faculty
                              </Link>
                              <Link
                                href={`/dashboard/faculty/classes/manage-students?classId=${classItem._id}`}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                              >
                                Manage Students
                              </Link>
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
        </>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing faculty access
export default withRoleProtection(ClassesManagementPage, ['hod', 'faculty']);
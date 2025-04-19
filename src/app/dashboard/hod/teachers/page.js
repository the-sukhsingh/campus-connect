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
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pending'
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedDepartments, setSelectedDepartments] = useState({});
  const [librarianSelections, setLibrarianSelections] = useState({});

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
      setTeachers(teachersData.teachers || []);

      // Fetch pending teacher requests
      const pendingResponse = await fetch(
        `/api/user/college/teachers?uid=${user?.uid}&action=pending&collegeId=${collegeData.college._id}`
      );

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingTeachers(pendingData.pendingRequests || []);
        
        // Initialize selected departments for new pending teachers
        const departmentsMap = {};
        const librarianMap = {};
        pendingData.pendingRequests.forEach((teacher) => {
          if (!selectedDepartments[teacher._id]) {
            departmentsMap[teacher._id] = collegeData.college.departments?.[0] || '';
          }
          if (!librarianSelections[teacher._id]) {
            librarianMap[teacher._id] = false;
          }
        });
        
        setSelectedDepartments({
          ...selectedDepartments,
          ...departmentsMap
        });

        setLibrarianSelections({
          ...librarianSelections,
          ...librarianMap
        });
      }
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

  // Handle teacher request action (approve or reject)
  const handleTeacherAction = async (teacherId, action) => {
    if (!user || !collegeInfo || !teacherId) return;

    try {
      setIsSubmitting(true);

      // Include department and librarian status when approving
      const requestBody = {
        firebaseUid: user?.uid,
        collegeId: collegeInfo._id,
        teacherId,
        action
      };

      // Only include department and librarian status when approving
      if (action === 'approve') {
        requestBody.department = selectedDepartments[teacherId];
        requestBody.isLibrarian = librarianSelections[teacherId];
      }

      const response = await fetch('/api/user/college/teachers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} teacher`);
      }

      const data = await response.json();

      // Update both teacher lists
      setPendingTeachers(prev => prev.filter(t => t._id !== teacherId));

      if (action === 'approve') {
        setTeachers(prev => [
          ...prev,
          { 
            ...pendingTeachers.find(t => t._id === teacherId), 
            status: 'approved', 
            department: selectedDepartments[teacherId] 
          }
        ]);
      }

      setMessage({
        type: 'success',
        text: `Teacher ${action === 'approve' ? 'approved' : 'rejected'} successfully!`
      });

      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || `Error ${action}ing teacher. Please try again.`
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'pending'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Requests
                {pendingTeachers.length > 0 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {pendingTeachers.length}
                  </span>
                )}
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

          {/* Share college ID info */}
          <div className="mt-8 bg-blue-50 p-4 rounded-md border border-blue-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Share Your College ID</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    To invite teachers to join your college, share this unique ID:
                    <span className="ml-2 bg-white p-1 rounded font-mono font-bold text-blue-900">
                      {collegeInfo.uniqueId}
                    </span>
                  </p>
                  <p className="mt-2">
                    Teachers will need to enter this ID when joining from their dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing only HOD access
export default withRoleProtection(TeachersManagementPage, ['hod']);
'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function FacultyDashboard() {
  const { user, userRole } = useAuth();
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [collegeId, setCollegeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [classesCounts, setClassesCounts] = useState({
    total: 0,
    students: 0
  });
  const [requestStatus, setRequestStatus] = useState(null);

  // Fetch faculty data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
      
        // Fetch college information for this faculty
        const collegeResponse = await fetch(`/api/user/teacher/college?uid=${user?.uid}`);
        
        if (collegeResponse.ok) {
          const collegeData = await collegeResponse.json();
          setCollegeInfo(collegeData.college);
          
          // Set the request status
          if (collegeData.status) {
            setRequestStatus(collegeData.status);
          }
          
          // If faculty is linked to a college and approved, fetch classes data
          if (collegeData.college && collegeData.status === 'approved') {
            const classesResponse = await fetch(`/api/user/teacher/classes?uid=${user?.uid}`);
            
            if (classesResponse.ok) {
              const classesData = await classesResponse.json();
              setClassesCounts({
                total: classesData.classes?.length || 0,
                students: classesData.totalStudents || 0
              });
            }
          }
        }
      } catch (error ) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle joining a college with college ID
  const handleJoinCollege = async (e) => {
    e.preventDefault();
    
    if (!collegeId.trim() || !user) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid college ID'
      });
      return;
    }
    
    try {
      setJoining(true);
      
      const response = await fetch('/api/user/teacher/college', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          collegeUniqueId: collegeId.trim()
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join college');
      }
      
      const data = await response.json();
      
      setMessage({
        type: 'success',
        text: data.message || 'Request sent successfully! Waiting for HOD approval.'
      });
      
      // Reset the form
      setCollegeId('');
      
      // Refresh college data
      const collegeResponse = await fetch(`/api/user/teacher/college?uid=${user?.uid}`);
      if (collegeResponse.ok) {
        const collegeData = await collegeResponse.json();
        setCollegeInfo(collegeData.college);
        setRequestStatus(collegeData.status || 'pending');
      }
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to join college. Please try again.'
      });
    } finally {
      setJoining(false);
    }
  };

  // Display content based on loading and college/request status
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }
    
    if (!collegeInfo) {
      return (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Join a College</h2>
          <p className="text-gray-600 mb-4">
            To get started, enter the unique college ID provided by your HOD to join a college.
          </p>
          <form onSubmit={handleJoinCollege} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              placeholder="Enter college ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={joining}
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${
                joining ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {joining ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </>
              ) : (
                'Join College'
              )}
            </button>
          </form>
        </div>
      );
    }
    
    if (requestStatus === 'pending') {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your request to join <strong>{collegeInfo.name}</strong> is pending approval from the HOD. You will gain full access once approved.
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                College ID: <span className="font-mono font-medium">{collegeInfo.uniqueId}</span>
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (requestStatus === 'rejected') {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Your request to join <strong>{collegeInfo.name}</strong> was rejected. Please contact your HOD for more information.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => {
                    setCollegeInfo(null);
                    setCollegeId('');
                    setRequestStatus(null);
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try Another College ID
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Approved faculty - show dashboard
    return (
      <>
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-lg mb-2">College Information</h2>
          <div className="text-gray-600">
            <p><span className="font-medium">College Name:</span> {collegeInfo.name}</p>
            <p><span className="font-medium">Department:</span> {collegeInfo.department || 'Not specified'}</p>
            <p><span className="font-medium">College ID:</span> <span className="font-mono">{collegeInfo.uniqueId}</span></p>
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Approved
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Classes Management */}
          <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Classes</h3>
                <p className="text-sm text-gray-500">Create and manage your classes</p>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-500">Total Classes</div>
              <div className="text-lg font-semibold text-gray-900">{classesCounts.total}</div>
            </div>
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-500">Total Students</div>
              <div className="text-lg font-semibold text-gray-900">{classesCounts.students}</div>
            </div>
            <Link
              href="/dashboard/faculty/classes"
              className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Manage Classes
            </Link>
          </div>

          {/* Assigned Classes */}
          <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Assigned Classes</h3>
                <p className="text-sm text-gray-500">View your assigned classes</p>
              </div>
            </div>
            <p className="text-gray-500 mb-6">Access classes where you are assigned as faculty, view students, and mark attendance.</p>
            <Link
              href="/dashboard/faculty/assigned-classes"
              className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
            >
              View Assigned Classes
            </Link>
          </div>

          
          
          {/* Announcements */}
          <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Announcements</h3>
                <p className="text-sm text-gray-500">Communicate with students</p>
              </div>
            </div>
            <p className="text-gray-500 mb-6">Create and manage announcements for your students and college.</p>
            <Link
              href="/dashboard/faculty/announcements/"
              className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Manage Announcement
            </Link>
          </div>
          
          
        </div>
      </>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Faculty Dashboard</h1>
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <p className="text-gray-700">
          Welcome, <span className="font-semibold">{user?.displayName || user?.email}</span>! 
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {userRole}
          </span>
        </p>
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

      {renderContent()}
    </div>
  );
}

// Wrap the component with role protection, allowing admin and faculty access
export default withRoleProtection(FacultyDashboard, ['hod', 'faculty']);
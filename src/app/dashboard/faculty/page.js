'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileCompletionWrapper from '@/components/ProfileCompletionWrapper';
import dynamic from 'next/dynamic';

// Dynamically import the NotificationSubscription component (client-side only)
const NotificationSubscription = dynamic(
  () => import('@/components/NotificationSubscription'),
  { ssr: false }
);

function FacultyDashboard() {
  const { user, userRole } = useAuth();
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [classesCounts, setClassesCounts] = useState({
    total: 0,
    students: 0
  });

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


  // Display content based on loading and college/request status
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
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
              <div className="bg-green-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              View Assigned Classes
            </Link>
          </div>

          
          <NotificationSubscription />
          
          
        </div>

      </>
    );
  };

  return (
    <ProfileCompletionWrapper>
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
    </ProfileCompletionWrapper>
  );
}

// Wrap the component with role protection, allowing admin and faculty access
export default withRoleProtection(FacultyDashboard, ['hod', 'faculty']);
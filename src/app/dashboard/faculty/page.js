'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
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
  const { theme } = useTheme();
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [classesCounts, setClassesCounts] = useState({
    total: 0,
    students: 0
  });
  const [classes, setClasses] = useState([]);

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

              // Store the classes data in state for EmergencyNotificationButtons
              setClasses(classesData.classes || []);
            }
          }
        }
      } catch (error) {
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
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'dark' ? 'border-indigo-400' : 'border-indigo-600'} border-opacity-70`}></div>
        </div>
      );
    }

    // Approved faculty - show dashboard
    return (
      <>
        <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100'} backdrop-blur-sm rounded-xl p-6 mb-8 shadow-sm border transform hover:scale-[1.01] transition-all duration-300`}>
          <div className="flex items-center mb-3">
            <div className={`${theme === 'dark' ? 'bg-gray-700 text-indigo-400' : 'bg-indigo-100 text-indigo-600'} p-2 rounded-lg mr-3`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className={`font-semibold text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-indigo-900'}`}>College Information</h2>
          </div>
          <div className={`pl-10 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            <p className="flex items-center mb-1">
              <span className={`w-24 text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-400'} font-medium`}>College</span>
              <span className={`font-medium ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-800'}`}>{collegeInfo.name}</span>
            </p>
            <p className="flex items-center">
              <span className={`w-24 text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-400'} font-medium`}>Department</span>
              <span className={`font-medium ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-800'}`}>{collegeInfo.department || 'Not specified'}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Classes Management */}
          <div className={`group ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-indigo-50 border-indigo-100'} rounded-xl p-6 shadow-sm border relative overflow-hidden transform hover:-translate-y-1 transition-all duration-300`}>
            <div className={`absolute -right-8 -top-8 w-24 h-24 ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-600'} opacity-10 rounded-full group-hover:scale-[12] transition-transform duration-500`}></div>
            <div className="flex items-center mb-5 relative z-10">
              <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-indigo-100'} p-3 rounded-lg`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-indigo-900'}`}>Classes</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-400'}`}>Create and manage your classes</p>
              </div>
            </div>
            
            <div className={`${theme === 'dark' ? 'bg-gray-800 bg-opacity-60' : 'bg-white bg-opacity-60'} p-3.5 rounded-lg mb-6 relative z-10`}>
              <div className={`flex justify-between items-center p-3 rounded-lg`}>
                <div className={`text-lg ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-500'} font-medium`}>Total Classes</div>
                <div className={`text-lg font-bold ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'} tabular-nums`}>{classesCounts.total}</div>
              </div>
            </div>
            
            <Link
              href="/dashboard/faculty/classes"
              className={`relative z-10 block w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium text-white ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600' 
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700'
              } shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]`}
            >
              Manage Classes
            </Link>
          </div>

          {/* Assigned Classes */}
          <div className={`group ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-green-50 border-green-100'} rounded-xl p-6 shadow-sm border relative overflow-hidden transform hover:-translate-y-1 transition-all duration-300`}>
            <div className={`absolute -right-8 -top-8 w-24 h-24 ${theme === 'dark' ? 'bg-green-500' : 'bg-green-600'} opacity-10 rounded-full group-hover:scale-[12] transition-transform duration-500`}></div>
            <div className="flex items-center mb-5 relative z-10">
              <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-green-100'} p-3 rounded-lg`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-green-900'}`}>Assigned Classes</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-green-300' : 'text-green-400'}`}>View your assigned classes</p>
              </div>
            </div>
            
            <div className={`${theme === 'dark' ? 'bg-gray-800 bg-opacity-60' : 'bg-white bg-opacity-60'} p-4 rounded-lg mb-6 relative z-10`}>
              <p className={`${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>Access classes where you are assigned as faculty, view students, and mark attendance.</p>
            </div>
            
            <Link
              href="/dashboard/faculty/assigned-classes"
              className={`relative z-10 block w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium text-white ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600' 
                  : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
              } shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]`}
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
      <div className={`p-6 mx-auto ${theme === 'dark' ? 'text-gray-200 bg-[var(--background)]' : ''}`}>
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600'}`}>Faculty Dashboard</h1>
          
          <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} px-4 py-2 rounded-full shadow-sm ${theme === 'dark' ? 'border-gray-700' : 'border-indigo-100'} border`}>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{user?.displayName || user?.email}</span>
            <span className={`ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              theme === 'dark' ? 'bg-gray-700 text-indigo-300' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {userRole}
            </span>
          </div>
        </div>

        {message.text && (
          <div
            className={`p-4 mb-6 rounded-lg border ${
              message.type === 'error'
                ? theme === 'dark' ? 'bg-red-900/50 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
                : theme === 'dark' ? 'bg-green-900/50 border-green-800 text-green-300' : 'bg-green-50 border-green-200 text-green-700'
            } animate-fadeIn`}
            role="alert"
          >
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* Safety Alert Section */}
        <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-red-900/30 to-orange-900/20 border-red-800' : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-100'} backdrop-blur-sm rounded-xl p-6 mb-8 shadow-sm border transform hover:scale-[1.01] transition-all duration-300`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`${theme === 'dark' ? 'bg-red-900/50' : 'bg-red-100'} p-3 rounded-lg`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>Safety Alerts</h2>
                <p className={`${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>Create urgent safety notifications for students and staff</p>
              </div>
            </div>
            <Link
              href="/dashboard/safety-alerts"
              className={`px-5 py-2.5 ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800' 
                  : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
              } text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-sm font-medium flex items-center transform hover:scale-[1.02]`}
            >
              Create Safety Alert
            </Link>
          </div>
        </div>

        {renderContent()}
      </div>
    </ProfileCompletionWrapper>
  );
}

// Wrap the component with role protection, allowing admin and faculty access
export default withRoleProtection(FacultyDashboard, ['hod', 'faculty']);
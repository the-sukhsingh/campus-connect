'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ProfileCompletionWrapper from '@/components/ProfileCompletionWrapper';
import WelcomeTour from '@/components/WelcomeTour';
import Tooltip from '@/components/Tooltip';
import dynamic from 'next/dynamic';

// Dynamically import the NotificationSubscription component (client-side only)
const NotificationSubscription = dynamic(
  () => import('@/components/NotificationSubscription'),
  { ssr: false }
);

function StudentDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [enrolledClass, setEnrolledClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    borrowedBooks: 0,
    newProperty: 0
  });

  // Fetch student's enrolled class
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Fetch enrolled class
        const classResponse = await fetch(`/api/user/student/classes?uid=${user?.uid}`);
        if (classResponse.ok) {
          const classData = await classResponse.json();
          // Get only the first class (since students are assigned to only one)
          setEnrolledClass(classData.classes && classData.classes.length > 0 ? classData.classes[0] : null);
        }
        
      
        // Fetch upcoming events
        const eventsResponse = await fetch(`/api/events?uid=${user?.uid}&action=count-upcoming`);
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setStats(prev => ({...prev, upcomingEvents: eventsData.count || 0}));
        }
        
        // Fetch borrowed books
        const booksResponse = await fetch(`/api/library/borrowings?uid=${user?.uid}&action=count-current`);
        if (booksResponse.ok) {
          const booksData = await booksResponse.json();
          setStats(prev => ({...prev, borrowedBooks: booksData.count || 0}));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);


  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return `${theme === 'dark' ? 'bg-green-900 text-green-100 border-green-700' : 'bg-green-100 text-green-800 border-green-200'}`;
      case 'pending':
        return `${theme === 'dark' ? 'bg-yellow-900 text-yellow-100 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`;
      case 'rejected':
        return `${theme === 'dark' ? 'bg-red-900 text-red-100 border-red-700' : 'bg-red-100 text-red-800 border-red-200'}`;
      default:
        return `${theme === 'dark' ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200'}`;
    }
  };

  return (
    <ProfileCompletionWrapper>
      <div className={`p-6 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-slate-50 to-slate-100'} min-h-screen overflow-hidden`}>
        {/* Welcome Tour */}
        <WelcomeTour role="student" />
        
        {/* Dashboard Header with Stats */}
        <div className="relative mb-10">
          <div className={`absolute top-0 left-0 w-full h-32 ${theme === 'dark' ? 'bg-indigo-900' : 'bg-indigo-600'} opacity-5 rounded-xl`}></div>
          <div className={`absolute top-0 right-0 w-1/3 h-32 ${theme === 'dark' ? 'bg-purple-800' : 'bg-purple-500'} opacity-5 rounded-xl transform rotate-45 translate-x-1/4 -translate-y-1/4`}></div>
          
          <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-4">
            <div className="animate-fadeIn">
              <h1 className={`text-3xl font-light mb-2 ${theme === 'dark' ? 'text-indigo-100' : 'text-indigo-900'}`}>Hello, <span className="font-semibold">{user?.displayName?.split(' ')[0] || 'Student'}</span></h1>
              <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-sm tracking-wide`}>Your academic journey at a glance</p>
            </div>
            
            <div className="flex flex-wrap gap-4 animate-slideIn">
              <div className={`${theme === 'dark' ? 'bg-slate-800 shadow-lg' : 'bg-white shadow-sm'} backdrop-blur-sm bg-opacity-70 rounded-xl px-5 py-3 flex items-center transform transition-all hover:translate-y-[-2px] hover:shadow`}>
                <div className={`mr-3 ${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-50'} p-2 rounded-full`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Events</p>
                  <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-900'}`}>{stats.upcomingEvents}</p>
                </div>
              </div>
              
              <div className={`${theme === 'dark' ? 'bg-slate-800 shadow-lg' : 'bg-white shadow-sm'} backdrop-blur-sm bg-opacity-70 rounded-xl px-5 py-3 flex items-center transform transition-all hover:translate-y-[-2px] hover:shadow`}>
                <div className={`mr-3 ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-50'} p-2 rounded-full`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Books</p>
                  <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-900'}`}>{stats.borrowedBooks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {message.text && (
          <div
            className={`p-4 mb-6 border-l-4 ${
              message.type === 'error'
                ? theme === 'dark' 
                  ? 'bg-red-900 border-red-700 text-red-100'
                  : 'bg-red-100 border-red-500 text-red-700'
                : theme === 'dark'
                  ? 'bg-green-900 border-green-700 text-green-100'
                  : 'bg-green-100 border-green-500 text-green-700'
            } rounded-md shadow-sm animate-fadeIn`}
            role="alert"
          >
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Class Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`${theme === 'dark' ? 'bg-slate-800 bg-opacity-90' : 'bg-white bg-opacity-80'} backdrop-blur-sm shadow-sm rounded-xl p-6 student-dashboard overflow-hidden relative`}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${theme === 'dark' ? 'bg-indigo-900' : 'bg-indigo-100'} rounded-full opacity-20 transform translate-x-1/2 -translate-y-1/2`}></div>
              
              <div className="flex justify-between items-center mb-6 relative overflow-visible">
                <h2 className={`text-xl font-semibold flex items-center ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-900'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                  My Class
                </h2>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-24 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 relative">
                      <div className={`absolute inset-0 rounded-full border-2 ${theme === 'dark' ? 'border-indigo-900' : 'border-indigo-100'} opacity-25`}></div>
                      <div className={`absolute top-0 left-0 h-full w-full rounded-full border-t-2 border-l-2 ${theme === 'dark' ? 'border-indigo-400' : 'border-indigo-600'} animate-spin`}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {enrolledClass ? (
                    <div className="animate-[fadeIn_0.6s_ease-out]">
                      <div className={`border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'} rounded-xl p-6 hover:shadow-md transition-all duration-300`}>
                        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                          <div>
                            <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-900'} mb-2`}>{enrolledClass.name}</h3>
                            <div className="space-y-2">
                              <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} flex items-center`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="font-medium">Course:</span> 
                                <span className="ml-1">{enrolledClass.course}</span>
                              </p>
                              <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} flex items-center`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span className="font-medium">Department:</span> 
                                <span className="ml-1">{enrolledClass.department}</span>
                              </p>
                              <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} flex items-center`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">Semester:</span> 
                                <span className="ml-1">{enrolledClass.currentSemester || 1} of {enrolledClass.totalSemesters || 8}</span>
                              </p>
                            </div>
                          </div>

                        </div>

                          <div className={`${theme === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-50/50'} p-4 rounded-xl`}>
                            <h4 className={`${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-900'} font-medium text-sm mb-2 flex items-center`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Important Information
                            </h4>
                            <p className={`text-sm ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>
                              All class announcements, materials, and updates will be provided here. Be sure to check regularly for important information from your instructors.
                            </p>
                          </div>

                        
                      </div>
                    </div>
                  ) : (
                    <div className={`py-10 text-center ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50/50'} rounded-xl`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 mx-auto ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'} mb-3`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mb-4`}>You haven&apos;t been assigned to a class yet.</p>
                      <p className={`${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} text-sm max-w-md mx-auto`}>Please contact your department administrator for class assignment.</p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Action Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {/* Attendance Card */}
              <Link
                href="/dashboard/student/attendance"
                className={`${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-indigo-50'} p-6 rounded-xl shadow-sm transition-all duration-300 flex flex-col relative overflow-hidden group`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${theme === 'dark' ? 'bg-indigo-900' : 'bg-indigo-100'} rounded-full opacity-20 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-[10] transition-transform duration-500`}></div>
                <div className={`flex items-center justify-center h-14 w-14 ${theme === 'dark' ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-600'} rounded-2xl mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-900'} relative z-10`}>Check Attendance</h3>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-sm mb-4 relative z-10`}>View your attendance records and current status</p>
                <div className="mt-auto flex items-center text-sm font-medium relative z-10">
                  <span className={`${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} group-hover:underline`}>View records</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
              
              {/* Events Card */}
              <Link
                href="/dashboard/student/events"
                className={`${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-purple-50'} p-6 rounded-xl shadow-sm transition-all duration-300 flex flex-col relative overflow-hidden group`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'} rounded-full opacity-20 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-[10] transition-transform duration-500`}></div>
                <div className={`flex items-center justify-center h-14 w-14 ${theme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-600'} rounded-2xl mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-purple-200' : 'text-purple-900'} relative z-10`}>View Events</h3>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-sm mb-4 relative z-10`}>Browse upcoming campus events and activities</p>
                <div className="mt-auto flex items-center text-sm font-medium relative z-10">
                  <span className={`${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} group-hover:underline`}>Explore events</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
              
              {/* My Books Card */}
              <Link
                href="/dashboard/student/books"
                className={`${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-blue-50'} p-6 rounded-xl shadow-sm transition-all duration-300 flex flex-col relative overflow-hidden group`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'} rounded-full opacity-20 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-[10] transition-transform duration-500`}></div>
                <div className={`flex items-center justify-center h-14 w-14 ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-600'} rounded-2xl mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-blue-200' : 'text-blue-900'} relative z-10`}>My Books</h3>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-sm mb-4 relative z-10`}>Manage your borrowed books and due dates</p>
                <div className="mt-auto flex items-center text-sm font-medium relative z-10">
                  <span className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} group-hover:underline`}>Manage books</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
              
              {/* Browse Books Card */}
              <Link
                href="/dashboard/student/books/catalog"
                className={`${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-emerald-50'} p-6 rounded-xl shadow-sm transition-all duration-300 flex flex-col relative overflow-hidden group`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${theme === 'dark' ? 'bg-emerald-900' : 'bg-emerald-100'} rounded-full opacity-20 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-[10] transition-transform duration-500`}></div>
                <div className={`flex items-center justify-center h-14 w-14 ${theme === 'dark' ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-100 text-emerald-600'} rounded-2xl mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-emerald-200' : 'text-emerald-900'} relative z-10`}>Browse Books</h3>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-sm mb-4 relative z-10`}>Explore library catalog and find new books</p>
                <div className="mt-auto flex items-center text-sm font-medium relative z-10">
                  <span className={`${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} group-hover:underline`}>Search catalog</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Notification Subscription Component */}
            <NotificationSubscription />
            
            {/* Help & Support */}
            <div className={`${theme === 'dark' ? 'bg-slate-800 bg-opacity-80' : 'bg-white bg-opacity-80'} backdrop-blur-sm shadow-sm rounded-xl p-6 overflow-hidden relative group`}>
              <div className={`absolute top-0 right-0 w-24 h-24 ${theme === 'dark' ? 'bg-amber-600' : 'bg-amber-100'} rounded-full opacity-20 transform transition-transform duration-500 group-hover:scale-[12] translate-x-1/4 -translate-y-1/4`}></div>
              
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-900'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Need Help?
              </h3>
              <div className={`prose prose-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} relative`}>
                <p className="mb-2">Having trouble? Here&apos;s how to get started:</p>
                <ul className="space-y-1 my-3 ml-1">
                  {[
                    "Check your attendance record",
                    "Access class materials",
                    "Borrow books from our library",
                    "Register for campus events",
                    "Enable notifications for updates"
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start">
                      <svg className={`h-3.5 w-3.5 ${theme === 'dark' ? 'text-amber-600' : 'text-amber-500'} mr-2 mt-0.5`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
                <a href="/help/student" className={`mt-3 inline-flex items-center ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} font-medium transition-colors text-sm group`}>
                  <span>View Student Guide</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .hover-float:hover {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </ProfileCompletionWrapper>
  );
}

// Wrap the component with role protection, allowing admin, faculty, and student access
export default withRoleProtection(StudentDashboard, ['hod', 'faculty', 'student']);
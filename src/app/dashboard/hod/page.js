'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';

// Dynamically import the NotificationSubscription component (client-side only)
const NotificationSubscription = dynamic(
  () => import('@/components/NotificationSubscription'),
  { ssr: false }
);

function HodDashboard() {
  const { user, userRole } = useAuth();
  const { theme } = useTheme();
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch college information and pending requests for the HOD
  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/user/college?uid=${user?.uid}`);

      if (!response.ok) {
        throw new Error('Failed to fetch college information');
      }

      const data = await response.json();
      setCollegeInfo(data.college);

      // If college exists, fetch pending teacher requests
      if (data.college) {
        // Fetch recent college announcements
        const announcementsResponse = await fetch(
          `/api/announcements?uid=${user?.uid}&action=get-college-announcements&collegeId=${data.college._id}&limit=5`
        );

        if (announcementsResponse.ok) {
          const announcementsData = await announcementsResponse.json();
          setAnnouncements(announcementsData.announcements || []);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 sm:p-6">
      {/* Header Section with Avatar */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4 overflow-hidden">
              
               { user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'H'}
             
            </div>
            <div>
              <h1 className="text-2xl font-bold">HOD Dashboard</h1>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Welcome, <span className="font-semibold">{user?.displayName || user?.email}</span>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {userRole}
                </span>
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Safety Alert Section - Enhanced with animation on hover */}
      <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-red-950/30 to-red-900/30 border border-red-800' : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200'} rounded-2xl p-4 mb-6 transition-all duration-300 hover:shadow-lg`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-start mb-4 sm:mb-0">
            <div className={`${theme === 'dark' ? 'bg-red-900' : 'bg-red-100'} p-3 rounded-full`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>Safety Alerts</h2>
              <p className={`${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>Create and manage urgent safety notifications</p>
            </div>
          </div>
          <Link
            href="/dashboard/safety-alerts"
            className={`w-full sm:w-auto px-4 py-2 ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white' 
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
            } rounded-lg transition-all duration-300 text-sm font-medium flex items-center justify-center`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Create Safety Alert
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-l-2 border-indigo-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm text-indigo-600">Loading</div>
          </div>
        </div>
      ) : (
        <>
          {!collegeInfo ? (
            <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-amber-900/30 to-amber-800/30 border-l-4 border-amber-500' : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400'} rounded-lg p-6 mb-6 shadow-sm`}>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="flex-shrink-0 mb-4 sm:mb-0">
                  <svg className={`h-12 w-12 ${theme === 'dark' ? 'text-amber-500' : 'text-yellow-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="sm:ml-5">
                  <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-amber-300' : 'text-yellow-800'}`}>College Setup Required</h3>
                  <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-amber-200' : 'text-yellow-700'}`}>
                    You haven&apos;t set up your college yet. Please set up your college to get started with the full range of HOD features.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => router.push('/dashboard/hod/college/setup')}
                      className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white'
                          : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white'
                      } transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Setup College
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* College Information - Modern card with hover effect */}
              <div className={`${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'} rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl lg:col-span-2`}>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
                  <div className="flex items-center">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold ml-3">College Information</h2>
                  </div>
                </div>
                <div className="p-5 flex justify-between items-end">
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>College Name</span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{collegeInfo.name}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>College Code</span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{collegeInfo.code}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Domain</span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{collegeInfo.domain}</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => router.push('/dashboard/hod/college/manage')}
                      className="group w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Manage College
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Management - Styled to match design */}
              <div className={`${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'} h-fit rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl`}>
                  <NotificationSubscription />
              </div>

              {/* Quick Access Cards Grid - Better mobile experience */}
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* Classes Management Card */}
                <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-green-900/30 to-teal-900/30 border border-green-800/60' : 'bg-gradient-to-br from-green-50 to-teal-50 border border-green-100'} rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:border-opacity-100 flex flex-col`}>
                  <div className="p-5 flex-grow">
                    <div className={`rounded-full ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'} w-12 h-12 flex items-center justify-center mb-4`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-green-300' : 'text-green-800'} mb-2`}>Classes</h2>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                      Manage and view all classes in your college
                    </p>
                  </div>
                  <div className="mt-auto p-5 pt-0">
                    <button
                      onClick={() => router.push('/dashboard/hod/classes')}
                      className={`w-full group inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white ${
                        theme === 'dark'
                          ? 'bg-gradient-to-r from-green-700 to-teal-700 hover:from-green-600 hover:to-teal-600'
                          : 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
                      } transition-all duration-300`}
                    >
                      View Classes
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Teachers Management Card */}
                <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-800/60' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100'} rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:border-opacity-100 flex flex-col`}>
                  <div className="p-5 flex-grow">
                    <div className={`rounded-full ${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'} w-12 h-12 flex items-center justify-center mb-4`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-800'} mb-2`}>Teachers</h2>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                      View and manage all teachers in your college
                    </p>
                  </div>
                  <div className="mt-auto p-5 pt-0">
                    <button
                      onClick={() => router.push('/dashboard/hod/teachers')}
                      className={`w-full group inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white ${
                        theme === 'dark'
                          ? 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
                      } transition-all duration-300`}
                    >
                      Manage Teachers
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Library Management Card */}
                <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-blue-900/30 to-teal-900/30 border border-blue-800/60' : 'bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100'} rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:border-opacity-100 flex flex-col`}>
                  <div className="p-5 flex-grow">
                    <div className={`rounded-full ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'} w-12 h-12 flex items-center justify-center mb-4`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    </div>
                    <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'} mb-2`}>Library</h2>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                      Manage library resources and assign librarians
                    </p>
                  </div>
                  <div className="mt-auto p-5 pt-0">
                    <button
                      onClick={() => router.push('/dashboard/hod/library')}
                      className={`w-full group inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white ${
                        theme === 'dark'
                          ? 'bg-gradient-to-r from-blue-700 to-teal-700 hover:from-blue-600 hover:to-teal-600'
                          : 'bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700'
                      } transition-all duration-300`}
                    >
                      Manage Library
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Announcements - Redesigned with cards */}
              <div className={`${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'} rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl sm:col-span-3`}>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between">
                    <div className="flex items-center mb-4 sm:mb-0">
                      <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-bold text-white ml-3">Announcements</h2>
                    </div>
                    <button
                      onClick={() => router.push('/dashboard/hod/announcements')}
                      className="group inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 transition-all duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Manage Announcements
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  {announcements.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {announcements.map((announcement) => (
                        <div 
                          key={announcement._id} 
                          className={`${theme === 'dark' ? 'bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600' : 'bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-100'} rounded-xl p-4 hover:shadow-md transition-all duration-300`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} line-clamp-1`}>{announcement.title}</h3>
                            <span className={`text-xs ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'} px-2 py-1 rounded-full`}>
                              {formatDate(announcement.createdAt)}
                            </span>
                          </div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} line-clamp-2 mb-3`}>{announcement.content}</p>
                          <div className="flex justify-between items-center mt-auto text-xs">
                            <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {announcement.createdBy?.displayName || announcement.createdBy?.email || 'Unknown'}
                            </span>
                            {announcement.expiryDate && (
                              <span className={`${theme === 'dark' ? 'bg-amber-900/50 text-amber-200' : 'bg-amber-50 text-amber-700'} px-2 py-1 rounded-full flex items-center`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Expires: {formatDate(announcement.expiryDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center py-10 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mb-3`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                      <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>No announcements yet</p>
                      <button
                        onClick={() => router.push('/dashboard/hod/announcements/create')}
                        className={`mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${
                          theme === 'dark'
                            ? 'text-white bg-blue-600 hover:bg-blue-700'
                            : 'text-white bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        Create Announcement
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing only HOD access
export default withRoleProtection(HodDashboard, ['hod']);
'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function HodDashboard() {
  const { user, userRole } = useAuth();
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [pendingTeacherRequests, setPendingTeacherRequests] = useState(0);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
        const requestsResponse = await fetch(
          `/api/user/college/teachers?uid=${user?.uid}&action=pending&collegeId=${data.college._id}`
        );

        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          setPendingTeacherRequests(requestsData.pendingRequests?.length || 0);
          setPendingTeachers(requestsData.pendingRequests || []);
        }
        
        // Fetch recent college announcements
        const announcementsResponse = await fetch(
          `/api/announcements?uid=${user?.uid}&action=get-college-announcements&collegeId=${data.college._id}&limit=5`
        );
        
        if (announcementsResponse.ok) {
          const announcementsData = await announcementsResponse.json();
          setAnnouncements(announcementsData.announcements || []);
        }
      }
    } catch (error ) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

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
      <h1 className="text-2xl font-bold mb-4">HOD Dashboard</h1>
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <p className="text-gray-700">
          Welcome, <span className="font-semibold">{user?.displayName || user?.email}</span>! 
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {userRole}
          </span>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {!collegeInfo ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You haven&apos;t set up your college yet. Please set up your college to get started.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => router.push('/dashboard/hod/college/setup')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:shadow-outline-indigo"
                    >
                      Setup College
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* College Information */}
              <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold">College Information</h2>
                  </div>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">College Name:</span> {collegeInfo.name}</p>
                  <p><span className="font-medium">College Code:</span> {collegeInfo.code}</p>
                  <p><span className="font-medium">Domain:</span> {collegeInfo.domain}</p>
                  <p><span className="font-medium">Unique ID:</span> <span className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{collegeInfo.uniqueId}</span></p>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/dashboard/hod/college/manage')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Manage College
                  </button>
                </div>
              </div>
              
              {/* Teacher Requests */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-semibold">Teacher Requests</h2>
                    </div>
                  </div>
                  <button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="inline-flex items-center p-2 border border-transparent rounded-md text-indigo-600 hover:bg-indigo-50"
                    title="Refresh requests"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                
                {pendingTeacherRequests > 0 ? (
                  <div>
                    <p className="text-gray-600 mb-4">
                      You have <span className="font-bold text-orange-600">{pendingTeacherRequests}</span> pending teacher requests that require your attention.
                    </p>
                    
                    <div className="mt-3 max-h-60 overflow-y-auto border rounded-md">
                      <ul className="divide-y divide-gray-200">
                        {pendingTeachers.map((teacher) => (
                          <li key={teacher._id} className="p-3 hover:bg-gray-50">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{teacher.displayName || "Unnamed Teacher"}</p>
                                <p className="text-sm text-gray-500">{teacher.email}</p>
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(teacher.createdAt)}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        onClick={() => router.push('/dashboard/hod/teachers')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                      >
                        Review All Requests
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-3">
                      No pending teacher requests at this time.
                    </p>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      {refreshing ? 'Checking...' : 'Check Again'}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Classes Management */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold">Classes</h2>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Manage and view all classes in your college.
                </p>
                <button
                  onClick={() => router.push('/dashboard/hod/classes')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  View Classes
                </button>
              </div>
              
              {/* Teachers Management */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold">Teachers</h2>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  View and manage all teachers in your college.
                </p>
                <button
                  onClick={() => router.push('/dashboard/hod/teachers')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                >
                  Manage Teachers
                </button>
              </div>
              
              {/* Library Management */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-teal-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold">Library</h2>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Manage library, assign librarians, and view library statistics.
                </p>
                <button
                  onClick={() => router.push('/dashboard/hod/library')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700"
                >
                  Manage Library
                </button>
              </div>
              
              {/* Announcements */}
              <div className="bg-white shadow rounded-lg p-6 md:col-span-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-semibold">Announcements</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/hod/announcements')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Manage Announcements
                  </button>
                </div>
                
                <div className="mt-2">
                  {announcements.length > 0 ? (
                    <div>
                      <p className="text-gray-600 mb-3">Recent announcements in your college:</p>
                      <div className="border rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {announcements.map((announcement) => (
                            <li key={announcement._id} className="p-3 hover:bg-gray-50">
                              <div>
                                <div className="flex justify-between">
                                  <p className="font-medium">{announcement.title}</p>
                                  <span className="text-xs text-gray-500">{formatDate(announcement.createdAt)}</span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{announcement.content}</p>
                                <div className="flex mt-2 justify-between items-center">
                                  <div className="text-xs text-gray-500">
                                    By: {announcement.createdBy?.displayName || announcement.createdBy?.email || 'Unknown'}
                                  </div>
                                  {announcement.expiryDate && (
                                    <div className="text-xs bg-yellow-50 px-2 py-1 rounded">
                                      Expires: {formatDate(announcement.expiryDate)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-md">
                      <p className="text-gray-600">No recent announcements</p>
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
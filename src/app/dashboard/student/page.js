'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ProfileCompletionWrapper from '@/components/ProfileCompletionWrapper';
import WelcomeTour from '@/components/WelcomeTour';
import Tooltip from '@/components/Tooltip';

function StudentDashboard() {
  const { user } = useAuth();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    attendance: 0,
    upcomingEvents: 0,
    borrowedBooks: 0,
    newProperty: 0
  });

  // Fetch student's enrolled classes
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Fetch enrolled classes
        const classResponse = await fetch(`/api/user/student/classes?uid=${user?.uid}`);
        if (classResponse.ok) {
          const classData = await classResponse.json();
          setEnrolledClasses(classData.classes || []);
        }
        
        // Fetch attendance stats
        const attendanceResponse = await fetch(`/api/attendance?uid=${user?.uid}&action=get-student-stats`);
        if (attendanceResponse.ok) {
          const attData = await attendanceResponse.json();
          setStats(prev => ({...prev, attendance: attData.averageAttendance || 0}));
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
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <ProfileCompletionWrapper>
      <div className="p-6">
        {/* Welcome Tour */}
        <WelcomeTour role="student" />
        
        {/* Dashboard Header with Stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Student Dashboard</h1>
            <p className="text-gray-600">Access your classes, attendance, and campus resources</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="bg-white rounded-lg shadow-sm border border-indigo-100 px-4 py-2 flex items-center">
              <div className="mr-3 bg-indigo-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Attendance</p>
                <p className="text-lg font-semibold">{stats.attendance}%</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-purple-100 px-4 py-2 flex items-center">
              <div className="mr-3 bg-purple-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Upcoming Events</p>
                <p className="text-lg font-semibold">{stats.upcomingEvents}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-blue-100 px-4 py-2 flex items-center">
              <div className="mr-3 bg-blue-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Borrowed Books</p>
                <p className="text-lg font-semibold">{stats.borrowedBooks}</p>
              </div>
            </div>
          </div>
        </div>

        {message.text && (
          <div
            className={`p-4 mb-6 border-l-4 ${
              message.type === 'error'
                ? 'bg-red-100 border-red-500 text-red-700'
                : 'bg-green-100 border-green-500 text-green-700'
            } rounded-md shadow-sm animate-fadeIn`}
            role="alert"
          >
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6 mb-6 student-dashboard">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                  My Classes
                </h2>
                <Tooltip content="View all of your enrolled classes and their status">
                  <span className="text-sm text-indigo-600 cursor-help">What&apos;s this?</span>
                </Tooltip>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledClasses.map((classItem) => (
                    <div key={classItem._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{classItem.name}</h4>
                          <p className="text-sm text-gray-600">
                            {classItem.course} - {classItem.semester}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Department: {classItem.department}</p>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${getStatusBadgeClass(classItem.status)}`}
                          title={`Status: ${classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1)}`}
                        >
                          {classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1)}
                        </span>
                      </div>
                      {classItem.status === 'approved' && (
                        <div className="mt-3 pt-3 border-t flex justify-between">
                          <Link 
                            href={`/dashboard/student/attendance?classId=${classItem._id}`}
                            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md transition-colors"
                          >
                            View Attendance
                          </Link>
                          <Link 
                            href={`/dashboard/student/classes/${classItem._id}`}
                            className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded-md transition-colors"
                          >
                            Class Details
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          
          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                </svg>
                Quick Actions
              </h3>
              <div className="space-y-3 library-access">
                <Link
                  href="/dashboard/student/attendance"
                  className="flex items-center p-3 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Check Attendance
                </Link>
                
                <Link
                  href="/dashboard/student/events"
                  className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  View Events
                </Link>
                
                <Link
                  href="/dashboard/student/books"
                  className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0-2.443.29-3.5.804v-10A7.968 7.968 0 0014.5 4c1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  My Books
                </Link>
                
                <Link
                  href="/dashboard/student/books/catalog"
                  className="flex items-center p-3 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                  Browse Book Catalog
                </Link>
              </div>
            </div>
            
            {/* Help & Support */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Need Help?
              </h3>
              <div className="prose prose-sm text-gray-600">
                <p>Having trouble navigating the dashboard? Here are some quick tips:</p>
                <ul className="list-disc pl-5 my-3 space-y-1">
                  <li>Enter the Class ID provided by your instructor to join a class</li>
                  <li>Check your attendance records and upcoming classes</li>
                  <li>Borrow books from the library catalog</li>
                  <li>View and register for upcoming campus events</li>
                </ul>
                <p className="mt-3">
                  <a href="/help/student" className="text-indigo-600 hover:text-indigo-800 flex items-center">
                    <span>View Student Guide</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add some basic animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </ProfileCompletionWrapper>
  );
}

// Wrap the component with role protection, allowing admin, faculty, and student access
export default withRoleProtection(StudentDashboard, ['hod', 'faculty', 'student']);
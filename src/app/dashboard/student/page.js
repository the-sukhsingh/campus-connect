'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ProfileCompletionWrapper from '@/components/ProfileCompletionWrapper';

function StudentDashboard() {
  const { user } = useAuth();
  const [classId, setClassId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [joining, setJoining] = useState(false);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch student's enrolled classes
  useEffect(() => {
    const fetchEnrolledClasses = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/user/student/classes?uid=${user?.uid}`);

        if (response.ok) {
          const data = await response.json();
          setEnrolledClasses(data.classes || []);
        }
      } catch (error) {
        console.error('Error fetching enrolled classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledClasses();
  }, [user]);


  return (
    <ProfileCompletionWrapper>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>

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

        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-lg mb-2">My Enrolled Classes</h3>

          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : enrolledClasses.length === 0 ? (
            <p className="text-gray-500">You haven&apos;t joined any classes yet. Use the form below to join a class.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {enrolledClasses.map((classItem) => (
                <div key={classItem._id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{classItem.name}</h4>
                      <p className="text-sm text-gray-600">
                        {classItem.course} - {classItem.semester}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Department: {classItem.department}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        classItem.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : classItem.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">My Classes</h3>
            <p className="text-gray-600 mb-4">Access your enrolled classes and view attendance.</p>
            <Link
              href="/dashboard/student/attendance"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              View Attendance
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">Library</h3>
            <p className="text-gray-600 mb-4">Browse and borrow books from the library.</p>
            <div className="flex flex-col space-y-2">
              <Link
                href="/dashboard/student/books"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0-2.443.29-3.5.804v-10A7.968 7.968 0 0014.5 4c1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                My Books
              </Link>
              <Link
                href="/dashboard/student/books/catalog"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                Browse Book Catalog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProfileCompletionWrapper>
  );
}

// Wrap the component with role protection, allowing admin, faculty, and student access
export default withRoleProtection(StudentDashboard, ['hod', 'faculty', 'student']);
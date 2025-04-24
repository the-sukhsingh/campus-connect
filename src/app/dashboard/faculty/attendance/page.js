'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function AttendancePage() {
  const { user, userRole } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/attendance?action=get-classes&uid=${user?.uid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch classes');
        }
        
        const data = await response.json();
        setClasses(data.classes || []);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Manage Attendance
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg text-red-700 p-4 mb-6 animate-fade-in" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
              </svg>
            </div>
          </div>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </svg>
            <p className="text-lg text-gray-600">
              You don&apos;t have any classes assigned yet.
            </p>
            <p className="text-sm text-gray-500">
              Please contact the administrator to get your classes assigned.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <div 
              key={classItem._id} 
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{classItem.name}</h3>
                </div>
                
                <div className="space-y-2 mb-6">
                  <p className="text-gray-600 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    {classItem.department}
                  </p>
                  <p className="text-gray-600 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Batch: {classItem.batch} - {classItem.semester}
                  </p>
                </div>
                
                <Link
                  href={`/dashboard/faculty/attendance/mark?classId=${classItem._id}`}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform group-hover:scale-[1.02]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  Mark Attendance
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing admin and faculty access
export default withRoleProtection(AttendancePage, ['hod', 'faculty']);
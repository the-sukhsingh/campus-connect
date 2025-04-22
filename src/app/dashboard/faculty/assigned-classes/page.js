'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { withRoleProtection } from '@/utils/withRoleProtection';

function AssignedClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceSummaries, setAttendanceSummaries] = useState({});
  const [loadingSummaries, setLoadingSummaries] = useState(false);

  const fetchAttendanceSummaries = async (classList) => {
    try {
      setLoadingSummaries(true);
      
      // Create an object to store summaries for each class
      const summaries = {};
      
      // Fetch attendance summaries for each class
      await Promise.all(
        classList.map(async (classItem) => {
          if (!classItem._id) return;
          
          try {
            const response = await fetch(
              `/api/attendance?action=get-class-summary&uid=${user?.uid}&classId=${classItem._id}`
            );
            
            if (!response.ok) return;
            
            const data = await response.json();
            summaries[classItem._id] = data.summary || { 
              lastMarked: null,
              totalDays: 0,
              subjects: []
            };
          } catch (err) {
            console.error(`Error fetching attendance for class ${classItem._id}:`, err);
          }
        })
      );
      
      setAttendanceSummaries(summaries);
    } catch (err) {
      console.error('Error fetching attendance summaries:', err);
    } finally {
      setLoadingSummaries(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchAssignedClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/user/college/teachers?uid=${user?.uid}&action=assigned-classes`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch assigned classes');
        }
        
        const data = await response.json();
        setClasses(data.classes || []);
        
        // Fetch attendance summaries after getting classes
        if (data.classes?.length > 0) {
          fetchAttendanceSummaries(data.classes);
        }
      } catch (err) {
        console.error('Error fetching assigned classes:', err);
        setError(err.message || 'Failed to load assigned classes');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedClasses();
  }, [user]);
  
 

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Assigned Classes</h1>
          <p className="text-gray-600 mt-1">View and manage your classes and attendance</p>
        </div>
       
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You don&apos;t have any assigned classes yet. Please contact the class creator or administrator.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => {
            const attendanceSummary = attendanceSummaries[classItem._id] || { 
              lastMarked: null, 
              totalDays: 0, 
              subjects: []
            };
            
            return (
              <div 
                key={classItem._id} 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{classItem.name}</h3>
                <div className="space-y-1 mb-4">
                  <p className="text-gray-600">Course: {classItem.course}</p>
                  <p className="text-gray-600">Department: {classItem.department}</p>
                  <p className="text-gray-600">Batch: {classItem.batch} - {classItem.semester}</p>
                </div>
                
                {classItem.teachingSubjects && classItem.teachingSubjects.length > 0 && (
                  <div className="mt-2 mb-4">
                    <p className="text-sm font-medium text-gray-700">My Subjects:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {classItem.teachingSubjects.map((subject) => (
                        <span 
                          key={subject}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Attendance Summary */}
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Attendance Summary</h4>
                  
                  {loadingSummaries ? (
                    <div className="flex justify-center py-2">
                      <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        Last marked: {formatDate(attendanceSummary.lastMarked)}
                      </p>
                      <p className="text-gray-600">
                        Total days: {attendanceSummary.totalDays || 0}
                      </p>
                      {attendanceSummary.subjects && attendanceSummary.subjects.length > 0 ? (
                        <div className="mt-1">
                          <p className="text-xs text-gray-500">
                            Recent subjects: {attendanceSummary.subjects.slice(0, 2).join(', ')}
                            {attendanceSummary.subjects.length > 2 ? ' ...' : ''}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={`/dashboard/faculty/assigned-classes/students?classId=${classItem._id}`}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center justify-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                    </svg>
                    View Students
                  </Link>
                  
                  <Link
                    href={`/dashboard/faculty/attendance/mark?classId=${classItem._id}`}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded flex items-center justify-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    Mark Attendance
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing admin and faculty access
export default withRoleProtection(AssignedClassesPage, ['hod', 'faculty']);
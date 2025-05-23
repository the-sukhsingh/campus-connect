'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, useSearchParams } from 'next/navigation';

// Main component that uses searchParams
function ClassStudentsContent() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const classId = searchParams.get('id');
  
  useEffect(() => {
    if (!user || !classId) return;

    const fetchClassData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch class details and students
        const response = await fetch(
          `/api/attendance?action=get-class-with-students&uid=${user?.uid}&classId=${classId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch class data');
        }
        
        const data = await response.json();
        setClassData(data.class);
        
        // Filter only approved students
        const approvedStudents = data.class.students.filter(
          (student) => student.status === 'approved'
        );
        setStudents(approvedStudents);
        
        // Fetch subjects this faculty can teach in this class
        const subjectsResponse = await fetch(
          `/api/attendance?action=get-class-subjects&uid=${user?.uid}&classId=${classId}`
        );
        
        if (!subjectsResponse.ok) {
          throw new Error('Failed to fetch subjects');
        }
        
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData.subjects || []);
        
      } catch (err) {
        console.error('Error fetching class data:', err);
        setError(err.message || 'Failed to load class data');
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [user, classId]);

  if (!classId) {
    return (
      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`${theme === 'dark' ? 'bg-red-900 border-red-800' : 'bg-red-100 border-red-500'} border-l-4 text-${theme === 'dark' ? 'red-200' : 'red-700'} p-4`} role="alert">
          <p>No class selected. Please go back and select a class.</p>
          <Link 
            href="/dashboard/hod/classes" 
            className={`mt-4 inline-block ${theme === 'dark' ? 'bg-blue-800' : 'bg-blue-600'} text-white px-4 py-2 rounded hover:${theme === 'dark' ? 'bg-blue-700' : 'bg-blue-700'}`}
          >
            Back to Classes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Class Students</h1>
          {classData && (
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
              {classData.name} - {classData.department} ({classData.currentSemester} Sem)
            </p>
          )}
        </div>
        <Link
          href="/dashboard/hod/classes"
          className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} ${theme === 'dark' ? 'text-white' : 'text-gray-800'} py-2 px-4 rounded transition-colors`}
        >
          Back to Classes
        </Link>
      </div>

      {error && (
        <div className={`${theme === 'dark' ? 'bg-red-900 border-red-800' : 'bg-red-100 border-red-500'} border-l-4 text-${theme === 'dark' ? 'red-200' : 'red-700'} p-4 mb-6`} role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
          </div>
        ) : (
          <>
            {subjects.length > 0 && (
              <div className="mb-6">
                <h2 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>My Subjects in This Class:</h2>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <span
                      key={subject}
                      className={`inline-block ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'} text-sm px-3 py-1 rounded-full`}
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <h2 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Students:</h2>
            
            {students.length === 0 ? (
              <div className={`${theme === 'dark' ? 'bg-yellow-900 border-yellow-800' : 'bg-yellow-50 border-yellow-400'} border-l-4 p-4`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-700'}`}>
                  No students enrolled in this class yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Name
                      </th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Email
                      </th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Roll No
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {students.map((student) => (
                      <tr key={student._id} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {student.student.displayName || 'Unnamed Student'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                          {student.student.email}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                          {student.student.rollNo || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Loading UI for suspense
function ClassStudentsLoading() {
  const { theme } = useTheme();
  
  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex justify-center items-center h-40">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
      </div>
    </div>
  );
}

// Wrapper component that safely gets search params
function ClassStudentsPage() {
  return (
    <Suspense fallback={<ClassStudentsLoading />}>
      <ClassStudentsContent />
    </Suspense>
  );
}

export default ClassStudentsPage;
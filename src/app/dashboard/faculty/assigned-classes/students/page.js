'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { withRoleProtection } from '@/utils/withRoleProtection';

function ClassStudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');

  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState({
    totalClasses: 0,
    lastMarkedDate: null,
    studentStats: []
  });
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (!user || !classId) return;

    const fetchClassData = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `/api/attendance?action=get-class-with-students&uid=${user?.uid}&classId=${classId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch class data');
        }

        const data = await response.json();
        setClassInfo(data.class);
        setStudents(data.class.students || []);

        // Fetch subjects this faculty can mark attendance for
        const subjectsResponse = await fetch(
          `/api/attendance?action=get-class-subjects&uid=${user?.uid}&classId=${classId}`
        );

        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json();
          setSubjects(subjectsData.subjects || []);
          
          if (subjectsData.subjects && subjectsData.subjects.length > 0) {
            setSelectedSubject(subjectsData.subjects[0]);
          }
        }

      } catch (err) {
        console.error('Error fetching class data:', err);
        setError('Failed to load class data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [user, classId]);

  // Fetch attendance statistics when subject changes
  useEffect(() => {
    if (!classId || !selectedSubject || !user) return;

    const fetchAttendanceStats = async () => {
      try {
        setLoadingAttendance(true);
        const response = await fetch(
          `/api/attendance?action=get-student-stats&uid=${user?.uid}&classId=${classId}&subject=${encodeURIComponent(selectedSubject)}`
        );

        if (response.ok) {
          const data = await response.json();
          setAttendanceData(data.summary || {
            totalClasses: 0,
            lastMarkedDate: null,
            studentStats: []
          });
          console.log('Attendance Data:', data.summary);
        }
      } catch (err) {
        console.error('Error fetching attendance statistics:', err);
      } finally {
        setLoadingAttendance(false);
      }
    };

    fetchAttendanceStats();
  }, [classId, selectedSubject, user]);

  const filteredStudents = students.filter(
    (student) => {
      const studentName = student?.student?.displayName?.toLowerCase() || '';
      const rollNo = student?.student?.rollNo?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      return studentName.includes(searchLower) || rollNo.includes(searchLower);
    }
  );

  const getAttendancePercentage = (studentId) => {
    const stats = attendanceData.studentStats.find(stat => stat._id === studentId);
    if (!stats) return 0;
    
    const total = stats.present + stats.absent + stats.late;
    if (total === 0) return 0;
    
    return Math.round(((stats.present + stats.late) / total) * 100);
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 75) return 'good';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  if (!classId) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>No class selected. Please go back and select a class.</p>
          <Link 
            href="/dashboard/faculty/assigned-classes" 
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Classes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Class Students</h1>
          {classInfo && (
            <p className="text-gray-600 mt-1">
              {classInfo.name} - {classInfo.department} ({classInfo.semester})
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/faculty/attendance/mark?classId=${classId}`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors"
          >
            Mark Attendance
          </Link>
          <Link
            href="/dashboard/faculty/assigned-classes"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
          >
            Back to Classes
          </Link>
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
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
              <div className="w-full md:w-1/2">
                <label htmlFor="search" className="sr-only">Search students</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search by name or roll number"
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {subjects.length > 0 && (
                <div className="w-full md:w-1/2">
                  <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Subject for Attendance Stats
                  </label>
                  <select
                    id="subject-select"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No students found {searchTerm ? 'matching your search' : 'in this class'}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll Number
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      {selectedSubject && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance ({selectedSubject})
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => {
                      const attendancePercentage = getAttendancePercentage(student.student._id);
                      const attendanceStatus = getAttendanceStatus(attendancePercentage);
                      console.log("Student Attendance Percentage:",student, attendancePercentage, attendanceStatus);
                      return (
                        <tr key={student._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                {student?.student?.displayName ? student.student.displayName.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {student?.student?.displayName || 'Unnamed Student'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student?.student?.rollNo || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student?.student?.email || '-'}</div>
                            <div className="text-sm text-gray-500">{student?.student?.phone || '-'}</div>
                          </td>
                          {selectedSubject && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              {loadingAttendance ? (
                                <div className="flex items-center">
                                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-indigo-500 rounded-full"></div>
                                  Loading...
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                                    <div 
                                      className={`h-2.5 rounded-full ${
                                        attendanceStatus === 'good' 
                                          ? 'bg-green-600' 
                                          : attendanceStatus === 'warning' 
                                            ? 'bg-yellow-400' 
                                            : 'bg-red-600'
                                      }`} 
                                      style={{ width: `${attendancePercentage}%` }}
                                    ></div>
                                  </div>
                                  <span className={`text-sm ${
                                    attendanceStatus === 'good' 
                                      ? 'text-green-700' 
                                      : attendanceStatus === 'warning' 
                                        ? 'text-yellow-700' 
                                        : 'text-red-700'
                                  }`}>
                                    {attendancePercentage}%
                                  </span>
                                </div>
                              )}
                              {!loadingAttendance && attendanceData.studentStats.find(stat => stat._id === student._id) && (
                                <div className="mt-1 text-xs text-gray-500">
                                  <span className="text-green-600">P: {attendanceData.studentStats.find(stat => stat._id === student._id).present || 0}</span> | 
                                  <span className="text-yellow-600"> L: {attendanceData.studentStats.find(stat => stat._id === student._id).late || 0}</span> | 
                                  <span className="text-red-600"> A: {attendanceData.studentStats.find(stat => stat._id === student._id).absent || 0}</span>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default withRoleProtection(ClassStudentsPage, ['hod', 'faculty']);
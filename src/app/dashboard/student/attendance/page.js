'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function StudentAttendancePage() {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');


  // Fetch attendance data when component mounts
  useEffect(() => {
    if (!user) return;

    const fetchAttendanceSummary = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/student/attendance?action=get-student-attendance-summary&uid=${user?.uid}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch attendance summary');
        }

        const data = await response.json();
        setSummaryData(data.summary || []);
      } catch (error ) {
        console.error('Error fetching attendance summary:', error);
        setError('Failed to load attendance summary. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchAttendanceRecords = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/student/attendance?action=get-student-attendance&uid=${user?.uid}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch attendance records');
        }

        const data = await response.json();
        setAttendanceRecords(data.attendanceRecords || []);
        console.log("Attendance Records:", data.attendanceRecords);

      } catch (error ) {
        console.error('Error fetching attendance records:', error);
        setError('Failed to load attendance records. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceSummary();
    fetchAttendanceRecords();
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

  // Get attendance percentage color
  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Attendance</h1>
          <p className="text-gray-600 mt-1">
            View and track your attendance records
          </p>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {summaryData.map((item, index) => (
              <div
                key={index}
                onClick={() => setSelectedSubject(item.subject)}
                className="bg-white shadow-md rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    {item.subject}
                  </h3>
                  <p className="text-sm text-gray-600 font-medium">
                    {item.class.name} ({item.class.department})
                  </p>
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 font-medium mb-2">Attendance</p>
                  <p className={`text-3xl font-bold ${getPercentageColor(item.percentage)}`}>
                    {item.percentage}%
                  </p>
                </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 font-medium mb-2">Present</p>
                    <p className="text-xl font-bold text-green-600">{item.present}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500 font-medium mb-2">Absent</p>
                    <p className="text-xl font-bold text-red-600">{item.absent}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500 font-medium mb-2">Total</p>
                    <p className="text-xl font-bold text-blue-600">{item.totalDays}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Attendance Records */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className='flex justify-between'>

            <h2 className="text-lg font-semibold mb-4">Detailed Attendance Records</h2>

            {/* Subject Filter Dropdown */}
            <div className="mb-4 flex justify-end gap-4 items-center">
              <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Subject:
              </label>
              <select
                id="subject-filter"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="py-2 px-4 border block w-full md:w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="All">All Subjects</option>
                {[...new Set(attendanceRecords.map((record) => record.subject))].map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            </div>
            {attendanceRecords.length === 0 ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-yellow-700">
                  No attendance records found. You may not have any recorded attendance yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Class
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Subject
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceRecords
                      .filter((record) => selectedSubject === 'All' || record.subject === selectedSubject)
                      .map((record,index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {record.class?.department || ''} ({record.class?.semester || ''})
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${record.status === 'present'
                                  ? 'bg-green-100 text-green-800 border-green-300'
                                  : record.status === 'absent'
                                    ? 'bg-red-100 text-red-800 border-red-300'
                                    : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                }`}
                            >
                              {record.status.charAt(0).toUpperCase() +
                                record.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
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

// Wrap the component with role protection, allowing admin, faculty, and student access
export default withRoleProtection(StudentAttendancePage, ['hod', 'faculty', 'student']);
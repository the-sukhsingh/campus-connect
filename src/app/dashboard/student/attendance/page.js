'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function StudentAttendancePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
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
      } catch (error) {
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
      } catch (error) {
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
    if (percentage >= 90) return theme === 'dark' ? 'text-green-400' : 'text-green-600';
    if (percentage >= 75) return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
    return theme === 'dark' ? 'text-red-400' : 'text-red-600';
  };

  // Convert data to CSV format
  const convertToCSV = (data, headers) => {
    const csvRows = [];
    const headerRow = headers.map((header) => header.label).join(',');
    csvRows.push(headerRow);

    data.forEach((row) => {
      const values = headers.map((header) => row[header.key]);
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  };

  // Download CSV file
  const downloadCSV = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    link.click();
  };

  return (
    <div className={`p-4 md:p-6 min-h-svh transition-colors duration-200 ${theme === 'dark' ? 'bg-[var(--background)] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>My Attendance</h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            View and track your attendance records
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              const headers = [
                { label: 'Date', key: 'date' },
                { label: 'Class', key: 'class' },
                { label: 'Subject', key: 'subject' },
                { label: 'Status', key: 'status' },
              ];

              const records = attendanceRecords.map((record) => ({
                date: formatDate(record.date),
                class: `${record.class?.department || ''} (${record.class?.currentSemester || 1} of ${record.class?.totalSemesters || 8})`,
                subject: record.subject,
                status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
              }));

              const csvContent = convertToCSV(records, headers);
              downloadCSV(csvContent, 'my_attendance_records');
            }}
            className={`inline-flex items-center gap-1 py-2 px-3 rounded border transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700 text-green-400 border-gray-700' 
                : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'
            }`}
            title="Download as CSV"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            CSV
          </button>
          <button
            onClick={() => {
              const filteredRecords = attendanceRecords.filter(
                (record) =>
                  selectedSubject === 'All' || record.subject === selectedSubject
              );

              const totalRecords = filteredRecords.length;
              const presentCount = filteredRecords.filter(
                (record) => record.status === 'present'
              ).length;
              const absentCount = filteredRecords.filter(
                (record) => record.status === 'absent'
              ).length;
              const lateCount = filteredRecords.filter(
                (record) => record.status === 'late'
              ).length;
              const attendancePercentage =
                totalRecords > 0
                  ? Math.round(
                      ((presentCount + lateCount) / totalRecords) * 100
                    )
                  : 0;

              const printWindow = window.open('', '', 'height=600,width=800');

              printWindow.document.write(`
                <html>
                  <head>
                    <title>Attendance Report</title>
                    <style>
                      body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        line-height: 1.6;
                      }
                      h1 {
                        text-align: center;
                        color: #4338ca;
                        margin-bottom: 5px;
                      }
                      .subtitle {
                        text-align: center;
                        color: #6b7280;
                        margin-bottom: 20px;
                        font-size: 14px;
                      }
                      .summary {
                        display: flex;
                        justify-content: space-around;
                        margin: 20px 0;
                        padding: 15px;
                        background-color: #f3f4f6;
                        border-radius: 8px;
                      }
                      .summary-item {
                        text-align: center;
                      }
                      .summary-label {
                        font-size: 12px;
                        color: #6b7280;
                      }
                      .summary-value {
                        font-size: 20px;
                        font-weight: bold;
                      }
                      .present { color: #059669; }
                      .absent { color: #dc2626; }
                      .late { color: #d97706; }
                      .percentage { color: #3b82f6; }
                      table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                      }
                      th, td {
                        padding: 10px;
                        border: 1px solid #e5e7eb;
                        text-align: left;
                      }
                      th {
                        background-color: #f3f4f6;
                        font-weight: bold;
                      }
                      tr:nth-child(even) {
                        background-color: #f9fafb;
                      }
                      .status {
                        padding: 3px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                      }
                      .status-present {
                        background-color: #d1fae5;
                        color: #059669;
                      }
                      .status-absent {
                        background-color: #fee2e2;
                        color: #dc2626;
                      }
                      .status-late {
                        background-color: #fef3c7;
                        color: #d97706;
                      }
                      .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 12px;
                        color: #6b7280;
                      }
                    </style>
                  </head>
                  <body>
                    <h1>Attendance Report</h1>
                    <div class="subtitle">
                      ${
                        selectedSubject === 'All'
                          ? 'All Subjects'
                          : selectedSubject
                      }
                    </div>
                    
                    <div class="summary">
                      <div class="summary-item">
                        <div class="summary-label">Present</div>
                        <div class="summary-value present">${presentCount}</div>
                      </div>
                      <div class="summary-item">
                        <div class="summary-label">Absent</div>
                        <div class="summary-value absent">${absentCount}</div>
                      </div>
                      <div class="summary-item">
                        <div class="summary-label">Late</div>
                        <div class="summary-value late">${lateCount}</div>
                      </div>
                      <div class="summary-item">
                        <div class="summary-label">Attendance</div>
                        <div class="summary-value percentage">${attendancePercentage}%</div>
                      </div>
                    </div>
                    
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Class</th>
                          <th>Subject</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${filteredRecords
                          .map(
                            (record) => `
                          <tr>
                            <td>${formatDate(record.date)}</td>
                            <td>${record.class?.department || ''} (${
                              record.class?.currentSemester || 1
                            } of ${record.class?.totalSemesters || 8})</td>
                            <td>${record.subject}</td>
                            <td>
                              <span class="status status-${record.status}">
                                ${
                                  record.status.charAt(0).toUpperCase() +
                                  record.status.slice(1)
                                }
                              </span>
                            </td>
                          </tr>
                        `
                          )
                          .join('')}
                      </tbody>
                    </table>
                    
                    <div class="footer">
                      Report generated on ${new Date().toLocaleDateString()}
                    </div>
                  </body>
                </html>
              `);

              setTimeout(() => {
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
              }, 250);
            }}
            className={`inline-flex items-center gap-1 py-2 px-3 rounded border transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400 border-gray-700' 
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
            }`}
            title="Print PDF"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z"
              />
            </svg>
            Print PDF
          </button>
        </div>
      </div>

      {error && (
        <div
          className={`border-l-4 p-4 mb-6 ${
            theme === 'dark' 
              ? 'bg-red-900/30 border-red-700 text-red-300' 
              : 'bg-red-100 border-red-500 text-red-700'
          }`}
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
            theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'
          }`}></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {summaryData.map((item, index) => (
              <div
                key={index}
                onClick={() => setSelectedSubject(item.subject)}
                className={`rounded-lg p-6 border transition-all duration-300 transform hover:scale-[1.02] cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-gray-800 hover:bg-gray-750 border-gray-700 shadow-lg shadow-black/20' 
                    : 'bg-white hover:shadow-lg border-gray-200 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="mb-4">
                    <h3 className={`text-xl font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      {item.subject}
                    </h3>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.class.name} ({item.class.department})
                    </p>
                  </div>

                  <div className="text-center mb-6">
                    <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Attendance
                    </p>
                    <p className={`text-3xl font-bold ${getPercentageColor(item.percentage)}`}>
                      {item.percentage}%
                    </p>
                  </div>
                </div>

                <div className={`grid grid-cols-3 gap-4 p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-[var(--background)]' : 'bg-gray-50'
                }`}>
                  <div className="text-center">
                    <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Present
                    </p>
                    <p className={`text-xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                      {item.present}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Absent
                    </p>
                    <p className={`text-xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                      {item.absent}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Total
                    </p>
                    <p className={`text-xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                      {item.totalDays}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Attendance Records */}
          <div className={`rounded-lg p-6 ${
            theme === 'dark' 
              ? 'bg-gray-800 shadow-xl shadow-black/20 border border-gray-700' 
              : 'bg-white shadow-md border border-gray-200'
          }`}>
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4 md:mb-0`}>
                Detailed Attendance Records
              </h2>

              {/* Subject Filter Dropdown */}
              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <label
                  htmlFor="subject-filter"
                  className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Filter by Subject:
                </label>
                <select
                  id="subject-filter"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className={`py-2 px-4 border rounded-md w-full md:w-64 text-sm focus:ring-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500/30'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/30'
                  }`}
                >
                  <option value="All">All Subjects</option>
                  {[
                    ...new Set(
                      attendanceRecords.map((record) => record.subject)
                    ),
                  ].map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {attendanceRecords.length === 0 ? (
              <div className={`border-l-4 p-4 ${
                theme === 'dark' 
                  ? 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300' 
                  : 'bg-yellow-50 border-yellow-400 text-yellow-700'
              }`}>
                <p className="text-sm">
                  No attendance records found. You may not have any recorded
                  attendance yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={theme === 'dark' ? 'bg-[var(--background)]' : 'bg-gray-50'}>
                    <tr>
                      <th
                        scope="col"
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        Class
                      </th>
                      <th
                        scope="col"
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        Subject
                      </th>
                      <th
                        scope="col"
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
                  }`}>
                    {attendanceRecords
                      .filter(
                        (record) =>
                          selectedSubject === 'All' ||
                          record.subject === selectedSubject
                      )
                      .map((record, index) => (
                        <tr key={index} className={theme === 'dark' ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                            }`}>
                              {record.class?.department || ''} (
                              {record.class?.currentSemester || 1} of{' '}
                              {record.class?.totalSemesters || 8})
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                            {record.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                record.status === 'present'
                                  ? theme === 'dark' 
                                    ? 'bg-green-900/50 text-green-300 border border-green-700/50' 
                                    : 'bg-green-100 text-green-800 border border-green-300'
                                  : record.status === 'absent'
                                  ? theme === 'dark'
                                    ? 'bg-red-900/50 text-red-300 border border-red-700/50'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                  : theme === 'dark'
                                    ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50'
                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
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
export default withRoleProtection(StudentAttendancePage, [
  'hod',
  'faculty',
  'student',
]);
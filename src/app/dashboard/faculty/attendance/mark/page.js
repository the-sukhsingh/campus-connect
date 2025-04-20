'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function MarkAttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');
  
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  );
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [previousAttendance, setPreviousAttendance] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [showPreviousAttendance, setShowPreviousAttendance] = useState(false);
  const [recordExists, setRecordExists] = useState(false); // Track if attendance record exists

  // Fetch class details and students
  useEffect(() => {
    if (!user || !classId) return;

    const fetchClassData = async () => {
      try {
        setLoading(true);
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
        
        if (!subjectsResponse.ok) {
          throw new Error('Failed to fetch subjects');
        }
        
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData.subjects || []);
        
        if (subjectsData.subjects && subjectsData.subjects.length > 0) {
          setSelectedSubject(subjectsData.subjects[0]);
        }
      } catch (error) {
        console.error('Error fetching class data:', error);
        setMessage({ 
          type: 'error', 
          text: 'Failed to load class data. Please try again later.' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [user, classId]);

  // Fetch existing attendance data without initializing
  const fetchExistingAttendance = async () => {
    try {
      const response = await fetch(
        `/api/attendance?action=get-attendance&uid=${user?.uid}&classId=${classId}&date=${attendanceDate}&subject=${encodeURIComponent(selectedSubject)}&initialize=false`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      
      if (data.attendance) {
        setAttendanceRecords(data.attendance.attendanceRecords || []);
        setIsLocked(data.locked === true);
        setRecordExists(data.exists === true);
        
        setMessage({ 
          type: 'success', 
          text: data.locked
            ? `Loaded existing attendance record for ${selectedSubject} on this date. This record is locked and cannot be modified.`
            : `Loaded existing attendance record for ${selectedSubject} on this date.` 
        });
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  // Initialize default attendance status for each student
  const getDefaultAttendanceRecords = () => {
    return students.map(student => ({
      student: student._id,
      status: 'absent'
    }));
  };

  // Fetch previous attendance records
  const fetchPreviousAttendance = async () => {
    if (!user || !classId || !selectedSubject) return;
    
    try {
      setLoadingPrevious(true);
      const response = await fetch(
        `/api/attendance?action=get-previous-attendance&uid=${user?.uid}&classId=${classId}&subject=${encodeURIComponent(selectedSubject)}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch previous attendance records');
      }
      
      const data = await response.json();
      setPreviousAttendance(data.previousAttendance || []);
    } catch (error) {
      console.error('Error fetching previous attendance records:', error);
    } finally {
      setLoadingPrevious(false);
    }
  };

  // Check if attendance record exists and its lock status without initializing
  useEffect(() => {
    if (!user || !classId || !attendanceDate || !selectedSubject) return;
    
    const checkAttendanceStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/attendance?action=check-attendance-exists&uid=${user?.uid}&classId=${classId}&date=${attendanceDate}&subject=${encodeURIComponent(selectedSubject)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setIsLocked(data.locked === true);
          setRecordExists(data.exists === true);
          
          if (data.exists) {
            // Only if record exists, fetch the full attendance data
            await fetchExistingAttendance();
          } else {
            // If no record exists, clear attendance records
            setAttendanceRecords([]);
            setMessage({
              type: 'info',
              text: `No attendance record exists for ${selectedSubject} on this date. Mark attendance and submit to create a new record.`
            });
          }
        }
      } catch (error) {
        console.error('Error checking attendance status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAttendanceStatus();
    
    // Also fetch previous attendance records when subject changes
    fetchPreviousAttendance();
  }, [user, classId, attendanceDate, selectedSubject]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !classId || !attendanceDate || !selectedSubject) {
      setMessage({ 
        type: 'error', 
        text: 'Missing required information. Please select a subject and date.' 
      });
      return;
    }
    
    // Check lock status again before submitting
    try {
      const lockCheckResponse = await fetch(
        `/api/attendance?action=check-locked&uid=${user?.uid}&classId=${classId}&date=${attendanceDate}&subject=${encodeURIComponent(selectedSubject)}`
      );
      
      if (lockCheckResponse.ok) {
        const lockData = await lockCheckResponse.json();
        if (lockData.locked === true) {
          setIsLocked(true);
          setMessage({ 
            type: 'error', 
            text: 'This attendance record is locked and cannot be modified.' 
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error checking lock status:', error);
    }
    
    if (isLocked || recordExists) {
      setMessage({ 
        type: 'error', 
        text: 'This attendance record already exists and cannot be modified.' 
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // If no record exists yet, use the default attendance records with all students marked absent
      const recordsToSubmit = attendanceRecords.length > 0 ? 
        attendanceRecords : 
        getDefaultAttendanceRecords();
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          classId,
          subject: selectedSubject,
          date: attendanceDate,
          attendanceRecords: recordsToSubmit,
          initialize: true // Explicitly request initialization if needed
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save attendance');
      }
      
      const data = await response.json();
      
      // Make sure to update the state
      setIsLocked(true);
      setRecordExists(true);
      
      setMessage({ 
        type: 'success', 
        text: `Attendance for ${selectedSubject} has been saved successfully and is now locked!` 
      });
      
      // Refresh previous attendance records
      fetchPreviousAttendance();
    } catch (error) {
      console.error('Error saving attendance:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to save attendance. Please try again later.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update student status
  const updateStudentStatus = (studentId, status) => {
    if (isLocked || recordExists) {
      setMessage({
        type: 'error',
        text: 'This attendance record already exists and cannot be modified.'
      });
      return;
    }
    
    setAttendanceRecords(prevRecords => {
      // Find if the student already has a record
      const studentRecordIndex = prevRecords.findIndex(
        record => record?.student?._id === studentId || record.student === studentId
      );
      
      // Create a copy of the current records
      const updatedRecords = [...prevRecords];
      
      if (studentRecordIndex !== -1) {
        // Update existing record
        updatedRecords[studentRecordIndex] = {
          ...updatedRecords[studentRecordIndex],
          status
        };
      } else {
        // Add new record
        updatedRecords.push({
          student: studentId,
          status
        });
      }
      
      return updatedRecords;
    });
  };

  // Get student status
  const getStudentStatus = (studentId) => {
    const record = attendanceRecords.find(
      record => record?.student?._id === studentId || record.student === studentId
    );
    return record ? record.status : 'absent';
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get count of attendance statuses
  const getAttendanceStatusCount = (records, status) => {
    return records.filter(record => record.status === status).length;
  };

  if (!classId) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>No class selected. Please go back and select a class.</p>
          <Link 
            href="/dashboard/faculty/attendance" 
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
          <h1 className="text-2xl font-bold">Mark Attendance</h1>
          {classInfo && (
            <p className="text-gray-600 mt-1">
              {classInfo.name} - {classInfo.department} ({classInfo.semester})
            </p>
          )}
        </div>
        <Link
          href="/dashboard/faculty/attendance"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
        >
          Back to Classes
        </Link>
      </div>

      {message.text && (
        <div 
          className={`p-4 mb-6 border-l-4 ${
            message.type === 'error' 
              ? 'bg-red-100 border-red-500 text-red-700' 
              : message.type === 'success'
                ? 'bg-green-100 border-green-500 text-green-700'
                : 'bg-blue-100 border-blue-500 text-blue-700'
          }`} 
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label 
                htmlFor="subject-select" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Subject
              </label>
              <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                {subjects.length === 0 ? (
                  <option value="" disabled>No subjects available</option>
                ) : (
                  subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label 
                htmlFor="attendance-date" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Date
              </label>
              <input
                id="attendance-date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                max={new Date().toISOString().split('T')[0]} // Can't select future dates
              />
            </div>
          </div>

          {/* Status Indicator - for existing or locked records */}
          {(isLocked || recordExists) && (
            <div className="mb-6 flex items-center p-4 bg-orange-50 border-l-4 border-orange-500 text-orange-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <p className="font-bold">Attendance Record Exists</p>
                <p className="text-sm">This attendance record already exists and cannot be modified. You can select a different date to view or create other attendance records.</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {!selectedSubject ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-sm text-yellow-700">
                    Please select a subject to mark attendance.
                  </p>
                </div>
              ) : students.length === 0 ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-sm text-yellow-700">
                    No students enrolled in this class. Please add students to the class first.
                  </p>
                </div>
              ) : (
                <>
                  {!recordExists && !isLocked && (
                    <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
                      <p className="font-medium">Creating New Attendance Record</p>
                      <p className="text-sm">You are about to create a new attendance record for {selectedSubject} on {formatDate(attendanceDate)}.</p>
                    </div>
                  )}
                
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student) => (
                          <tr key={student._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.student.displayName || 'Unnamed Student'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {student.student.rollNo}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateStudentStatus(student._id, 'present')}
                                  disabled={isLocked || recordExists}
                                  className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium focus:outline-none ${
                                    getStudentStatus(student._id) === 'present'
                                      ? 'bg-green-100 text-green-800 border-green-300'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  } ${(isLocked || recordExists) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateStudentStatus(student._id, 'absent')}
                                  disabled={isLocked || recordExists}
                                  className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium focus:outline-none ${
                                    getStudentStatus(student._id) === 'absent'
                                      ? 'bg-red-100 text-red-800 border-red-300'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  } ${(isLocked || recordExists) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  Absent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateStudentStatus(student._id, 'late')}
                                  disabled={isLocked || recordExists}
                                  className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium focus:outline-none ${
                                    getStudentStatus(student._id) === 'late'
                                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  } ${(isLocked || recordExists) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  Late
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="mt-6 flex justify-between">
                <div className="text-sm text-gray-500">
                  {(isLocked || recordExists) ? "You can change the date above to create/view other attendance records." : ""}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || students.length === 0 || !selectedSubject || isLocked || recordExists}
                  className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    (isSubmitting || students.length === 0 || !selectedSubject || isLocked || recordExists) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (isLocked || recordExists) ? (
                    'Record Exists'
                  ) : (
                    'Save Attendance'
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Previous Attendance Records Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Previous Attendance Records</h2>
          <button
            onClick={() => setShowPreviousAttendance(!showPreviousAttendance)}
            className="text-indigo-600 hover:text-indigo-900 flex items-center focus:outline-none"
          >
            {showPreviousAttendance ? 'Hide' : 'Show'} Records
            <svg
              className={`ml-1 h-5 w-5 transform ${showPreviousAttendance ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {showPreviousAttendance && (
          <>
            {loadingPrevious ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : previousAttendance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {previousAttendance.map((record) => {
                  const presentCount = getAttendanceStatusCount(record.attendanceRecords, 'present');
                  const absentCount = getAttendanceStatusCount(record.attendanceRecords, 'absent');
                  const lateCount = getAttendanceStatusCount(record.attendanceRecords, 'late');
                  const totalStudents = record.attendanceRecords.length;
                  const attendanceRate = Math.round(((presentCount + lateCount) / totalStudents) * 100);
                  
                  return (
                    <div 
                      key={record._id}
                      className="border rounded-lg overflow-hidden transition-transform hover:shadow-lg"
                    >
                      <div className="bg-gray-50 p-4 border-b">
                        <h3 className="font-semibold">{formatDate(record.date)}</h3>
                        <p className="text-sm text-gray-600">{record.subject}</p>
                      </div>
                      <div className="p-4">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Attendance Rate: {attendanceRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                attendanceRate > 75 
                                  ? 'bg-green-600' 
                                  : attendanceRate > 50 
                                    ? 'bg-yellow-400' 
                                    : 'bg-red-600'
                              }`} 
                              style={{ width: `${attendanceRate}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-lg font-bold text-green-700">{presentCount}</p>
                            <p className="text-xs text-green-600">Present</p>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded">
                            <p className="text-lg font-bold text-yellow-700">{lateCount}</p>
                            <p className="text-xs text-yellow-600">Late</p>
                          </div>
                          <div className="bg-red-50 p-2 rounded">
                            <p className="text-lg font-bold text-red-700">{absentCount}</p>
                            <p className="text-xs text-red-600">Absent</p>
                          </div>
                        </div>
                        
                        {/* Always show lock indicator for previous records */}
                        <div className="mt-4 flex items-center text-xs text-orange-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Locked Record
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No previous attendance records found for this subject.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing admin and faculty access
export default withRoleProtection(MarkAttendancePage, ['hod', 'faculty']);
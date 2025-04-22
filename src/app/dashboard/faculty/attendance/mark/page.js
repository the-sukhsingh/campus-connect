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
        `/api/attendance?action=get-previous-attendance&uid=${user?.uid}&classId=${classId}&subject=${encodeURIComponent(selectedSubject)}`
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

      // console.log("Records to submit: ", recordsToSubmit);
      // return;
      
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
    console.log("Updating status for student: ", studentId, " to ", status);
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
      
      console.log("StudentRecordIndex",studentRecordIndex)


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
      console.log("Updated Records: ", updatedRecords);
      
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
                                  onClick={() => updateStudentStatus(student.student._id, 'present')}
                                  disabled={isLocked || recordExists}
                                  className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium focus:outline-none ${
                                    getStudentStatus(student.student._id) === 'present'
                                      ? 'bg-green-100 text-green-800 border-green-300'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  } ${(isLocked || recordExists) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateStudentStatus(student.student._id, 'absent')}
                                  disabled={isLocked || recordExists}
                                  className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium focus:outline-none ${
                                    getStudentStatus(student.student._id) === 'absent'
                                      ? 'bg-red-100 text-red-800 border-red-300'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  } ${(isLocked || recordExists) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  Absent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateStudentStatus(student.student._id, 'late')}
                                  disabled={isLocked || recordExists}
                                  className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium focus:outline-none ${
                                    getStudentStatus(student.student._id) === 'late'
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

              {/* Attendance Summary Table */}
              {students.length > 0 && selectedSubject && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Attendance Summary</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b text-center bg-gray-50">Total Students</th>
                          <th className="py-2 px-4 border-b text-center bg-green-50 text-green-800">Present</th>
                          <th className="py-2 px-4 border-b text-center bg-red-50 text-red-800">Absent</th>
                          <th className="py-2 px-4 border-b text-center bg-yellow-50 text-yellow-800">Late</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-3 px-4 border-b text-center font-medium">{students.length}</td>
                          <td className="py-3 px-4 border-b text-center font-medium text-green-700">
                            {attendanceRecords.filter(record => record.status === 'present').length}
                            <span className="text-sm text-gray-500 ml-1">
                              ({Math.round((attendanceRecords.filter(record => record.status === 'present').length / students.length) * 100)}%)
                            </span>
                          </td>
                          <td className="py-3 px-4 border-b text-center font-medium text-red-700">
                            {attendanceRecords.filter(record => record.status === 'absent').length}
                            <span className="text-sm text-gray-500 ml-1">
                              ({Math.round((attendanceRecords.filter(record => record.status === 'absent').length / students.length) * 100)}%)
                            </span>
                          </td>
                          <td className="py-3 px-4 border-b text-center font-medium text-yellow-700">
                            {attendanceRecords.filter(record => record.status === 'late').length}
                            <span className="text-sm text-gray-500 ml-1">
                              ({Math.round((attendanceRecords.filter(record => record.status === 'late').length / students.length) * 100)}%)
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
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
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a 1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
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
              <div className="mb-6">
              {/* Status Legend */}
              <div className="text-sm mb-4 flex flex-wrap gap-4">
                <span className="inline-flex items-center">
                  <span className="h-3 w-3 rounded-full bg-green-500 mr-1"></span>
                  Present
                </span>
                <span className="inline-flex items-center">
                  <span className="h-3 w-3 rounded-full bg-red-500 mr-1"></span>
                  Absent
                </span>
                <span className="inline-flex items-center">
                  <span className="h-3 w-3 rounded-full bg-yellow-500 mr-1"></span>
                  Late
                </span>
              </div>
            
              {/* Attendance Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 border-r text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Student Name
                      </th>
                      <th className="px-4 py-3 border-r text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Roll No.
                      </th>
                      {previousAttendance.map((record) => (
                        <th
                          key={record._id}
                          className="px-2 py-3 border-r text-center text-xs font-semibold uppercase tracking-wider text-gray-600"
                        >
                          <div className="whitespace-nowrap">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-xxs mt-1 font-normal">{record.subject}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {students.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border-r font-medium text-gray-900 whitespace-nowrap">
                          {student.student.displayName || 'Unnamed Student'}
                        </td>
                        <td className="px-4 py-3 border-r text-gray-600 whitespace-nowrap">
                          {student.student.rollNo}
                        </td>
                        {previousAttendance.map((record) => {
                          const studentRecord = record.attendanceRecords.find(
                            (rec) => rec.student._id === student.student._id
                          );
            
                          const status = studentRecord ? studentRecord.status : 'absent';
            
                          let statusColor, statusSymbol;
                          switch (status) {
                            case 'present':
                              statusColor = 'bg-green-500';
                              statusSymbol = 'P';
                              break;
                            case 'absent':
                              statusColor = 'bg-red-500';
                              statusSymbol = 'A';
                              break;
                            case 'late':
                              statusColor = 'bg-yellow-500';
                              statusSymbol = 'L';
                              break;
                            default:
                              statusColor = 'bg-gray-300';
                              statusSymbol = '?';
                          }
            
                          return (
                            <td
                              key={record._id + student._id}
                              className="p-3 border-r text-center"
                            >
                              <span
                                className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-white text-xs font-semibold ${statusColor}`}
                              >
                                {statusSymbol}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            
              {/* Footer Info */}
              <div className="mt-4 text-sm text-gray-500">
                Showing attendance records for the last {previousAttendance.length} days for <span className="font-medium">{selectedSubject}</span>.
              </div>
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
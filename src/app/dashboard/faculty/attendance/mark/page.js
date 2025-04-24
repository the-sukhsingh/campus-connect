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
    new Date().toISOString().split('T')[0]
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
  const [recordExists, setRecordExists] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
            ? `Record for ${selectedSubject} exists and is locked.`
            : `Loaded existing attendance for ${selectedSubject}.` 
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
              text: `No attendance exists for ${selectedSubject} on this date.`
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
            text: 'This attendance record is locked.' 
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
        text: 'This attendance record already exists.' 
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
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
          initialize: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save attendance');
      }
      
      const data = await response.json();
      
      setIsLocked(true);
      setRecordExists(true);
      
      setMessage({ 
        type: 'success', 
        text: `Attendance saved successfully!` 
      });
      
      fetchPreviousAttendance();
    } catch (error) {
      console.error('Error saving attendance:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to save attendance.' 
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
        text: 'This attendance record already exists.'
      });
      return;
    }
    
    setAttendanceRecords(prevRecords => {
      const studentRecordIndex = prevRecords.findIndex(
        record => record?.student?._id === studentId || record.student === studentId
      );
      
      const updatedRecords = [...prevRecords];
      
      if (studentRecordIndex !== -1) {
        updatedRecords[studentRecordIndex] = {
          ...updatedRecords[studentRecordIndex],
          status
        };
      } else {
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
  const getAttendanceStatusCount = (status) => {
    return attendanceRecords.filter(record => record.status === status).length;
  };

  // Handle select all students with specific status
  const markAllStudents = (status) => {
    if (isLocked || recordExists) return;
    
    const newRecords = students.map(student => ({
      student: student.student._id,
      status: status
    }));
    
    setAttendanceRecords(newRecords);
  };

  if (!classId) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="bg-red-50 rounded-lg shadow-sm p-6 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-lg font-medium text-center mb-6">No class selected</p>
          <Link 
            href="/dashboard/faculty/attendance" 
            className="transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full shadow hover:shadow-lg flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Return to Classes</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header with class info */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h1 className="text-xl font-bold">Mark Attendance</h1>
          </div>
          {classInfo && (
            <p className="text-gray-600 mt-1 text-sm">
              {classInfo.name} · {classInfo.department} · {classInfo.currentSemester} sem 
            </p>
          )}
        </div>
        <Link
          href="/dashboard/faculty/attendance"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-5 rounded-full text-sm transition-all duration-200 flex items-center space-x-1 touch-manipulation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Back</span>
        </Link>
      </div>

      {/* Notification area */}
      {message.text && (
        <div 
          className={`mb-5 rounded-lg p-4 border-l-4 shadow-sm transition-all duration-300 ${
            message.type === 'error' 
              ? 'bg-red-50 border-red-500 text-red-700' 
              : message.type === 'success'
                ? 'bg-green-50 border-green-500 text-green-700'
                : 'bg-blue-50 border-blue-500 text-blue-700'
          }`} 
          role="alert"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'error' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : message.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Form Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        {/* Filters section - expandable on mobile */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center md:hidden mb-3">
            <h3 className="font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Attendance Options
            </h3>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-full text-sm flex items-center transition-colors hover:bg-indigo-100 touch-manipulation"
            >
              {showFilters ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Hide
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Show
                </>
              )}
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className={`${showFilters ? 'block' : 'hidden'} md:block space-y-4 md:space-y-0`}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label 
                  htmlFor="subject-select" 
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Subject
                </label>
                <select
                  id="subject-select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Date
                </label>
                <input
                  id="attendance-date"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="p-4">
            {!selectedSubject ? (
              <div className="text-center py-12 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Please select a subject to mark attendance.</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p>No students enrolled in this class.</p>
              </div>
            ) : (
              <>
                {/* Lock status warning */}
                {(isLocked || recordExists) && (
                  <div className="mb-4 flex items-center p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium">This attendance record exists and cannot be modified.</p>
                  </div>
                )}
                
                {/* Quick selection buttons */}
                {(!isLocked && !recordExists) && (
                  <div className="mb-4 flex flex-wrap gap-2 justify-end">
                    <span className="text-sm text-gray-500 self-center mr-2">Quick select:</span>
                    <button
                      type="button"
                      onClick={() => markAllStudents('present')}
                      className="bg-green-100 hover:bg-green-200 text-green-800 text-xs rounded-full px-3 py-1 transition-colors duration-200"
                    >
                      All present
                    </button>
                    <button
                      type="button"
                      onClick={() => markAllStudents('absent')}
                      className="bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded-full px-3 py-1 transition-colors duration-200"
                    >
                      All absent
                    </button>
                  </div>
                )}
                
                {/* Students list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => {
                    const status = getStudentStatus(student.student._id);
                    const statusColors = {
                      present: 'bg-green-50 text-green-800 ring-green-600/20',
                      absent: 'bg-red-50 text-red-800 ring-red-600/20',
                      late: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                    };
                    
                    return (
                      <div
                        key={student._id}
                        className={`rounded-lg ring-1 ring-inset ${statusColors[status]} p-4 transition-all duration-200 shadow-sm`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium text-base">{student.student.displayName || 'Unnamed Student'}</h3>
                            <p className="text-xs opacity-80 mt-0.5">{student.student.rollNo}</p>
                          </div>
                          <div className={`rounded-full w-3.5 h-3.5 ${
                            status === 'present' ? 'bg-green-500' : 
                            status === 'absent' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(student.student._id, 'present')}
                            disabled={isLocked || recordExists}
                            className={`flex-1 py-2.5 px-2 text-sm font-medium rounded-md ${
                              status === 'present'
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            } ${(isLocked || recordExists) ? 'opacity-60 cursor-not-allowed' : ''} transition-all duration-200 touch-manipulation`}
                            aria-label="Mark present"
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(student.student._id, 'absent')}
                            disabled={isLocked || recordExists}
                            className={`flex-1 py-2.5 px-2 text-sm font-medium rounded-md ${
                              status === 'absent'
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            } ${(isLocked || recordExists) ? 'opacity-60 cursor-not-allowed' : ''} transition-all duration-200 touch-manipulation`}
                            aria-label="Mark absent"
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(student.student._id, 'late')}
                            disabled={isLocked || recordExists}
                            className={`flex-1 py-2.5 px-2 text-sm font-medium rounded-md ${
                              status === 'late'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            } ${(isLocked || recordExists) ? 'opacity-60 cursor-not-allowed' : ''} transition-all duration-200 touch-manipulation`}
                            aria-label="Mark late"
                          >
                            Late
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Attendance Summary */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Attendance Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white rounded-md shadow-sm p-4 flex items-center border border-gray-100">
                      <div className="rounded-full bg-gray-100 p-2.5 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500">Total Students</div>
                        <div className="text-xl font-semibold">{students.length}</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-md shadow-sm p-4 flex items-center border-l-4 border-green-500 border-t border-r border-b">
                      <div className="rounded-full bg-green-100 p-2.5 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500">Present</div>
                        <div className="flex items-baseline">
                          <span className="text-xl font-semibold">{getAttendanceStatusCount('present')}</span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({Math.round((getAttendanceStatusCount('present') / students.length) * 100) || 0}%)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-md shadow-sm p-4 flex items-center border-l-4 border-red-500 border-t border-r border-b">
                      <div className="rounded-full bg-red-100 p-2.5 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500">Absent</div>
                        <div className="flex items-baseline">
                          <span className="text-xl font-semibold">{getAttendanceStatusCount('absent')}</span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({Math.round((getAttendanceStatusCount('absent') / students.length) * 100) || 0}%)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-md shadow-sm p-4 flex items-center border-l-4 border-yellow-500 border-t border-r border-b">
                      <div className="rounded-full bg-yellow-100 p-2.5 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500">Late</div>
                        <div className="flex items-baseline">
                          <span className="text-xl font-semibold">{getAttendanceStatusCount('late')}</span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({Math.round((getAttendanceStatusCount('late') / students.length) * 100) || 0}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit button area */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting || students.length === 0 || !selectedSubject || isLocked || recordExists}
                    className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      (isSubmitting || students.length === 0 || !selectedSubject || isLocked || recordExists) ? 'opacity-50 cursor-not-allowed' : ''
                    } transition-all duration-200`}
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
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Save Attendance
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Previous Attendance Records Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Previous Records</h2>
          <button
            onClick={() => setShowPreviousAttendance(!showPreviousAttendance)}
            className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center focus:outline-none transition-colors duration-200"
          >
            {showPreviousAttendance ? 'Hide' : 'Show'}
            <svg
              className={`ml-1 h-5 w-5 transform transition-transform duration-200 ${showPreviousAttendance ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
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
          <div className="p-4">
            {loadingPrevious ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : previousAttendance.length > 0 ? (
              <>
                {/* Status Legend */}
                <div className="text-xs mb-4 flex flex-wrap gap-4 pb-3 border-b">
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
              
                {/* Responsive attendance table */}
                <div className="overflow-x-auto -mx-4 sm:-mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          {previousAttendance.map((record) => (
                            <th
                              key={record._id}
                              className="px-1 py-3 border-b border-gray-200 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="whitespace-nowrap">
                                {new Date(record.date).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {students.map((student) => (
                          <tr key={student._id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 border-b border-gray-200 text-gray-900 max-w-[200px] truncate">
                              {student.student.displayName || 'Unnamed'}
                              <span className="text-gray-400 text-xs ml-1">{student.student.rollNo}</span>
                            </td>
                            {previousAttendance.map((record) => {
                              const studentRecord = record.attendanceRecords.find(
                                (rec) => rec.student._id === student.student._id
                              );
                              const status = studentRecord ? studentRecord.status : 'absent';
                              
                              return (
                                <td
                                  key={record._id + student._id}
                                  className="px-1 py-2 border-b border-gray-200 text-center"
                                >
                                  <span
                                    className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-white text-xs ${
                                      status === 'present' ? 'bg-green-500' :
                                      status === 'absent' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}
                                  >
                                    {status === 'present' ? 'P' : status === 'absent' ? 'A' : 'L'}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500 text-center">
                  Showing last {previousAttendance.length} attendance records for {selectedSubject}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No previous attendance records found for this subject.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing admin and faculty access
export default withRoleProtection(MarkAttendancePage, ['hod', 'faculty']);
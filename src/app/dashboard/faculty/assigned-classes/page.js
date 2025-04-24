'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { withRoleProtection } from '@/utils/withRoleProtection';
import { motion } from 'framer-motion';

function AssignedClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceSummaries, setAttendanceSummaries] = useState({});
  const [loadingSummaries, setLoadingSummaries] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const headerVariants = {
    hidden: { y: -50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        damping: 12,
        stiffness: 100 
      }
    }
  };

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
    <div className="p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <motion.div 
        className="mb-10"
        initial="hidden"
        animate="visible"
        variants={headerVariants}
      >
        <div className="relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -top-6 -right-4 w-32 h-32 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-12 left-20 w-24 h-24 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          
          <div className="relative">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                My Teaching Hub
              </span>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.5
                }}
                className="ml-2 inline-block"
              >
                ✨
              </motion.span>
            </h1>
            <p className="text-gray-600 max-w-lg">Manage your classes and track student attendance with our interactive dashboard.</p>
            
            <div className="mt-4 flex items-center space-x-1">
              <motion.div 
                className="h-1 w-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded"
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              ></motion.div>
              <motion.div 
                className="h-1 w-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded"
                initial={{ width: 0 }}
                animate={{ width: 48 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              ></motion.div>
              <motion.div 
                className="h-1 w-6 bg-gradient-to-r from-pink-400 to-pink-600 rounded"
                initial={{ width: 0 }}
                animate={{ width: 24 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              ></motion.div>
            </div>
          </div>
        </div>
      </motion.div>

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
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {classes.map((classItem, index) => {
            const attendanceSummary = attendanceSummaries[classItem._id] || { 
              lastMarked: null, 
              totalDays: 0, 
              subjects: []
            };
            
            // Generate a unique gradient for each card
            const gradients = [
              'from-blue-400 to-indigo-500',
              'from-purple-400 to-pink-500',
              'from-green-400 to-teal-500',
              'from-yellow-400 to-orange-500',
              'from-pink-400 to-rose-500',
              'from-indigo-400 to-purple-500',
            ];
            const gradient = gradients[index % gradients.length];
            
            // Calculate attendance activity level
            const activityLevel = attendanceSummary.totalDays > 10 ? 'high' : 
                                  attendanceSummary.totalDays > 5 ? 'medium' : 'low';
            
            return (
              <motion.div 
                key={classItem._id} 
                className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
              >
                {/* Card header with gradient */}
                <div className={`bg-gradient-to-r ${gradient} p-4 relative h-24`}>
                  <div className="absolute top-0 right-0 h-full w-24 opacity-20">
                    {[...Array(8)].map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute rounded-full bg-white"
                        style={{
                          width: `${Math.random() * 20 + 10}px`,
                          height: `${Math.random() * 20 + 10}px`,
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          opacity: Math.random() * 0.5 + 0.1
                        }}
                      />
                    ))}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 truncate">{classItem.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-white bg-opacity-20 rounded-md text-xs text-blue-700">
                      {classItem.course}
                    </span>
                    <span className="px-2 py-1 bg-white bg-opacity-20 rounded-md text-xs text-blue-700">
                      Sem {classItem.currentSemester || 1}/{classItem.totalSemesters || 8}
                    </span>
                  </div>
                </div>
                
                {/* Card body */}
                <div className="p-5 bg-white">
                  <div className="flex items-center mb-4">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700">{classItem.department}</p>
                      <p className="text-xs text-gray-500">Batch: {classItem.batch}</p>
                    </div>
                  </div>
                  
                  {classItem.teachingSubjects && classItem.teachingSubjects.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Teaching Subjects:</p>
                      <div className="flex flex-wrap gap-1">
                        {classItem.teachingSubjects.map((subject) => (
                          <span 
                            key={subject}
                            className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-100"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Attendance Summary with visual indicators */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-700">Attendance Activity</h4>
                      <span className={`inline-block w-3 h-3 rounded-full ${
                        activityLevel === 'high' ? 'bg-green-500' :
                        activityLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></span>
                    </div>
                    
                    {loadingSummaries ? (
                      <div className="flex justify-center py-2">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-500">Last marked:</span>
                          <span className="text-xs font-medium">{formatDate(attendanceSummary.lastMarked)}</span>
                        </div>
                        
                        <div className="flex items-center mb-3">
                          <span className="text-xs text-gray-500 mr-2">Total days:</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min(100, attendanceSummary.totalDays * 4)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium ml-2">{attendanceSummary.totalDays || 0}</span>
                        </div>
                        
                        {attendanceSummary.subjects && attendanceSummary.subjects.length > 0 && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Recent: {attendanceSummary.subjects.slice(0, 2).join(', ')}
                            {attendanceSummary.subjects.length > 2 ? ' ...' : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-col space-y-2">
                    <Link
                      href={`/dashboard/faculty/assigned-classes/students?classId=${classItem._id}`}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-all group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                      </svg>
                      <span>View Students</span>
                    </Link>
                    
                    <Link
                      href={`/dashboard/faculty/attendance/mark?classId=${classItem._id}`}
                      className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-all group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      <span>Mark Attendance</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing admin and faculty access
export default withRoleProtection(AssignedClassesPage, ['hod', 'faculty']);
'use client';

import { useState, useEffect } from 'react';
import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

function LibrarianDashboardPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalBooks: 0,
    booksOut: 0,
    overdue: 0,
    activeUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [error, setError] = useState('');

  // Fetch real stats from API
  useEffect(() => {
    const getLibraryStats = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        if (!user?.uid) return;
        
        const response = await fetch(`/api/library/stats?uid=${user.uid}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch library statistics');
        }
        
        const data = await response.json();
        
        setStats({
          totalBooks: data.totalBooks || 0,
          booksOut: data.borrowedBooks || 0,
          overdue: data.overdueBooks || 0,
          activeUsers: data.activeUsers || 0
        });
      } catch (err) {
        console.error('Error fetching library statistics:', err);
        setError(err.message || 'Failed to fetch library statistics');
      } finally {
        setIsLoading(false);
      }
    };

    const getTimeBasedGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    };

    getLibraryStats();
    setGreeting(getTimeBasedGreeting());
  }, [user]);

  // Animation variants for staggered animations
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
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const bookSpineColors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
    'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-800'}`}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-blue-400' : 'border-indigo-500'}`}></div>
        </div>
      ) : (
        <>
          {/* Safety Alert Section */}
          <div className={`${theme === 'dark' ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4 mb-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`${theme === 'dark' ? 'bg-red-800' : 'bg-red-100'} p-3 rounded-full`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-red-50' : 'text-red-700'}`}>Safety Alerts</h2>
                  <p className={`${theme === 'dark' ? 'text-red-200' : 'text-red-600'}`}>Create urgent safety notifications for library users</p>
                </div>
              </div>
              <Link
                href="/dashboard/safety-alerts"
                className={`px-4 py-2 ${theme === 'dark' ? 'bg-red-800 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-md transition-colors text-sm font-medium flex items-center`}
              >
                Create Safety Alert
              </Link>
            </div>
          </div>

          {/* Animated Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`relative mb-10 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-8 overflow-hidden`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${theme === 'dark' ? 'bg-indigo-900' : 'bg-indigo-200'} rounded-full -mr-16 -mt-16 opacity-70`}></div>
            <div className={`absolute bottom-0 left-0 w-24 h-24 ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-200'} rounded-full -ml-12 -mb-12 opacity-70`}></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
              <div>
                <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                  <span className={`${theme === 'dark' ? 'text-blue-400' : 'text-indigo-600'}`}>{greeting},</span> {user?.displayName || 'Librarian'}
                </h1>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Welcome to your library management dashboard
                </p>
              </div>
              
              <div className="mt-4 md:mt-0">
                <div className={`px-4 py-2 ${theme === 'dark' ? 'bg-indigo-800' : 'bg-indigo-600'} text-white rounded-lg shadow-md flex items-center`}>
                  <span className="mr-2">🗓️</span> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
          >
            {/* Total Books */}
            <motion.div variants={itemVariants} className={`${theme === 'dark' ? 'bg-gray-800 border-l-4 border-blue-500' : 'bg-white border-l-4 border-blue-500'} rounded-xl shadow-md overflow-hidden`}>
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} uppercase`}>Total Books</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                      {isLoading ? '...' : stats.totalBooks.toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-500'} flex items-center justify-center`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <div className={`w-full h-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className={`h-1 ${theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'} rounded-full`}
                    ></motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Books Out */}
            <motion.div variants={itemVariants} className={`${theme === 'dark' ? 'bg-gray-800 border-l-4 border-green-500' : 'bg-white border-l-4 border-green-500'} rounded-xl shadow-md overflow-hidden`}>
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} uppercase`}>Books Out</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                      {isLoading ? '...' : stats.booksOut.toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${theme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-500'} flex items-center justify-center`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <div className={`w-full h-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: `${(stats.booksOut / (stats.totalBooks || 1)) * 100}%` }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className={`h-1 ${theme === 'dark' ? 'bg-green-400' : 'bg-green-500'} rounded-full`}
                    ></motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Overdue */}
            <motion.div variants={itemVariants} className={`${theme === 'dark' ? 'bg-gray-800 border-l-4 border-red-500' : 'bg-white border-l-4 border-red-500'} rounded-xl shadow-md overflow-hidden`}>
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} uppercase`}>Overdue</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                      {isLoading ? '...' : stats.overdue.toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${theme === 'dark' ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-500'} flex items-center justify-center`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <div className={`w-full h-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: `${(stats.overdue / (stats.booksOut || 1)) * 100}%` }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className={`h-1 ${theme === 'dark' ? 'bg-red-400' : 'bg-red-500'} rounded-full`}
                    ></motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Active Users */}
            <motion.div variants={itemVariants} className={`${theme === 'dark' ? 'bg-gray-800 border-l-4 border-purple-500' : 'bg-white border-l-4 border-purple-500'} rounded-xl shadow-md overflow-hidden`}>
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} uppercase`}>Active Users</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                      {isLoading ? '...' : stats.activeUsers.toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${theme === 'dark' ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-500'} flex items-center justify-center`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <div className={`w-full h-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "70%" }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className={`h-1 ${theme === 'dark' ? 'bg-purple-400' : 'bg-purple-500'} rounded-full`}
                    ></motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Display error message if there was an error fetching stats */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 ${theme === 'dark' ? 'bg-red-900 border-l-4 border-red-700 text-red-300' : 'bg-red-50 border-l-4 border-red-500 text-red-700'} rounded-md`}
            >
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </motion.div>
          )}

          {/* Main Actions */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
          >
            {/* Books Management */}
            <motion.div 
              variants={itemVariants} 
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden group`}
            >
              <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-indigo-800 to-indigo-900' : 'bg-gradient-to-r from-indigo-600 to-indigo-700'} h-3 w-full`}></div>
              <div className="p-6">
                <div className={`flex items-center justify-center w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-indigo-900 text-indigo-300 group-hover:bg-indigo-800 group-hover:text-white' : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'} mb-4 transition-all duration-300`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100 group-hover:text-indigo-400' : 'group-hover:text-indigo-600'} transition-colors`}>Books Management</h2>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Add, edit, remove, and categorize books in your library inventory.</p>
                <Link 
                  href="/dashboard/librarian/books"
                  className={`block text-center py-2 px-4 ${theme === 'dark' ? 'bg-indigo-800 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg transform transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg`}
                >
                  Manage Books
                </Link>
              </div>
            </motion.div>

            {/* Book Lending */}
            <motion.div 
              variants={itemVariants} 
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden group`}
            >
              <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-green-800 to-green-900' : 'bg-gradient-to-r from-green-600 to-green-700'} h-3 w-full`}></div>
              <div className="p-6">
                <div className={`flex items-center justify-center w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-green-900 text-green-300 group-hover:bg-green-800 group-hover:text-white' : 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white'} mb-4 transition-all duration-300`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100 group-hover:text-green-400' : 'group-hover:text-green-600'} transition-colors`}>Book Lending</h2>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Lend books to students and faculty by searching with their name, email, or ID.</p>
                <Link 
                  href="/dashboard/librarian/lend"
                  className={`block text-center py-2 px-4 ${theme === 'dark' ? 'bg-green-800 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transform transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg`}
                >
                  Lend Books
                </Link>
              </div>
            </motion.div>
            
            {/* Book Returns */}
            <motion.div 
              variants={itemVariants} 
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden group`}
            >
              <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-blue-800 to-blue-900' : 'bg-gradient-to-r from-blue-600 to-blue-700'} h-3 w-full`}></div>
              <div className="p-6">
                <div className={`flex items-center justify-center w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-blue-900 text-blue-300 group-hover:bg-blue-800 group-hover:text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'} mb-4 transition-all duration-300`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100 group-hover:text-blue-400' : 'group-hover:text-blue-600'} transition-colors`}>Book Returns</h2>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Process and approve book returns, manage fines for overdue books.</p>
                <Link 
                  href="/dashboard/librarian/returns"
                  className={`block text-center py-2 px-4 ${theme === 'dark' ? 'bg-blue-800 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transform transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg`}
                >
                  Manage Returns
                </Link>
              </div>
            </motion.div>
            
            {/* View All Books */}
            <motion.div 
              variants={itemVariants} 
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden group`}
            >
              <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-purple-800 to-purple-900' : 'bg-gradient-to-r from-purple-600 to-purple-700'} h-3 w-full`}></div>
              <div className="p-6">
                <div className={`flex items-center justify-center w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-purple-900 text-purple-300 group-hover:bg-purple-800 group-hover:text-white' : 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'} mb-4 transition-all duration-300`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100 group-hover:text-purple-400' : 'group-hover:text-purple-600'} transition-colors`}>Book Catalog</h2>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Browse through the complete catalog of books with advanced search and filters.</p>
                <Link 
                  href="/dashboard/student/books/catalog"
                  className={`block text-center py-2 px-4 ${theme === 'dark' ? 'bg-purple-800 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg transform transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg`}
                >
                  View Catalog
                </Link>
              </div>
            </motion.div>
            
            {/* Borrowing History */}
            <motion.div 
              variants={itemVariants} 
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden group`}
            >
              <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-amber-800 to-amber-900' : 'bg-gradient-to-r from-amber-600 to-amber-700'} h-3 w-full`}></div>
              <div className="p-6">
                <div className={`flex items-center justify-center w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-amber-900 text-amber-300 group-hover:bg-amber-800 group-hover:text-white' : 'bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'} mb-4 transition-all duration-300`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100 group-hover:text-amber-400' : 'group-hover:text-amber-600'} transition-colors`}>Borrowing History</h2>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Track all past and current borrowings with detailed analytics and reports.</p>
                <Link 
                  href="/dashboard/librarian/borrowings"
                  className={`block text-center py-2 px-4 ${theme === 'dark' ? 'bg-amber-800 hover:bg-amber-700' : 'bg-amber-600 hover:bg-amber-700'} text-white rounded-lg transform transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg`}
                >
                  View History
                </Link>
              </div>
            </motion.div>

          </motion.div>
        </>
      )}
    </div>
  );
}

export default withRoleProtection(LibrarianDashboardPage, ['hod', 'librarian']);
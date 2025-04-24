'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';


function ClassesManagePage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [department, setDepartment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch college and classes data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // First, fetch college information
        const collegeResponse = await fetch(`/api/user/college?uid=${user?.uid}`);
        
        if (!collegeResponse.ok) {
          throw new Error('Failed to fetch college information');
        }
        
        const collegeData = await collegeResponse.json();
        
        if (!collegeData.college) {
          setCollegeInfo(null);
          setLoading(false);
          return;
        }
        
        setCollegeInfo(collegeData.college);
        
        // Then, fetch classes for this college using the correct endpoint
        const classesResponse = await fetch(
          `/api/user/college/classes?uid=${user?.uid}&collegeId=${collegeData.college._id}`
        );
        
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes');
        }
        
        const classesData = await classesResponse.json();
        setClasses(classesData.classes || []);
        
      } catch (error ) {
        console.error('Error fetching data:', error);
        setMessage({
          type: 'error',
          text: 'Failed to load data. Please try again later.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // Filter classes based on department and search query
  const filteredClasses = classes.filter(classItem => {
    // Filter by department
    if (department !== 'all' && classItem.department !== department) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        classItem.name.toLowerCase().includes(query) ||
        classItem.currentSemester.toString().includes(query) ||
        classItem.department.toLowerCase().includes(query) ||
        classItem.teacher.displayName.toLowerCase().includes(query) ||
        classItem.teacher.email.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Get list of unique departments from classes
  const departments = Array.from(
    new Set(classes.map(classItem => classItem.department))
  ).sort();

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Classes Management</h1>
          <p className="text-gray-600 mt-1">
            View and manage all classes in your college
          </p>
        </div>
        
      </div>

      {message.text && (
        <div 
          className={`p-4 mb-6 border-l-4 ${
            message.type === 'error' 
              ? 'bg-red-100 border-red-500 text-red-700' 
              : 'bg-green-100 border-green-500 text-green-700'
          }`} 
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : !collegeInfo ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No college found. Please create your college first.
              </p>
              <div className="mt-4">
                <Link 
                  href="/dashboard/hod/college/setup" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:shadow-outline-indigo"
                >
                  Setup College
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search and filter section */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search-classes" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Classes
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="search-classes"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Search by class name, course, batch..."
                  />
                </div>
              </div>
              <div className="md:w-64">
                <label htmlFor="department-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Department
                </label>
                <select
                  id="department-filter"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Classes List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {filteredClasses.length === 0 ? (
              <div className="p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-gray-500">
                  No classes found. Classes created by teachers will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                      
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClasses.map((classItem) => (
                      <tr key={classItem._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {classItem.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {` ${classItem.currentSemester || 1} of ${classItem.totalSemesters || 8}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {classItem.department}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {classItem.teacher?.displayName || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {classItem.teacher?.email}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-900">
                            {
                              classItem.students.length > 0
                                ? classItem.students.length
                                : 'No Students'

                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(classItem.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Link
                            href={`/dashboard/hod/classes/viewClass?id=${classItem._id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </Link>
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

// Wrap the component with role protection, allowing only HOD access
export default withRoleProtection(ClassesManagePage, ['hod']);
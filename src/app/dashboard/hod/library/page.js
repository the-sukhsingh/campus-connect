'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function LibraryManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [librarians, setLibrarians] = useState([]);
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch college and librarians data
  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch college information for this HOD
      const collegeResponse = await fetch(`/api/user/college?uid=${user?.uid}`);

      if (!collegeResponse.ok) {
        throw new Error('Failed to fetch college information');
      }

      const collegeData = await collegeResponse.json();

      if (!collegeData.college) {
        setCollegeInfo(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setCollegeInfo(collegeData.college);

      // Fetch all faculty and staff in this college
      const teachersResponse = await fetch(`/api/user/college/teachers?uid=${user?.uid}&collegeId=${collegeData.college._id}&action=all`);

      if (!teachersResponse.ok) {
        throw new Error('Failed to fetch teachers');
      }

      const teachersData = await teachersResponse.json();
      const allTeachers = teachersData.teachers || [];
      // Filter out approved librarians only
      const approvedTeachers = allTeachers.filter(t => t.collegeStatus === 'approved');
      setLibrarians(approvedTeachers.filter((t) => t.role === 'librarian'));

      // Fetch library stats
      try {
        const statsResponse = await fetch(`/api/library/stats?uid=${user?.uid}`);
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Failed to fetch library stats:', error);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load library management data. Please try again.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle role update
  const handleRoleUpdate = async (userId, newRole) => {
    if (!user || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setMessage({ type: '', text: '' });

      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          targetUserId: userId,
          role: newRole
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      // Refresh data
      setMessage({
        type: 'success',
        text: `User has been updated to ${newRole} successfully.`
      });
      
      setRefreshing(true);
      fetchData();

    } catch (error ) {
      console.error('Error updating user role:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update user role. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter librarians based on search term
  const filteredLibrarians = librarians.filter(l => 
    l.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Library Management</h1>
          <p className="text-gray-600 mt-1">
            Manage library staff and view library statistics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard/hod"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Library Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500 mb-2">Total Books</div>
          <div className="text-2xl font-bold">
            {loading ? "..." : stats?.totalBooks || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500 mb-2">Available Books</div>
          <div className="text-2xl font-bold text-green-600">
            {loading ? "..." : stats?.availableBooks || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500 mb-2">Borrowed Books</div>
          <div className="text-2xl font-bold text-blue-600">
            {loading ? "..." : stats?.borrowedBooks || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500 mb-2">Overdue Books</div>
          <div className="text-2xl font-bold text-red-600">
            {loading ? "..." : stats?.overdueBooks || 0}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="mb-6 flex space-x-4">
        <Link 
          href="/dashboard/hod/library/books"
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors"
        >
          View All Books
        </Link>
       
      </div>

      {/* Status message */}
      {message.text && (
        <div
          className={`p-4 mb-6 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
          role="alert"
        >
          <p>{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Librarians ({librarians.length})</h2>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
              </svg>
            </div>
            <input
              type="text"
              className="pl-10 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by name, email, or department"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredLibrarians.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                {searchTerm ? "No librarians found matching your search." : "No librarians assigned yet."}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLibrarians.map((lib) => (
                    <tr key={lib._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lib.displayName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lib.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lib.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRoleUpdate(lib._id, 'faculty')}
                          disabled={isSubmitting}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove Librarian Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default withRoleProtection(LibraryManagementPage, ['hod']);
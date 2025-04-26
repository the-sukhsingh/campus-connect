'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function LibraryManagementPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
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
      console.log("Teacher's data:", teachersData);
      const allTeachers = teachersData.teachers || [];
      // Filter out approved librarians only
      const approvedTeachers = allTeachers.filter(t => t.collegeStatus === 'linked');
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
    if (!user) return
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
    <div className={`p-6 bg-[var(--background)] text-[var(--foreground)]`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold text-[var(--foreground)]`}>Library Management</h1>
          <p className={`text-[var(--muted-foreground)] mt-1`}>
            Manage library staff and view library statistics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          
        </div>
      </div>

      {/* Library Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} mb-2`}>Total Books</div>
          <div className={`text-2xl font-bold text-[var(--foreground)]`}>
            {loading ? "..." : stats?.totalBooks || 0}
          </div>
        </div>
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} mb-2`}>Available Books</div>
          <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
            {loading ? "..." : stats?.availableBooks || 0}
          </div>
        </div>
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} mb-2`}>Borrowed Books</div>
          <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
            {loading ? "..." : stats?.borrowedBooks || 0}
          </div>
        </div>
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} mb-2`}>Overdue Books</div>
          <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
            {loading ? "..." : stats?.overdueBooks || 0}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="mb-6 flex space-x-4">
        <Link 
          href="/dashboard/hod/library/books"
          className={`${theme === 'dark' ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-2 px-4 rounded transition-colors`}
        >
          View All Books
        </Link>
       
      </div>

      {/* Status message */}
      {message.text && (
        <div
          className={`p-4 mb-6 rounded-md ${
            message.type === 'success' 
              ? (theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-50 text-green-800') 
              : (theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-50 text-red-800')
          }`}
          role="alert"
        >
          <p>{message.text}</p>
        </div>
      )}

      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden mb-6`}>
        {/* Header */}
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Librarians ({librarians.length})</h2>
        </div>

        {/* Search Bar */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
              </svg>
            </div>
            <input
              type="text"
              className={`pl-10 p-2 w-full border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="Search by name, email, or department"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredLibrarians.length === 0 ? (
              <div className={`py-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchTerm ? "No librarians found matching your search." : "No librarians assigned yet."}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Name
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Email
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Department
                    </th>
                    <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                  {filteredLibrarians.map((lib) => (
                    <tr key={lib._id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--foreground)]">
                        {lib.displayName || 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {lib.email}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {lib.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRoleUpdate(lib._id, 'faculty')}
                          disabled={isSubmitting}
                          className={`${theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}`}
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
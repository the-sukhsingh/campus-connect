'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

function FacultyManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');
  const { theme } = useTheme();

  const [classData, setClassData] = useState(null);
  const [isClassOwner, setIsClassOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [subjectToAssign, setSubjectToAssign] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch class data and faculty assignments when component mounts
  useEffect(() => {
    if (!user || !classId) return;

    const fetchClassData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/faculty/assignments?uid=${user?.uid}&classId=${classId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch class data');
        }

        const data = await response.json();
        setClassData(data.class);
        setIsClassOwner(data.isClassOwner);

        // Fetch faculty members in the same college
        if (data.isClassOwner && data.class.college) {
          const facultyResponse = await fetch(`/api/user/college/teachers?collegeId=${data.class.college._id}&action=all&uid=${user?.uid}`);
          
          if (!facultyResponse.ok) {
            throw new Error('Failed to fetch faculty members');
          }
          
          const facultyData = await facultyResponse.json();
          setFacultyMembers(facultyData.teachers || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({
          type: 'error',
          text: error.message || 'Failed to load data. Please try again later.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [user, classId]);

  // Handle assignment of faculty to subject
  const handleAssignFaculty = async (e) => {
    e.preventDefault();

    if (!user || !classId || !subjectToAssign || !selectedFacultyId) {
      setMessage({
        type: 'error',
        text: 'Please fill in all fields'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/faculty/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          classId,
          facultyId: selectedFacultyId,
          subject: subjectToAssign,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign faculty');
      }

      // Refresh class data after successful assignment
      const refreshResponse = await fetch(`/api/faculty/assignments?uid=${user?.uid}&classId=${classId}`);
      
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh class data');
      }
      
      const refreshData = await refreshResponse.json();
      setClassData(refreshData.class);

      setMessage({
        type: 'success',
        text: 'Faculty assigned successfully'
      });

      // Reset form
      setSubjectToAssign('');
      setSelectedFacultyId('');

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to assign faculty. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle removal of faculty assignment
  const handleRemoveAssignment = async (assignmentId) => {
    if (!user || !classId || !assignmentId) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/faculty/assignments?uid=${user?.uid}&classId=${classId}&assignmentId=${assignmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove assignment');
      }

      // Refresh class data after successful removal
      const refreshResponse = await fetch(`/api/faculty/assignments?uid=${user?.uid}&classId=${classId}`);
      
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh class data');
      }
      
      const refreshData = await refreshResponse.json();
      setClassData(refreshData.class);

      setMessage({
        type: 'success',
        text: 'Faculty assignment removed successfully'
      });

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to remove assignment. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!classId) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>No class selected. Please go back and select a class.</p>
          <Link
            href="/dashboard/faculty/classes"
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
          <h1 className="text-2xl font-bold">Faculty Management</h1>
          {classData && (
            <p className="text-gray-600 mt-1">
              {classData.name} - {classData.department} ({classData.currentSemester}) sem
            </p>
          )}
        </div>
        <Link
          href="/dashboard/faculty/classes"
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
      ) : !classData ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>Failed to load class data. Please try again later.</p>
        </div>
      ) : !isClassOwner ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p>You do not have permission to manage faculty assignments for this class.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Faculty Assignments */}
          <div className={`rounded-lg shadow-md overflow-hidden ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="px-6 py-4 border-b border-gray-600">
              <h2 className="text-lg font-semibold">Current Faculty Assignments</h2>
            </div>

            {classData.facultyAssignments && classData.facultyAssignments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-600">
                  <thead className={`${theme === 'dark' ? 'text-gray-400 bg-gray-800' : 'text-gray-500 bg-gray-50'}`}>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Faculty
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned By
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned On
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} divide-y divide-gray-600`}>
                    {classData.facultyAssignments.map((assignment) => (
                      <tr key={assignment._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                            {assignment.subject}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                            {assignment.faculty.displayName || 'Unnamed Faculty'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {assignment.faculty.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {assignment.assignedBy?.displayName || assignment.assignedBy?.email || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(assignment.assignedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleRemoveAssignment(assignment._id)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No faculty assignments yet.</p>
              </div>
            )}
          </div>

          {/* Assign New Faculty Form */}
          <div className={`rounded-lg shadow-md overflow-hidden ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6`}>
            <h2 className="text-lg font-semibold mb-4">Assign Faculty to Subject</h2>
            <form onSubmit={handleAssignFaculty} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={subjectToAssign}
                    onChange={(e) => setSubjectToAssign(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Mathematics, Physics, etc."
                    required
                  />
                </div>
                <div>
                  <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Faculty *
                  </label>
                  <select
                    id="faculty"
                    value={selectedFacultyId}
                    onChange={(e) => setSelectedFacultyId(e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                    required
                  >
                    <option value="">-- Select Faculty Member --</option>
                    {facultyMembers.map((faculty) => (
                      <option key={faculty._id} value={faculty._id}>
                        {faculty.displayName || faculty.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !subjectToAssign || !selectedFacultyId}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isSubmitting || !subjectToAssign || !selectedFacultyId
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Assigning...
                    </>
                  ) : (
                    'Assign Faculty'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing faculty access
export default withRoleProtection(FacultyManagementPage, ['hod', 'faculty']);
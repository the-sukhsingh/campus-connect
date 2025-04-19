'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { updateUserProfile } from '@/services/userServiceClient';

export default function UserInfoForm({ onComplete }) {
  const { user, dbUser, userRole, handleUserDataMemoized } = useAuth();
  const router = useRouter();
  
  const [displayName, setDisplayName] = useState(dbUser?.displayName || '');
  const [rollNo, setRollNo] = useState(dbUser?.rollNo || '');
  const [studentId, setStudentId] = useState(dbUser?.studentId || '');
  const [department, setDepartment] = useState(dbUser?.department || '');
  const [semester, setSemester] = useState(dbUser?.semester || '');
  const [batch, setBatch] = useState(dbUser?.batch || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Populate form with existing user data when it becomes available
    if (dbUser) {
      setDisplayName(dbUser.displayName || '');
      setRollNo(dbUser.rollNo || '');
      setStudentId(dbUser.studentId || '');
      setDepartment(dbUser.department || '');
      setSemester(dbUser.semester || '');
      setBatch(dbUser.batch || '');
    }
  }, [dbUser]);

  const validateForm = () => {
    // For all users, display name is required
    if (!displayName.trim()) {
      setError('Name is required');
      return false;
    }

    // For students, additional fields are required
    if (userRole === 'student') {
      if (!rollNo.trim()) {
        setError('Roll Number is required');
        return false;
      }
      if (!studentId.trim()) {
        setError('Student ID is required');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;
    if (!dbUser || !user) {
      setError('User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      const userData = { displayName };

      // Add role-specific fields
      if (userRole === 'student') {
        userData.rollNo = rollNo;
        userData.studentId = studentId;
        userData.department = department;
        userData.semester = semester;
        userData.batch = batch;
      } else if (userRole === 'faculty' || userRole === 'hod') {
        // Faculty and HOD only need displayName
      }

      // Update user profile in the database
      await updateUserProfile(dbUser._id.toString(), userData);
      
      // Refresh user data in the AuthContext
      if (user) {
        await handleUserDataMemoized(user);
        
        // Short delay to ensure state updates properly before calling onComplete
        setTimeout(() => {
          // Call onComplete only after successful update and refresh
          if (onComplete) {
            onComplete();
          } else {
            // Redirect based on role
            switch(userRole) {
              case 'student':
                router.push('/dashboard/student');
                break;
              case 'faculty':
                router.push('/dashboard/faculty');
                break;
              case 'hod':
                router.push('/dashboard/admin');
                break;
              default:
                router.push('/dashboard');
            }
          }
        }, 100);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
      <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h1>
      <p className="text-gray-600 mb-6 text-center">
        Please provide the following information to complete your profile.
      </p>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter your full name"
          />
        </div>

        {userRole === 'student' && (
          <>
            <div>
              <label htmlFor="rollNo" className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number <span className="text-red-500">*</span>
              </label>
              <input
                id="rollNo"
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your roll number"
              />
            </div>

            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                Student ID <span className="text-red-500">*</span>
              </label>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your student ID"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your department"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <input
                  id="semester"
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Current semester"
                />
              </div>

              <div>
                <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-1">
                  Batch
                </label>
                <input
                  id="batch"
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Your batch"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isSubmitting ? 'Saving...' : 'Save Profile Information'}
          </button>
        </div>
      </form>
    </div>
  );
}
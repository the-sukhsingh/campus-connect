'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import UserInfoForm from './UserInfoForm';


export default function ProfileCompletionWrapper({ children }) {
  const { dbUser, userRole, loading } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  useEffect(() => {
    if (!loading && dbUser) {
      let complete = true;
      
      // Check if user has completed their profile based on role
      if (!dbUser.displayName) {
        complete = false; // All users need a display name
      }
      
      if (userRole === 'student') {
        // Students need additional fields filled out
        if (!dbUser.rollNo || !dbUser.studentId) {
          complete = false;
        }
      }
      
      setIsProfileComplete(complete);
    }
  }, [dbUser, userRole, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // If profile is incomplete, show the form
  if (!isProfileComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <UserInfoForm onComplete={() => setIsProfileComplete(true)} />
      </div>
    );
  }

  // Otherwise, render the children
  return <>{children}</>;
}
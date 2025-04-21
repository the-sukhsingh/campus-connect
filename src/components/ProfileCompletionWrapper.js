'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import PasswordChangeForm from './PasswordChangeForm';

// This component checks if the user has changed their password after first login
// If not, it forces them to change password before proceeding
export default function ProfileCompletionWrapper({ children }) {
  const { user, dbUser, userRole, passwordChanged, loading } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only check after auth has loaded and we have user data
    if (!loading && user && dbUser) {
      console.log("ProfileCompletionWrapper checking password status:", {
        userRole, 
        passwordChanged, 
        pathname
      });

      // Only faculty and students need to change password on first login
      if (
        (userRole === 'faculty' || userRole === 'student') && 
        passwordChanged === false && // Use the passwordChanged state from context
        // Don't show the form if we're already on the password change page
        !pathname.includes('/dashboard/password-change')
      ) {
        console.log("Setting showPasswordChange to true");
        setShowPasswordChange(true);
      } else {
        setShowPasswordChange(false);
      }
    }
  }, [loading, user, dbUser, userRole, passwordChanged, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (showPasswordChange) {
    console.log("Rendering password change form");
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-8">
              <h2 className="text-2xl font-bold text-center mb-6">Security Notice</h2>
              <p className="text-gray-700 mb-6">
                For your security, you need to change your password before accessing the system.
              </p>
              <PasswordChangeForm isFirstLogin={true} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no issues, render the children components
  return children;
}
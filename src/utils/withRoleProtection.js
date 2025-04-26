'use client';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ComponentType } from 'react';
import ProfileCompletionWrapper from '@/components/ProfileCompletionWrapper';

// Enhanced Loading component that respects the current theme
const LoadingSpinner = () => {
  const { theme } = useTheme();
  
  return (
    <div className={`flex items-center justify-center h-screen w-full ${ theme === 'dark' ? 'bg-[var(--background)]' : 'bg-white'}`}>
      <div className={`animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 ${
        theme === 'dark' ? 'border-blue-400' : 'border-blue-600'
      }`}></div>
      <p className={`ml-4 text-lg font-medium ${
        theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
      }`}>Loading...</p>
    </div>
  );
};

// Higher Order Component for role-based access control
export function withRoleProtection(
  Component,
  allowedRoles
) {
  return function ProtectedComponent(props) {
    const { user, userRole, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Wait until authentication state is loaded
      if (!loading) {
        // If user is not authenticated, redirect to login
        if (!user) {
          router.push('/auth');
        } 
        // If user doesn't have the required role, redirect to unauthorized
        else if (!userRole || !allowedRoles.includes(userRole)) {
          router.push('/unauthorized');
        }
      }
    }, [user, userRole, loading, router]);

    // Show enhanced loading state while checking auth
    if (loading) {
      return <LoadingSpinner />;
    }

    // Show component only if user is authenticated and has the required role
    if (user && userRole && allowedRoles.includes(userRole)) {
      // Wrap the component with ProfileCompletionWrapper to ensure profile is complete
      return (
        <ProfileCompletionWrapper>
          <Component {...props} />
        </ProfileCompletionWrapper>
      );
    }

    // Return null while redirecting
    return null;
  };
}
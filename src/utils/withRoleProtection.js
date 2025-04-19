'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ComponentType } from 'react';
import ProfileCompletionWrapper from '@/components/ProfileCompletionWrapper';

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

    // Show loading state while checking auth
    if (loading) {
      return <div>Loading...</div>;
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
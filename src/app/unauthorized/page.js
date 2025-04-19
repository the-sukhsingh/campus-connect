'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function UnauthorizedPage() {
  const { user, userRole } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="bg-white shadow-xl rounded-lg p-8 max-w-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <div className="mb-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 text-red-500 mx-auto mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          
          <p className="text-gray-700 mb-4">
            You don&apos;t have permission to access this page.
          </p>
          
          {user && (
            <p className="text-sm text-gray-600 mb-4">
              Logged in as: {user.email} 
              {userRole && <span className="ml-1">({userRole})</span>}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 justify-center">
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
            Go to Home
          </Link>
          
          {!user && (
            <Link href="/auth" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
              Log In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
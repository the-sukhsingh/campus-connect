'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function AdminDashboard() {
  const { user, userRole } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <p className="text-gray-700">
          Welcome, <span className="font-semibold">{user?.displayName || user?.email}</span>! 
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {userRole}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/admin/colleges" className="bg-white shadow hover:shadow-md rounded-lg p-6 transition-shadow duration-200">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h2 className="font-semibold text-lg">College Management</h2>
          </div>
          <p className="text-gray-600">Configure colleges, departments, and verification methods.</p>
        </Link>

        <Link href="/dashboard/faculty/invites" className="bg-white shadow hover:shadow-md rounded-lg p-6 transition-shadow duration-200">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h2 className="font-semibold text-lg">Invite Management</h2>
          </div>
          <p className="text-gray-600">Create and manage invitations for students and faculty.</p>
        </Link>

        <div className="bg-white shadow hover:shadow-md rounded-lg p-6 transition-shadow duration-200">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <h2 className="font-semibold text-lg">System Settings</h2>
          </div>
          <p className="text-gray-600">Configure system-wide settings and preferences.</p>
        </div>
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing only admin access
export default withRoleProtection(AdminDashboard, ['hod']);
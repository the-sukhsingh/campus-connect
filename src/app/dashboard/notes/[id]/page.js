'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import NoteViewer from '@/components/NoteViewer';
import { withRoleProtection } from '@/utils/withRoleProtection';

function NoteDetailPage({ params }) {
  const router = useRouter();
  const { userRole } = useAuth();
  const unwrappedParams = React.use(params);
  const noteId = unwrappedParams.id;
  
  // Add back navigation to appropriate section based on user role
  const getBackLink = () => {
    if (userRole === 'student') {
      return '/dashboard/student/notes';
    } else if (userRole === 'faculty' || userRole === 'hod') {
      return '/dashboard/faculty/notes';
    }
    return '/dashboard';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={getBackLink()} className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
          <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Study Materials
        </Link>
      </div>
      
      <NoteViewer noteId={noteId} />
    </div>
  );
}

// Wrap the component with role protection, allowing student, faculty, and HOD access
export default withRoleProtection(NoteDetailPage, ['student', 'faculty', 'hod']);
'use client';

import React from 'react';
import NoteViewer from '@/components/NoteViewer';
import { withRoleProtection } from '@/utils/withRoleProtection';

function NoteDetailPage({ params }) {
  const unwrappedParams = React.use(params);
  const noteId = unwrappedParams.id;
  

  return (
      
      <NoteViewer noteId={noteId} />
  );
}

// Wrap the component with role protection, allowing student, faculty, and HOD access
export default withRoleProtection(NoteDetailPage, ['student', 'faculty', 'hod']);
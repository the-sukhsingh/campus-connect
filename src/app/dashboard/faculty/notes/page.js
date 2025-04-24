'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import NoteUploadForm from '@/components/NoteUploadForm';
import NoteList from '@/components/NoteList';

function FacultyNotesPage() {
  const { dbUser } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Get filters based on active tab
  const getFilters = () => {
    if (activeTab === 'my') {
      return { uploadedBy: dbUser?._id };
    }
    return {};
  };

  // Handle note upload success
  const handleNoteUploadSuccess = () => {
    // Trigger refresh of the note list
    setRefreshTrigger(prev => prev + 1);
    // Switch to My Notes tab
    setActiveTab('my');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Study Materials</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Upload Form */}
        <div className="lg:col-span-1">
          <NoteUploadForm onSuccess={handleNoteUploadSuccess} collegeId={dbUser.college._id} />
        </div>

        {/* Right column - Notes List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === 'all'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-indigo-600 hover:border-b-2 hover:border-indigo-600'
                  }`}
                >
                  All Notes
                </button>
                <button
                  onClick={() => setActiveTab('my')}
                  className={`px-4 py-3 ml-6 text-sm font-medium ${
                    activeTab === 'my'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-indigo-600 hover:border-b-2 hover:border-indigo-600'
                  }`}
                >
                  My Uploads
                </button>
              </nav>
            </div>

            {/* Notes List */}
            <div className="p-4">
              <NoteList 
                key={refreshTrigger} 
                filters={getFilters()} 
                showActions={activeTab === 'my'} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing only faculty and HOD access
export default withRoleProtection(FacultyNotesPage, ['faculty', 'hod']);
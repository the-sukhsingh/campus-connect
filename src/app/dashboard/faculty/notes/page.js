'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import NoteUploadForm from '@/components/NoteUploadForm';
import NoteList from '@/components/NoteList';

function FacultyNotesPage() {
  const { dbUser } = useAuth();
  const { theme } = useTheme();
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
    <div className={`container mx-auto px-4 py-8 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
      <div className="flex items-center justify-between mb-8">
        <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600'}`}>Study Materials</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left column - Upload Form */}
        <div className="lg:col-span-2">
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-md p-6 border transition-colors duration-200`}>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Upload Study Material</h2>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Share notes, assignments, or any other academic resources with students.
            </p>
            <NoteUploadForm onSuccess={handleNoteUploadSuccess} collegeId={dbUser.college._id} />
          </div>
        </div>

        {/* Right column - Notes List */}
        <div className="lg:col-span-2">
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-md rounded-lg overflow-hidden border transition-colors duration-200`}>
            {/* Tabs */}
            <div className={`${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-b`}>
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-3 text-sm font-medium relative ${
                    activeTab === 'all'
                      ? theme === 'dark' 
                        ? 'text-indigo-400 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-400' 
                        : 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-indigo-400' 
                        : 'text-gray-500 hover:text-indigo-600'
                  } transition-colors duration-200`}
                >
                  All Notes
                </button>
                <button
                  onClick={() => setActiveTab('my')}
                  className={`px-4 py-3 ml-6 text-sm font-medium relative ${
                    activeTab === 'my'
                      ? theme === 'dark' 
                        ? 'text-indigo-400 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-400' 
                        : 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-indigo-400' 
                        : 'text-gray-500 hover:text-indigo-600'
                  } transition-colors duration-200`}
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
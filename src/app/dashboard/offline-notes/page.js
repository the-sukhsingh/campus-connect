'use client';

import { useTheme } from '@/context/ThemeContext';
// import OfflineNotesList from '@/components/OfflineNotesList';

export default function OfflineNotesPage() {
  const { theme } = useTheme();
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className={`text-2xl md:text-3xl font-bold mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      } transition-colors duration-300`}>
        Offline Notes
      </h1>
      
      <div className="mb-6">
        <p className={`${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        } transition-colors duration-300`}>
          Access your notes even when you&apos;re offline. Notes you&apos;ve marked for offline use will appear here.
        </p>
      </div>
      
      {/* <OfflineNotesList /> */}
    </div>
  );
}
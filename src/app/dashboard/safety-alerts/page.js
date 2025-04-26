'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import SafetyAlertForm from '@/components/SafetyAlertForm';
import SafetyAlertList from '@/components/SafetyAlertList';

export default function SafetyAlertsPage() {
  const { dbUser, userRole } = useAuth();
  const { theme } = useTheme();
  const [listKey, setListKey] = useState(0); // Used to force list refresh

  const canCreateAlerts = ['faculty', 'hod', 'librarian'].includes(userRole);

  const handleAlertCreated = () => {
    // Force refresh the list by changing its key
    setListKey(prev => prev + 1);
  };

  return (
    <div className={`mx-auto min-h-svh  px-4 md:px-8 lg:px-16 py-8 ${theme === 'dark' ? 'text-gray-100 bg-[var(--background)]' : 'text-gray-800'}`}>
      <h1 className={`text-2xl font-bold mb-8 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Safety Alerts</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Form section - only show to authorized users */}
        {canCreateAlerts && (
          <div className="md:col-span-2">
              <SafetyAlertForm onSuccess={handleAlertCreated} collegeId={dbUser.college._id}/>
          </div>
        )}

        {/* Alerts list section */}
        <div className={`${canCreateAlerts ? 'md:col-span-2' : 'md:col-span-4'}`}>
          <div className={`${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} shadow rounded-lg p-6 transition-colors duration-200`}>
            <SafetyAlertList key={listKey} />
          </div>
        </div>
      </div>
    </div>
  )
}
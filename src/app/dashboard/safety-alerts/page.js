'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import SafetyAlertForm from '@/components/SafetyAlertForm';
import SafetyAlertList from '@/components/SafetyAlertList';

export default function SafetyAlertsPage() {
  const { dbUser, userRole } = useAuth();
  const [listKey, setListKey] = useState(0); // Used to force list refresh

  const canCreateAlerts = ['faculty', 'hod', 'librarian'].includes(userRole);

  const handleAlertCreated = () => {
    // Force refresh the list by changing its key
    setListKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Safety Alerts</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Form section - only show to authorized users */}
        {canCreateAlerts && (
          <div className="md:col-span-2">
              <SafetyAlertForm onSuccess={handleAlertCreated} collegeId={dbUser.college._id}/>

          </div>
        )}

        {/* Alerts list section */}
        <div className={`${canCreateAlerts ? 'md:col-span-2' : 'md:col-span-4'}`}>
          <div className="bg-white shadow rounded-lg p-6">
            <SafetyAlertList key={listKey} />
          </div>
        </div>
      </div>
    </div>
  )
}
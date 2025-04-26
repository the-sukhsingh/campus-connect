'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function SafetyAlertForm({ onSuccess, collegeId = null }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState({
    safetyAlert: false,
    collegeAlert: false,
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('safety');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, safetyAlert: true }));
    setError('');
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/safety-alerts', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.accessToken}` // Assuming you have a token for auth
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        severity: 'medium'
      });

      setMessage({
        type: 'success',
        text: 'Safety alert created successfully.'
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      console.error('Error creating safety alert:', error);
      setError(error.message || 'Failed to create safety alert');
    } finally {
      setLoading(prev => ({ ...prev, safetyAlert: false }));
    }
  };


  // Handle emergency alert to entire college
  const handleCollegeEmergencyAlert = async (alertType) => {
    if (!collegeId) {
      setMessage({
        type: 'error',
        text: 'College ID is required to send college-wide notifications'
      });
      return;
    }

    setLoading(prev => ({ ...prev, collegeAlert: true }));
    setError('');
    setMessage({ type: '', text: '' });

    try {
      // Determine alert details based on type
      let title, description, severity;
      
      if (alertType === 'fire') {
        title = 'COLLEGE-WIDE FIRE ALERT - EMERGENCY';
        description = 'Fire alert has been issued for the entire college. Please evacuate all buildings immediately using the nearest exits. Do not use elevators. Proceed to designated assembly points.';
        severity = 'critical';
      } else if (alertType === 'earthquake') {
        title = 'COLLEGE-WIDE EARTHQUAKE ALERT - EMERGENCY';
        description = 'Earthquake alert has been issued for the entire college. Drop, cover, and hold on. Stay away from windows and exterior walls. Wait for instructions before evacuating.';
        severity = 'critical';
      } else {
        throw new Error('Invalid alert type');
      }

      // Send the emergency notification college-wide
      const response = await fetch('/api/notifications/college-emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          collegeId: collegeId,
          title: title,
          body: description,
          data: {
            type: 'college_emergency_alert',
            alertType: alertType,
            severity: severity,
            url: '/dashboard/safety-alerts'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send college-wide emergency notification');
      }

      setMessage({
        type: 'success',
        text: `${alertType === 'fire' ? 'Fire' : 'Earthquake'} alert has been sent successfully to the entire college.`
      });

    } catch (error) {
      console.error('Error sending college-wide emergency alert:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send college-wide emergency notification'
      });
    } finally {
      setLoading(prev => ({ ...prev, collegeAlert: false }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={`container mx-auto px-4 py-8 ${theme === 'dark' ? 'text-gray-200 bg-[var(--background)]' : 'text-gray-800'}`}>
      {/* Tabs for switching between safety alert and emergency notifications */}
      <div className="mb-6">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'safety'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Regular Safety Alert
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emergency')}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'emergency'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Emergency Notifications
          </button>
        </div>
      </div>

      {/* Success or error message display */}
      {(message.text || error) && (
        <div 
          className={`p-4 mb-4 border-l-4 ${
            message.type === 'error' || error
              ? 'bg-red-50 border-red-500 text-red-700' 
              : 'bg-green-50 border-green-500 text-green-700'
          }`} 
          role="alert"
        >
          <p className="font-medium">{message.text || error}</p>
        </div>
      )}

      {/* Regular Safety Alert Form */}
      {activeTab === 'safety' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
              placeholder="Brief title for the safety alert"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
              placeholder="Detailed description of the safety concern..."
            />
          </div>

          <div>
            <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
              Severity Level
            </label>
            <select
              id="severity"
              name="severity"
              required
              value={formData.severity}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}
            >
              <option value="low">Low - General Caution</option>
              <option value="medium">Medium - Immediate Attention Needed</option>
              <option value="high">High - Urgent Situation</option>
              <option value="critical">Critical - Emergency Situation</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading.safetyAlert}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading.safetyAlert ? 'Creating Alert...' : 'Create Safety Alert'}
          </button>
        </form>
      )}

      {/* Emergency Notifications */}
      {activeTab === 'emergency' && (
        <div>

          {/* College-wide emergency alerts */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">College-Wide Emergency Alerts</h2>
            <p className="text-red-600 font-medium mb-4">⚠️ These alerts will be sent to ALL college members.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => handleCollegeEmergencyAlert('fire')}
                disabled={loading.collegeAlert || !collegeId}
                className={`flex items-center justify-center px-4 py-3 border border-transparent font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none ${
                  loading.collegeAlert || !collegeId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading.collegeAlert ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                )}
                College-Wide Fire Alert
              </button>
              
              <button
                type="button"
                onClick={() => handleCollegeEmergencyAlert('earthquake')}
                disabled={loading.collegeAlert || !collegeId}
                className={`flex items-center justify-center px-4 py-3 border border-transparent font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none ${
                  loading.collegeAlert || !collegeId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading.collegeAlert ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                )}
                College-Wide Earthquake Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
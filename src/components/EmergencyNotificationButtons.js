'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function EmergencyNotificationButtons({ classes = [], collegeId = null }) {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState({
    collegeAlert: false,
    classAlert: false,
    customNotification: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [customNotification, setCustomNotification] = useState({
    title: '',
    body: ''
  });
  const [activeTab, setActiveTab] = useState('emergency');

  // Handle emergency alert to a specific class
  const handleClassEmergencyAlert = async (alertType) => {
    if (!selectedClassId) {
      setMessage({
        type: 'error',
        text: 'Please select a class to send the notification to'
      });
      return;
    }

    setLoading(prev => ({ ...prev, classAlert: true }));
    setMessage({ type: '', text: '' });

    try {
      // Determine alert details based on type
      let title, description, severity;
      
      if (alertType === 'fire') {
        title = 'FIRE ALERT - EMERGENCY';
        description = 'Fire alert has been issued. Please evacuate the building immediately using the nearest exit. Do not use elevators. Proceed to the designated assembly point.';
        severity = 'critical';
      } else if (alertType === 'earthquake') {
        title = 'EARTHQUAKE ALERT - EMERGENCY';
        description = 'Earthquake alert has been issued. Drop, cover, and hold on. Stay away from windows and exterior walls. Wait for instructions before evacuating.';
        severity = 'critical';
      } else {
        throw new Error('Invalid alert type');
      }

      // Send the emergency notification
      const response = await fetch('/api/notifications/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          classId: selectedClassId,
          title: title,
          body: description,
          data: {
            type: 'emergency_alert',
            alertType: alertType,
            severity: severity,
            url: '/dashboard/safety-alerts'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send emergency notification');
      }

      setMessage({
        type: 'success',
        text: `${alertType === 'fire' ? 'Fire' : 'Earthquake'} alert has been sent successfully to the selected class.`
      });

    } catch (error) {
      console.error('Error sending emergency alert:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send emergency notification'
      });
    } finally {
      setLoading(prev => ({ ...prev, classAlert: false }));
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

  // Handle sending custom notification to a specific class
  const handleCustomNotification = async (e) => {
    e.preventDefault();
    
    if (!selectedClassId) {
      setMessage({
        type: 'error',
        text: 'Please select a class to send the notification to'
      });
      return;
    }

    if (!customNotification.title.trim() || !customNotification.body.trim()) {
      setMessage({
        type: 'error',
        text: 'Please provide both title and message for the notification'
      });
      return;
    }

    setLoading(prev => ({ ...prev, customNotification: true }));
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/notifications/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          classId: selectedClassId,
          title: customNotification.title,
          body: customNotification.body,
          data: {
            type: 'custom_notification',
            url: '/dashboard/notifications'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send custom notification');
      }

      setMessage({
        type: 'success',
        text: 'Custom notification has been sent successfully to the selected class.'
      });

      // Reset form
      setCustomNotification({
        title: '',
        body: ''
      });

    } catch (error) {
      console.error('Error sending custom notification:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send custom notification'
      });
    } finally {
      setLoading(prev => ({ ...prev, customNotification: false }));
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {message.text && (
        <div 
          className={`p-4 mb-4 border-l-4 ${
            message.type === 'error' 
              ? 'bg-red-100 border-red-500 text-red-700' 
              : 'bg-green-100 border-green-500 text-green-700'
          }`} 
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('emergency')}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'emergency'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Emergency Alerts
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'custom'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Custom Notifications
          </button>
        </div>
      </div>

      {activeTab === 'emergency' ? (
        <div>
          <h2 className="text-lg font-semibold mb-4">College-Wide Emergency Alerts</h2>
          <p className="text-red-600 font-medium mb-4">⚠️ These alerts will be sent to ALL college members.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
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
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-4">Custom Class Notification</h2>
          
          <div className="mb-4">
            <label htmlFor="customClassSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Class to Notify
            </label>
            <select
              id="customClassSelect"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading.customNotification}
            >
              <option value="">Select a class</option>
              {classes.map((classItem) => (
                <option key={classItem._id} value={classItem._id}>
                  {classItem.name} - {classItem.department} ({classItem.semester})
                </option>
              ))}
            </select>
          </div>
          
          <form onSubmit={handleCustomNotification}>
            <div className="mb-4">
              <label htmlFor="notificationTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Notification Title *
              </label>
              <input
                id="notificationTitle"
                type="text"
                value={customNotification.title}
                onChange={(e) => setCustomNotification(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter notification title"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="notificationBody" className="block text-sm font-medium text-gray-700 mb-2">
                Notification Message *
              </label>
              <textarea
                id="notificationBody"
                value={customNotification.body}
                onChange={(e) => setCustomNotification(prev => ({ ...prev, body: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter notification message"
                required
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={loading.customNotification || !selectedClassId}
              className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${
                loading.customNotification || !selectedClassId ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading.customNotification ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Notification'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
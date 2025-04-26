'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function SafetyAlertList() {
  const { user, dbUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('active'); // 'active' or 'all'
  const { theme } = useTheme();

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/safety-alerts'
        : '/api/safety-alerts?status=active';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.accessToken}`
        }
      });
      
      const data = await response.json();
      
      if (response.error) {
        throw new Error(response.error);
      }
      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching safety alerts:', error);
      setError('Failed to load safety alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      const response = await fetch(`/api/safety-alerts/${alertId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'resolved' }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.accessToken}`
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh alerts list
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      setError('Failed to resolve alert');
    }
  };

  const getSeverityColor = (severity) => {
    // More elegant severity indicator colors with theme consideration
    if (theme === 'dark') {
      switch (severity) {
        case 'critical':
          return 'bg-red-900 text-red-100';
        case 'high':
          return 'bg-orange-800 text-orange-100';
        case 'medium':
          return 'bg-amber-700 text-amber-100';
        case 'low':
          return 'bg-blue-800 text-blue-100';
        default:
          return 'bg-gray-700 text-gray-100';
      }
    } else {
      switch (severity) {
        case 'critical':
          return 'bg-red-100 text-red-800 border border-red-300';
        case 'high':
          return 'bg-orange-100 text-orange-800 border border-orange-300';
        case 'medium':
          return 'bg-amber-100 text-amber-800 border border-amber-300';
        case 'low':
          return 'bg-blue-100 text-blue-800 border border-blue-300';
        default:
          return 'bg-gray-100 text-gray-800 border border-gray-300';
      }
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
      }`}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-6 w-24 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-5 rounded-lg border ${
        theme === 'dark' 
          ? 'bg-red-900/30 text-red-200 border-red-800' 
          : 'bg-red-50 text-red-600 border-red-200'
      }`}>
        <div className="flex items-center">
          <span className="mr-2">⚠️</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-2 rounded-lg transition-colors duration-200 ${
      theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
    }`}>
      <div className="flex justify-between items-center border-b pb-4 mb-2 border-opacity-20
        ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}">
        <h2 className={`text-xl font-serif tracking-wide ${
          theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
        }`}>Safety Alerts</h2>
        
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`appearance-none pl-4 pr-8 py-2 rounded-md border text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
            }`}
          >
            <option value="active">Active Alerts</option>
            <option value="all">All Alerts</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-12 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
        }`}>
          <svg className={`w-12 h-12 mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {filter === 'active' 
              ? 'No active safety alerts at this time' 
              : 'No safety alerts found in the system'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {alerts.map((alert) => (
            <div
              key={alert._id}
              className={`border rounded-lg p-5 transition-all duration-200 hover:shadow-md ${
                theme === 'dark' 
                  ? `border-gray-700 ${alert.status === 'resolved' ? 'bg-gray-800/30' : 'bg-gray-800/60'}` 
                  : `border-gray-200 ${alert.status === 'resolved' ? 'bg-gray-50' : 'bg-white'}`
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                  <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                    {alert.title}
                  </h3>
                  <p className={`mt-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {alert.description}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getSeverityColor(
                    alert.severity
                  )}`}
                >
                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                </span>
              </div>

              <div className={`mt-5 pt-3 flex justify-between items-center text-sm border-t ${
                theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
              }`}>
                <div>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Posted by </span>
                  <span className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}>
                    {alert.createdBy?.displayName || 'Unknown'} 
                  </span>
                  {alert.createdBy?.role && (
                    <span className={`ml-1 italic ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                      ({alert.createdBy.role})
                    </span>
                  )}
                  <br />
                  <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>

                {alert.status === 'active' &&
                  ['faculty', 'hod', 'librarian'].includes(dbUser?.role) && (
                    <button
                      onClick={() => handleResolve(alert._id)}
                      className={`px-3 py-1 rounded-md transition-colors duration-200 ${
                        theme === 'dark' 
                          ? 'bg-green-900/50 text-green-300 hover:bg-green-800' 
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      Mark as Resolved
                    </button>
                  )}

                {alert.status === 'resolved' && (
                  <div className={`text-right ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Resolved by {alert.resolvedBy?.displayName || 'Unknown'}</span>
                    </div>
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      {new Date(alert.resolvedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
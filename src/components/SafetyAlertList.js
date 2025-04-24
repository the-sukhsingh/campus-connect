'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function SafetyAlertList() {
  const { user, dbUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('active'); // 'active' or 'all'

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/safety-alerts'
        : '/api/safety-alerts?status=active';
      console.log("user is:", user); // Debugging line
      const response = await fetch(url, {
        method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.accessToken}` // Assuming you have a token for auth
          }
      }
      )
      const data = await response.json(); // Added to parse the response
      console.log("Data from fetchAlerts:", data); // Debugging line
      console.log("Response from fetchAlerts:", response); // Debugging line
      if (response.error) {
        throw new Error(response.error);
      }
      setAlerts(data);
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
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading safety alerts...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Safety Alerts</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-gray-300 shadow-sm p-2"
        >
          <option value="active">Active Alerts</option>
          <option value="all">All Alerts</option>
        </select>
      </div>

      {alerts.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          {filter === 'active' 
            ? 'No active safety alerts' 
            : 'No safety alerts found'}
        </p>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert._id}
              className={`border rounded-lg p-4 ${
                alert.status === 'resolved' ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{alert.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {alert.description}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                    alert.severity
                  )}`}
                >
                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                </span>
              </div>

              <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                <div>
                  Posted by {alert.createdBy?.displayName || 'Unknown'} 
                  {alert.createdBy?.role && ` (${alert.createdBy.role})`}
                  <br />
                  {new Date(alert.createdAt).toLocaleString()}
                </div>

                {alert.status === 'active' &&
                  ['faculty', 'hod', 'librarian'].includes(dbUser?.role) && (
                    <button
                      onClick={() => handleResolve(alert._id)}
                      className="text-green-600 hover:text-green-800"
                    >
                      Mark as Resolved
                    </button>
                  )}

                {alert.status === 'resolved' && (
                  <span className="text-green-600">
                    Resolved by {alert.resolvedBy?.displayName || 'Unknown'}
                    <br />
                    {new Date(alert.resolvedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
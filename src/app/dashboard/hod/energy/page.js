'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function EnergyManagementPage() {
  const { user, dbUser } = useAuth();
  const router = useRouter();
  const [energyRecords, setEnergyRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    kwh: '',
    startDate: '',
    endDate: '',
    notes: '',
    billDocument: ''
  });

  // Fetch energy records
  const fetchEnergyRecords = async () => {
    console.log('Fetching energy records for user:', dbUser);
    try {
      setLoading(true);
      const response = await fetch(`/api/energy-usage?uid=${dbUser?.firebaseUid}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch energy records');
      }

      const data = await response.json();
      setEnergyRecords(data.energyUsages || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching energy records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dbUser) return;
    fetchEnergyRecords();
  }, [dbUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/energy-usage?uid=' + dbUser.firebaseUid, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to add energy usage record');
      }

      setMessage({ type: 'success', text: 'Energy usage record added successfully' });
      setFormData({
        amount: '',
        kwh: '',
        startDate: '',
        endDate: '',
        notes: '',
        billDocument: ''
      });
      setIsFormVisible(false);
      fetchEnergyRecords();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Prepare data for the graph
  const chartData = {
    labels: energyRecords.map(record => formatDate(record.startDate)),
    datasets: [
      {
        label: 'Energy Usage (kWh)',
        data: energyRecords.map(record => record.kwh),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Cost (₹)',
        data: energyRecords.map(record => record.amount),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'costAxis',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Energy Usage (kWh)'
        }
      },
      costAxis: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Cost (₹)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Energy Usage and Cost Trends'
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Energy Usage Management</h1>
          <p className="text-gray-600 mt-1">Track and manage your college&apos;s energy consumption</p>
        </div>
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center"
        >
          {isFormVisible ? 'Cancel' : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Energy Record
            </>
          )}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${
          message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          <p>{message.text}</p>
        </div>
      )}

      {isFormVisible && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add Energy Usage Record</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount Paid (₹)</label>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label htmlFor="kwh" className="block text-sm font-medium text-gray-700">Energy Used (kWh)</label>
                <input
                  type="number"
                  id="kwh"
                  value={formData.kwh}
                  onChange={(e) => setFormData(prev => ({ ...prev, kwh: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Any additional notes about this billing period..."
              />
            </div>
            <div>
              <label htmlFor="billDocument" className="block text-sm font-medium text-gray-700">Bill Document URL</label>
              <input
                type="url"
                id="billDocument"
                value={formData.billDocument}
                onChange={(e) => setFormData(prev => ({ ...prev, billDocument: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      ) : energyRecords.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No energy records</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first energy usage record.</p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Energy Used</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {energyRecords.map((record) => (
                  <tr key={record._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(record.startDate)}</div>
                      <div className="text-sm text-gray-500">to {formatDate(record.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{record.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.kwh.toLocaleString()} kWh</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{record.notes || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.billDocument ? (
                        <a
                          href={record.billDocument}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Bill
                        </a>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default withRoleProtection(EnergyManagementPage, ['hod']);
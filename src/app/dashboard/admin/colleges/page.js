'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';



function CollegeManagementPage() {
  const { user, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('colleges');
  const [colleges, setColleges] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  
  // New college form state
  const [newCollegeForm, setNewCollegeForm] = useState({
    name: '',
    code: '',
    domain: '',
    departments: '',
    verificationMethods: {
      emailDomain: true,
      inviteCode: false,
      adminApproval: false,
    }
  });
  
  // Feedback message state
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch colleges on mount
  useEffect(() => {
    const fetchColleges = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/colleges');
        
        if (!response.ok) {
          throw new Error('Failed to fetch colleges');
        }
        
        const data = await response.json();
        setColleges(data.colleges || []);
        
        // Set the first college as selected by default if available
        if (data.colleges && data.colleges.length > 0 && !selectedCollege) {
          setSelectedCollege(data.colleges[0]._id);
        }
      } catch (error ) {
        console.error('Error fetching colleges:', error);
        setError('Failed to load colleges. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, [user, selectedCollege]);

  // Fetch pending users when a college is selected
  useEffect(() => {
    const fetchPendingUsers = async () => {
      if (!user || !selectedCollege) return;
      
      try {
        setLoading(true);
        const response = await fetch(
          `/api/verification?uid=${user?.uid}&action=pending-approval&collegeId=${selectedCollege}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch pending users');
        }
        
        const data = await response.json();
        setPendingUsers(data.users || []);
      } catch (error ) {
        console.error('Error fetching pending users:', error);
        setError('Failed to load pending users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'pending') {
      fetchPendingUsers();
    }
  }, [user, selectedCollege, activeTab]);

  // Handle input changes for new college form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCollegeForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox changes for verification methods
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setNewCollegeForm(prev => ({
      ...prev,
      verificationMethods: {
        ...prev.verificationMethods,
        [name]: checked
      }
    }));
  };

  // Handle form submission for new college
  const handleCreateCollege = async (e) => {
    e.preventDefault();
    
    if (!newCollegeForm.name || !newCollegeForm.code || !newCollegeForm.domain) {
      setMessage({ type: 'error', text: 'Name, code, and domain are required' });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Process departments string into array
      const departments = newCollegeForm.departments
        .split(',')
        .map(dep => dep.trim())
        .filter(dep => dep.length > 0);
      
      const response = await fetch('/api/colleges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          collegeData: {
            name: newCollegeForm.name,
            code: newCollegeForm.code,
            domain: newCollegeForm.domain,
            departments,
            verificationMethods: newCollegeForm.verificationMethods,
            active: true
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create college');
      }
      
      const data = await response.json();
      
      // Add the new college to the list and reset form
      setColleges(prev => [...prev, data.college]);
      setSelectedCollege(data.college._id);
      setNewCollegeForm({
        name: '',
        code: '',
        domain: '',
        departments: '',
        verificationMethods: {
          emailDomain: true,
          inviteCode: false,
          adminApproval: false,
        }
      });
      
      setMessage({ type: 'success', text: 'College created successfully!' });
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error creating college' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle college active status
  const handleToggleActive = async (collegeId, currentActive) => {
    try {
      const response = await fetch('/api/colleges', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          collegeId,
          active: !currentActive
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update college status');
      }
      
      const data = await response.json();
      
      // Update the college in the list
      setColleges(prev => 
        prev.map(college => 
          college._id === collegeId ? {...college, active: !currentActive} : college
        )
      );
      
      setMessage({ 
        type: 'success', 
        text: `College ${data.college.name} is now ${data.college.active ? 'active' : 'inactive'}` 
      });
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error updating college status' });
    }
  };

  // Approve a pending user
  const handleApproveUser = async (userId, role) => {
    try {
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          action: 'approve-user',
          userId,
          role
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve user');
      }
      
      // Remove the user from the pending users list
      setPendingUsers(prev => prev.filter(user => user._id !== userId));
      
      setMessage({ type: 'success', text: 'User approved successfully!' });
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error approving user' });
    }
  };

  // Reject a pending user
  const handleRejectUser = async (userId) => {
    try {
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          action: 'reject-user',
          userId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject user');
      }
      
      // Remove the user from the pending users list
      setPendingUsers(prev => prev.filter(user => user._id !== userId));
      
      setMessage({ type: 'success', text: 'User rejected successfully!' });
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error rejecting user' });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">College Management</h1>
      <p className="text-gray-600 mb-6">
        Manage colleges and verify student accounts
      </p>

      {message.text && (
        <div 
          className={`p-4 mb-6 rounded-md ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-700 border-l-4 border-red-500' 
              : 'bg-green-50 text-green-700 border-l-4 border-green-500'
          }`}
        >
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab('colleges')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'colleges'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Colleges
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'add'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Add College
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Approvals
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {activeTab === 'colleges' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {colleges.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No colleges found. Create your first college to get started.</p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add College
                  </button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Domain
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {colleges.map((college) => (
                      <tr key={college._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {college.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {college.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {college.domain}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            college.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {college.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(college.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleToggleActive(college._id, college.active)}
                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded ${
                              college.active 
                                ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                                : 'text-green-700 bg-green-100 hover:bg-green-200'
                            }`}
                          >
                            {college.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'add' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Add New College</h2>
              <form onSubmit={handleCreateCollege} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    College Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={newCollegeForm.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Guru Nanak Dev University"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                      College Code *
                    </label>
                    <input
                      id="code"
                      name="code"
                      type="text"
                      required
                      value={newCollegeForm.code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., GNDU"
                    />
                  </div>
                  <div>
                    <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Domain *
                    </label>
                    <input
                      id="domain"
                      name="domain"
                      type="text"
                      required
                      value={newCollegeForm.domain}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., gndu.ac.in"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="departments" className="block text-sm font-medium text-gray-700 mb-1">
                    Departments (comma-separated)
                  </label>
                  <textarea
                    id="departments"
                    name="departments"
                    value={newCollegeForm.departments}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Computer Science, Electronics, Mechanical Engineering"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Methods
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="emailDomain"
                        name="emailDomain"
                        type="checkbox"
                        checked={newCollegeForm.verificationMethods.emailDomain}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="emailDomain" className="ml-2 block text-sm text-gray-700">
                        Verify by Email Domain (automatic verification for emails with college domain)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="inviteCode"
                        name="inviteCode"
                        type="checkbox"
                        checked={newCollegeForm.verificationMethods.inviteCode}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="inviteCode" className="ml-2 block text-sm text-gray-700">
                        Verify by Invite Code (require invite codes for students)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="adminApproval"
                        name="adminApproval"
                        type="checkbox"
                        checked={newCollegeForm.verificationMethods.adminApproval}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="adminApproval" className="ml-2 block text-sm text-gray-700">
                        Require Admin Approval (manually approve all users)
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Creating...' : 'Create College'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <label htmlFor="college-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Select College
                </label>
                <select
                  id="college-select"
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {colleges.map((college) => (
                    <option key={college._id} value={college._id}>
                      {college.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {pendingUsers.length === 0 ? (
                <div className="bg-gray-50 p-6 text-center rounded-md">
                  <p className="text-gray-500">No pending approval requests for this college.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registered
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingUsers.map((user) => (
                        <tr key={user._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.displayName || 'Anonymous User'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleApproveUser(user._id, 'student')}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                              >
                                Approve as Student
                              </button>
                              <button
                                onClick={() => handleApproveUser(user._id, 'faculty')}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                              >
                                Approve as Faculty
                              </button>
                              <button
                                onClick={() => handleRejectUser(user._id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing only admin access
export default withRoleProtection(CollegeManagementPage, ['hod']);
'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';



function CollegeSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingCollege, setExistingCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form data state with auto-generated unique ID
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    domain: '',
    departments: '',
  });

  // Check if HOD already has a college
  useEffect(() => {
    const checkExistingCollege = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/user/college?uid=${user?.uid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch college information');
        }
        
        const data = await response.json();
        
        if (data.college) {
          setExistingCollege(data.college);
          // Redirect to college management if a college already exists
          router.push('/dashboard/hod/college/manage');
        }
      } catch (error ) {
        console.error('Error fetching college data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingCollege();
  }, [user, router]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
 

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setMessage({
        type: 'error',
        text: 'You must be logged in to create a college'
      });
      return;
    }
    
    // Validate form
    if (!formData.name.trim() || !formData.code.trim()) {
      setMessage({
        type: 'error',
        text: 'College name and code are required'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Process departments string into array
      const departments = formData.departments
        ? formData.departments.split(',').map(dep => dep.trim()).filter(dep => dep.length > 0)
        : [];
      
      const response = await fetch('/api/colleges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          collegeData: {
            name: formData.name,
            code: formData.code,
            domain: formData.domain || '',  // Provide empty string if domain is not filled
            departments: departments,
            hodId: user?.uid,  // Include hodId field for the College model
            verificationMethods: {
              emailDomain: !!formData.domain,  // Enable domain verification only if domain is provided
              inviteCode: false,
              adminApproval: false
            },
            active: true
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create college');
      }
      
      setMessage({
        type: 'success',
        text: 'College created successfully!'
      });
      
      // Redirect to HOD dashboard after successful submission
      setTimeout(() => {
        router.push('/dashboard/hod');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating college:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create college. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already loading, show loader
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">College Setup</h1>
          <p className="text-gray-600 mt-1">
            Create your college profile to get started
          </p>
        </div>
        
      </div>

      {message.text && (
        <div 
          className={`p-4 mb-6 border-l-4 ${
            message.type === 'error' 
              ? 'bg-red-100 border-red-500 text-red-700' 
              : 'bg-green-100 border-green-500 text-green-700'
          }`} 
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* College Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                College Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Guru Nanak Dev University"
              />
            </div>

            {/* Code and Domain */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  College Code *
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., GNDU"
                />
              </div>
              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Domain (Optional)
                </label>
                <input
                  id="domain"
                  name="domain"
                  type="text"
                  value={formData.domain}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., gndu.ac.in"
                />
              </div>
            </div>
            
            {/* Departments */}
            <div>
              <label htmlFor="departments" className="block text-sm font-medium text-gray-700 mb-2">
                Departments (comma-separated)
              </label>
              <textarea
                id="departments"
                name="departments"
                value={formData.departments}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Computer Science, Electronics, Mechanical Engineering"
                rows={3}
              />
            </div>


          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full md:w-auto flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating College...
                </>
              ) : (
                'Create College'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Wrap the component with role protection, allowing only HOD access
export default withRoleProtection(CollegeSetupPage, ['hod']);
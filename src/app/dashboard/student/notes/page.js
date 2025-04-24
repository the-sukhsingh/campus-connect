'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import NoteList from '@/components/NoteList';

function StudentNotesPage() {
  const { dbUser } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    semester: '',
    subject: '',
  });

  // Get filters based on active tab and search/filter inputs
  const getFilters = () => {
    const baseFilters = { ...filters };
    
    // Add search term if provided
    if (searchTerm) {
      baseFilters.search = searchTerm;
    }
    
    // Filter by favorites if on favorites tab
    if (activeTab === 'favorites') {
      // This is handled differently - we'll use the favorites API endpoint
      // but keep other filters
      return baseFilters;
    }
    
    return baseFilters;
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      department: '',
      semester: '',
      subject: '',
    });
    setSearchTerm('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Study Materials</h1>
        <p className="mt-2 text-gray-600">
          Browse through study materials uploaded by faculty members.
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'all'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-indigo-600 hover:border-b-2 hover:border-indigo-600'
              }`}
            >
              All Notes
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-3 ml-6 text-sm font-medium ${
                activeTab === 'favorites'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-indigo-600 hover:border-b-2 hover:border-indigo-600'
              }`}
            >
              My Favorites
            </button>
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search by title, subject, or content"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div>
              <label htmlFor="department" className="sr-only">
                Department
              </label>
              <select
                id="department"
                name="department"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={filters.department}
                onChange={handleFilterChange}
              >
                <option value="">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                {/* Add more departments as needed */}
              </select>
            </div>

            <div>
              <label htmlFor="semester" className="sr-only">
                Semester
              </label>
              <select
                id="semester"
                name="semester"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={filters.currentSemester}
                onChange={handleFilterChange}
              >
                <option value="">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>

            {/* Clear Filters button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="p-4">
          {activeTab === 'all' && (
            <NoteList 
              filters={getFilters()} 
            />
          )}
          {activeTab === 'favorites' && (
            <FavoriteNotesList 
              filters={getFilters()} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Component for displaying favorite notes
function FavoriteNotesList({ filters }) {
  const { getIdToken } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // Load favorite notes
  const loadFavorites = async (page = 1) => {
    try {
      setLoading(true);
      
      const token = await getIdToken();
      
      // Build query params for pagination
      const queryParams = new URLSearchParams({
        page,
        limit: pagination.limit
      });
      
      // Add optional filters
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.currentSemester) queryParams.append('semester', filters.currentSemester);
      if (filters.subject) queryParams.append('subject', filters.subject);
      if (filters.search) queryParams.append('search', filters.search);
      
      const response = await fetch(`/api/notes/favorites?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorite notes');
      }
      
      const result = await response.json();
      
      setNotes(result.notes);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message || 'Error loading favorite notes');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useState(() => {
    loadFavorites();
  }, [filters]); // Reload when filters change

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    loadFavorites(page);
  };

  if (loading && notes.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4">
        <p>{error}</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="bg-white p-6 text-center">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
        </svg>
        <p className="text-gray-600">You haven&apos;t favorited any notes yet.</p>
        <p className="text-gray-600 mt-1">Browse all notes and star your favorites to see them here.</p>
      </div>
    );
  }

  // Reuse NoteList component to display notes
  return <NoteList notes={notes} pagination={pagination} onPageChange={handlePageChange} />;
}

// Wrap the component with role protection, allowing only students, faculty, and HOD access
export default withRoleProtection(StudentNotesPage, ['student', 'faculty', 'hod']);
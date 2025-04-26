'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import NoteList from '@/components/NoteList';

function StudentNotesPage() {
  const { dbUser, getIdToken } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    semester: '',
    subject: '',
    classs: ''
  });
  const [availableFilters, setAvailableFilters] = useState({
    departments: [],
    subjects: [],
    semesters: [],
    classes: [],
  });
  const [filtersLoading, setFiltersLoading] = useState(true);

  // Fetch available filters from the notes collection
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setFiltersLoading(true);
        const token = await getIdToken();
        
        // Fetch distinct departments, subjects and semesters
        const res = await fetch('/api/notes/filters', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch filters');
        }
        
        const data = await res.json();
        setAvailableFilters({
          departments: data.departments || [],
          subjects: data.subjects || [],
          semesters: data.semesters?.sort((a, b) => Number(a) - Number(b)) || [],
          classes: data.classes || [],
        });
      } catch (error) {
        console.error('Error fetching filters:', error);
      } finally {
        setFiltersLoading(false);
      }
    };
    
    fetchFilters();
  }, []);

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
      classs: ''
    });
    setSearchTerm('');
  };

  return (
    <div className={` mx-auto min-h-svh px-4 py-8 ${theme === 'dark' ? 'bg-[var(--background)] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} transition-colors duration-200`}>
          Study Materials
        </h1>
        <p className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-200`}>
          Browse through study materials uploaded by faculty members.
        </p>
      </div>

      <div className={`${theme === 'dark' ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-md'} rounded-lg overflow-hidden transition-colors duration-200`}>
        {/* Tabs */}
        <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-200`}>
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'all'
                  ? theme === 'dark' 
                    ? 'border-b-2 border-purple-500 text-purple-400'
                    : 'border-b-2 border-indigo-600 text-indigo-600'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-purple-400 hover:border-b-2 hover:border-purple-400'
                    : 'text-gray-500 hover:text-indigo-600 hover:border-b-2 hover:border-indigo-600'
              }`}
            >
              All Notes
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-3 ml-6 text-sm font-medium transition-all duration-200 ${
                activeTab === 'favorites'
                  ? theme === 'dark' 
                    ? 'border-b-2 border-purple-500 text-purple-400'
                    : 'border-b-2 border-indigo-600 text-indigo-600'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-purple-400 hover:border-b-2 hover:border-purple-400'
                    : 'text-gray-500 hover:text-indigo-600 hover:border-b-2 hover:border-indigo-600'
              }`}
            >
              My Favorites
            </button>
          </nav>
        </div>

        {/* Search and Filters */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} transition-colors duration-200`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-1">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
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
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:ring-purple-500 focus:border-purple-500' 
                      : 'border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                  } rounded-md leading-5 focus:outline-none sm:text-sm transition-colors duration-200`}
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
                className={`block w-full pl-3 pr-10 py-2 text-base border ${
                  theme === 'dark'
                    ? 'border-gray-600 bg-gray-700 text-white focus:ring-purple-500 focus:border-purple-500'
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                } sm:text-sm rounded-md transition-colors duration-200`}
                value={filters.department}
                onChange={handleFilterChange}
                disabled={filtersLoading}
              >
                <option value="">All Departments</option>
                {availableFilters.departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="classs" className="sr-only">
                Class
              </label>
              <select
                id="classs"
                name="classs"
                className={`block w-full pl-3 pr-10 py-2 text-base border ${
                  theme === 'dark'
                    ? 'border-gray-600 bg-gray-700 text-white focus:ring-purple-500 focus:border-purple-500'
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                } sm:text-sm rounded-md transition-colors duration-200`}
                value={filters.classs}
                onChange={handleFilterChange}
                disabled={filtersLoading}
              >
                <option value="">All Classes</option>
                {availableFilters.classes.map(classItem => (
                  <option key={classItem} value={classItem}>{classItem}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="subject" className="sr-only">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                className={`block w-full pl-3 pr-10 py-2 text-base border ${
                  theme === 'dark'
                    ? 'border-gray-600 bg-gray-700 text-white focus:ring-purple-500 focus:border-purple-500'
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                } sm:text-sm rounded-md transition-colors duration-200`}
                value={filters.subject}
                onChange={handleFilterChange}
                disabled={filtersLoading}
              >
                <option value="">All Subjects</option>
                {availableFilters.subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="semester" className="sr-only">
                Semester
              </label>
              <select
                id="semester"
                name="semester"
                className={`block w-full pl-3 pr-10 py-2 text-base border ${
                  theme === 'dark'
                    ? 'border-gray-600 bg-gray-700 text-white focus:ring-purple-500 focus:border-purple-500'
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                } sm:text-sm rounded-md transition-colors duration-200`}
                value={filters.semester}
                onChange={handleFilterChange}
                disabled={filtersLoading}
              >
                <option value="">All Semesters</option>
                {availableFilters.semesters.map(semester => (
                  <option key={semester} value={semester}>Semester {semester}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters button */}
            <div className="flex items-end mt-4 md:mt-0 justify-center md:justify-start">
              <button
                type="button"
                onClick={clearFilters}
                className={`inline-flex items-center px-3 py-2 border ${
                  theme === 'dark'
                    ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-purple-500'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500'
                } shadow-sm text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200`}
                disabled={!searchTerm && !filters.department && !filters.semester && !filters.subject}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} transition-colors duration-200`}>
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
  const { theme } = useTheme();
  const [allNotes, setAllNotes] = useState([]); // Store all fetched notes
  const [filteredNotes, setFilteredNotes] = useState([]); // Store filtered notes
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // Load all favorite notes (only once at start)
  const loadFavorites = async (page = 1) => {
    try {
      setLoading(true);
      
      const token = await getIdToken();
      
      // Build query params for pagination
      const queryParams = new URLSearchParams({
        page,
        limit: 100 // Load more notes at once to enable client-side filtering
      });
      
      const response = await fetch(`/api/notes/favorites?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorite notes');
      }
      
      const result = await response.json();
      
      setAllNotes(result.notes);
      setFilteredNotes(result.notes);
      setNotes(result.notes.slice(0, 10)); // Initial display limited to 10 items
      setPagination({
        total: result.notes.length,
        page: 1,
        limit: 10,
        totalPages: Math.ceil(result.notes.length / 10)
      });
    } catch (err) {
      setError(err.message || 'Error loading favorite notes');
    } finally {
      setLoading(false);
    }
  };

  // Filter notes locally based on filter criteria
  const filterNotes = () => {
    let filtered = [...allNotes];
    
    if (filters.department) {
      filtered = filtered.filter(note => note.department === filters.department);
    }
    
    if (filters.semester) {
      filtered = filtered.filter(note => note.semester === filters.semester);
    }
    
    if (filters.subject) {
      filtered = filtered.filter(note => note.subject === filters.subject);
    }
    
    if (filters.classs) {
      filtered = filtered.filter(note => note.class === filters.classs);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchTerm) || 
        (note.description && note.description.toLowerCase().includes(searchTerm)) || 
        note.subject.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredNotes(filtered);
    
    // Update pagination
    const totalPages = Math.ceil(filtered.length / pagination.limit);
    const currentPage = pagination.page > totalPages ? 1 : pagination.page;
    
    setPagination(prev => ({
      ...prev,
      total: filtered.length,
      page: currentPage,
      totalPages
    }));
    
    // Update displayed notes
    const startIndex = (currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    setNotes(filtered.slice(startIndex, endIndex));
  };
  
  // Use debounce to prevent too frequent filtering
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      filterNotes();
    }, 300); // 300ms debounce time
    
    return () => clearTimeout(debounceTimeout);
  }, [filters]); // Run when filters change

  // Initial load - only once
  useEffect(() => {
    loadFavorites();
  }, []); // Empty dependency array = run once on mount

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    
    // Update page in pagination state
    setPagination(prev => ({
      ...prev,
      page
    }));
    
    // Update displayed notes based on page
    const startIndex = (page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    setNotes(filteredNotes.slice(startIndex, endIndex));
  };

  if (loading && notes.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${theme === 'dark' ? 'border-purple-500' : 'border-indigo-600'} transition-colors duration-200`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${theme === 'dark' ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-100 border-red-500 text-red-700'} border-l-4 p-4 my-4 transition-colors duration-200`}>
        <p>{error}</p>
      </div>
    );
  }

  if (filteredNotes.length === 0) {
    return (
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 text-center transition-colors duration-200`}>
      <svg className={`w-16 h-16 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-200`}>You haven&apos;t favorited any notes yet.</p>
      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1 transition-colors duration-200`}>Browse all notes and star your favorites to see them here.</p>
      </div>
    );
  }

  // Reuse NoteList component to display notes
  return <NoteList notes={notes} pagination={pagination} onPageChange={handlePageChange} />;
}

// Wrap the component with role protection, allowing only students, faculty, and HOD access
export default withRoleProtection(StudentNotesPage, ['student', 'faculty', 'hod']);
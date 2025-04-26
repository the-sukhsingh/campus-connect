import React, { useState, useEffect, useCallback, useRef } from 'react';
import debounce from 'lodash/debounce';
import { useTheme } from '../context/ThemeContext';

const BookSearch = ({
  onSearch,
  genres,
  isLoading = false,
  defaultQuery = '',
  defaultField = 'all',
  defaultGenre = '',
  showGenreFilter = false
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState(defaultQuery);
  const [searchField, setSearchField] = useState(defaultField);
  const [selectedGenre, setSelectedGenre] = useState(defaultGenre);
  const [displaySearchQuery, setDisplaySearchQuery] = useState(defaultQuery);
  
  // Use a ref to hold the debounced function
  const debouncedSearchRef = useRef(null);
  
  // Create a stable search handler
  const handleSearch = useCallback((query, field, genre) => {
    onSearch(query, field, genre);
  }, [onSearch]);
  
  // Create the debounced function only once
  useEffect(() => {
    debouncedSearchRef.current = debounce((query, field, genre) => {
      handleSearch(query, field, genre);
    }, 500);
    
    // Cleanup on unmount
    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, [handleSearch]);

  // Handler for input changes with debouncing
  const handleInputChange = (e) => {
    const query = e.target.value;
    // Update display value immediately for UI responsiveness
    setDisplaySearchQuery(query);
    setSearchQuery(query);
    
    // Use the debounced function to trigger actual search after delay
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(query, searchField, selectedGenre);
    }
  };
  
  // Handle field changes
  const handleFieldChange = (e) => {
    const field = e.target.value;
    setSearchField(field);
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(searchQuery, field, selectedGenre);
    }
  };
  
  // Handle genre changes
  const handleGenreChange = (e) => {
    const genre = e.target.value;
    setSelectedGenre(genre);
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(searchQuery, searchField, genre);
    }
  };

  // Update state when props change
  useEffect(() => {
    setSearchQuery(defaultQuery);
    setDisplaySearchQuery(defaultQuery);
    setSearchField(defaultField);
    setSelectedGenre(defaultGenre);
  }, [defaultQuery, defaultField, defaultGenre]);

  const handleReset = () => {
    setSearchQuery('');
    setDisplaySearchQuery('');
    setSearchField('all');
    setSelectedGenre('');
    
    // Trigger search with reset values
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current('', 'all', '');
    }
  };

  const themeStyles = {
    container: `${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-4 rounded-lg shadow-md transition-colors duration-200`,
    label: `block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-1`,
    input: `w-full px-3 py-2 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`,
    select: `w-full px-3 py-2 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`,
    resetButton: `px-4 py-2 rounded-md ${theme === 'dark' ? 'text-gray-200 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-200 hover:bg-gray-300'} focus:outline-none transition-colors duration-200`
  };

  return (
    <div className={themeStyles.container}>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="searchQuery" className={themeStyles.label}>
            Search
          </label>
          <input
            type="text"
            id="searchQuery"
            value={displaySearchQuery}
            onChange={handleInputChange}
            placeholder="Type to search books..."
            className={themeStyles.input}
          />
        </div>
        
        <div className="md:w-40">
          <label htmlFor="searchField" className={themeStyles.label}>
            Search By
          </label>
          <select
            id="searchField"
            value={searchField}
            onChange={handleFieldChange}
            className={themeStyles.select}
          >
            <option value="all">All Fields</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
          </select>
        </div>
        
        {showGenreFilter && (
          <div className="md:w-48">
            <label htmlFor="genre" className={themeStyles.label}>
              Genre
            </label>
            <select
              id="genre"
              value={selectedGenre}
              onChange={handleGenreChange}
              className={themeStyles.select}
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading || (!searchQuery && !selectedGenre && searchField === 'all')}
            className={`${themeStyles.resetButton} ${
              isLoading || (!searchQuery && !selectedGenre && searchField === 'all')
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookSearch;

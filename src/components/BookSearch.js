import React, { useState, useEffect, useCallback } from 'react';
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
  
  // Create a debounced version of onSearch
  const debouncedSearch = useCallback(
    debounce((query, field, genre) => {
      onSearch(query, field, genre);
    }, 300),
    [onSearch]
  );

  // Trigger search on input changes
  useEffect(() => {
    debouncedSearch(searchQuery, searchField, selectedGenre);
    return () => debouncedSearch.cancel();
  }, [searchQuery, searchField, selectedGenre, debouncedSearch]);

  // Update state when props change
  useEffect(() => {
    setSearchQuery(defaultQuery);
    setSearchField(defaultField);
    setSelectedGenre(defaultGenre);
  }, [defaultQuery, defaultField, defaultGenre]);

  const handleReset = () => {
    setSearchQuery('');
    setSearchField('all');
    setSelectedGenre('');
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            onChange={(e) => setSearchField(e.target.value)}
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
              onChange={(e) => setSelectedGenre(e.target.value)}
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

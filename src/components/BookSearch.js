import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';

const BookSearch = ({
  onSearch,
  genres,
  isLoading = false,
  defaultQuery = '',
  defaultField = 'all',
  defaultGenre = '',
  showGenreFilter = false
}) => {
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

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            id="searchQuery"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type to search books..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="md:w-40">
          <label htmlFor="searchField" className="block text-sm font-medium text-gray-700 mb-1">
            Search By
          </label>
          <select
            id="searchField"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Fields</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
          </select>
        </div>
        
        {showGenreFilter && (
          <div className="md:w-48">
            <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">
              Genre
            </label>
            <select
              id="genre"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
            className={`px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none ${
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

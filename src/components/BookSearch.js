import React, { useState, useEffect } from 'react';



const BookSearch= ({
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
  
  // Update state when props change
  useEffect(() => {
    setSearchQuery(defaultQuery);
    setSearchField(defaultField);
    setSelectedGenre(defaultGenre);
  }, [defaultQuery, defaultField, defaultGenre]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery, searchField, selectedGenre);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearchField('all');
    setSelectedGenre('');
    onSearch('', 'all', '');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <form onSubmit={handleSubmit}>
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
              placeholder="Search books..."
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
          
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            
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
      </form>
    </div>
  );
};

export default BookSearch;

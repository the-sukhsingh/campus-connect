'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import BookSearch from '@/components/BookSearch';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

function BooksManagementPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genres, setGenres] = useState([]);

  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentBook, setCurrentBook] = useState(null);
  const [multipleBooks, setMultipleBooks] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    copies: 1,
    ISBN: '',
    description: '',
    publishedYear: undefined,
    sendNotification: false
  });

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Function to generate sample CSV content
  const generateSampleCSV = () => {
    const headers = ['Title', 'Author', 'Genre', 'Copies', 'ISBN', 'Description', 'PublishedYear'];
    const sampleData = [
      ['The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', '2', '9780743273565', 'A novel about American society', '1925'],
      ['1984', 'George Orwell', 'Science Fiction', '3', '9780451524935', 'A dystopian novel', '1949']
    ];

    const csv = Papa.unparse({
      fields: headers,
      data: sampleData
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sample_books_import.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Function to parse CSV/Excel file
  const parseFile = async (file) => {
    const fileType = file.name.split('.').pop().toLowerCase();
    
    try {
      if (fileType === 'csv') {
        return new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length > 0) {
                reject(results.errors[0].message);
                return;
              }
              resolve(results.data);
            },
            error: (error) => reject(error.message)
          });
        });
      } else if (['xlsx', 'xls'].includes(fileType)) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        return XLSX.utils.sheet_to_json(worksheet);
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }
    } catch (error) {
      throw new Error(`Error parsing file: ${error.message}`);
    }
  };

  // Handle file drop
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      try {
        const parsedData = await parseFile(files[0]);
        
        // Validate and transform the data
        const transformedBooks = parsedData.map(row => ({
          title: row.Title || row.title,
          author: row.Author || row.author,
          genre: row.Genre || row.genre,
          copies: parseInt(row.Copies || row.copies) || 1,
          ISBN: row.ISBN || row.isbn || '',
          description: row.Description || row.description || '',
          publishedYear: parseInt(row.PublishedYear || row.publishedYear) || undefined,
          sendNotification: false
        })).filter(book => book.title && book.author && book.genre);

        if (transformedBooks.length === 0) {
          throw new Error('No valid books found in the file. Please check the format.');
        }

        setMultipleBooks(transformedBooks);
      } catch (error) {
        setError(error.message);
      }
    }
  };

  // Add a new book to the multiple books array
  const addNewBookToList = () => {
    if (!formData.title || !formData.author || !formData.genre) {
      setError('Please fill in all required fields for the current book.');
      return;
    }
    setMultipleBooks([...multipleBooks, { ...formData }]);
    setFormData({
      title: '',
      author: '',
      genre: '',
      copies: 1,
      ISBN: '',
      description: '',
      publishedYear: undefined,
      sendNotification: false
    });
  };

  // Remove a book from the multiple books array
  const removeBookFromList = (index) => {
    setMultipleBooks(multipleBooks.filter((_, i) => i !== index));
  };

  // Client-side search and filter
  const filterBooks = useCallback((query, field, genre) => {
    if (!books) return;
    
    let filtered = [...books];
    
    if (query) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(book => {
        if (field === 'title') return book.title.toLowerCase().includes(searchLower);
        if (field === 'author') return book.author.toLowerCase().includes(searchLower);
        // All fields
        return (
          book.title.toLowerCase().includes(searchLower) ||
          book.author.toLowerCase().includes(searchLower) ||
          (book.ISBN && book.ISBN.toLowerCase().includes(searchLower)) ||
          (book.uniqueCode && book.uniqueCode.toLowerCase().includes(searchLower))
        );
      });
    }
    
    if (genre) {
      filtered = filtered.filter(book => book.genre === genre);
    }
    
    setFilteredBooks(filtered);
    setTotalBooks(filtered.length);
    setTotalPages(Math.ceil(filtered.length / 10));
  }, [books]);

  // Handle search parameters change
  const handleSearch = (query, field, genre) => {
    setSearchQuery(query);
    setSearchField(field);
    setSelectedGenre(genre);
    setCurrentPage(1);
    filterBooks(query, field, genre);
  };

  // Fetch all books initially
  const fetchBooks = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const response = await fetch(`/api/library/books?action=get-books&uid=${user?.uid}`);

      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }

      const data = await response.json();
      setBooks(data.books || []);
      setFilteredBooks(data.books || []);
      setTotalBooks(data.books?.length || 0);
      setTotalPages(Math.ceil((data.books?.length || 0) / 10));
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load books. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch genres from API
  const fetchGenres = async () => {
    try {
      const response = await fetch(
        `/api/library/books?action=get-genres&uid=${user?.uid}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch genres');
      }

      const data = await response.json();
      setGenres(data.genres || []);
    } catch (err) {
      console.error('Error fetching genres:', err);
    }
  };

  // Fetch books and genres when component mounts
  useEffect(() => {
    if (!user) return;
    fetchBooks();
    fetchGenres();
  }, [user]);

  // Get paginated books for current view
  const getPaginatedBooks = useCallback(() => {
    const start = (currentPage - 1) * 10;
    const end = start + 10;
    return filteredBooks.slice(start, end);
  }, [filteredBooks, currentPage]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Handle numeric inputs
    if (name === 'copies' || name === 'publishedYear') {
      setFormData({
        ...formData,
        [name]: value === '' ? undefined : parseInt(value, 10)
      });
    } else if (name === 'sendNotification') {
      setFormData({
        ...formData,
        [name]: e.target.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Open add modal
  const openAddModal = () => {
    setCurrentBook(null);
    setFormData({
      title: '',
      author: '',
      genre: '',
      copies: 1,
      ISBN: '',
      description: '',
      publishedYear: undefined,
      sendNotification: false
    });
    setShowAddEditModal(true);
  };

  // Open edit modal
  const openEditModal = (book) => {
    setCurrentBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      genre: book.genre,
      copies: book.copies,
      ISBN: book.ISBN || '',
      description: book.description || '',
      publishedYear: book.publishedYear,
      sendNotification: false
    });
    setShowAddEditModal(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (book) => {
    setCurrentBook(book);
    setShowDeleteModal(true);
  };

  // Modified form submission to handle multiple books
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!user) return;

    // Check if we have books in multipleBooks array or if form data is valid
    if (multipleBooks.length === 0 && (!formData.title || !formData.author || !formData.genre)) {
      setError('Please fill in all required fields or upload a file with books.');
      return;
    }

    // If there are books in the form data and books in multipleBooks, add current form to the list
    if (multipleBooks.length > 0 && formData.title && formData.author && formData.genre) {
      multipleBooks.push({ ...formData });
    }

    const booksToSubmit = multipleBooks.length > 0 ? 
      multipleBooks : 
      [formData];

    if (currentBook) {
      // Handle single book edit
      try {
        setIsLoading(true);
        const response = await fetch('/api/library/books', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: user?.uid,
            bookId: currentBook._id,
            bookData: formData,
            action: 'update-book',
            collegeId: user?.collegeId,
          }),
        });

        if (!response.ok) throw new Error('Failed to update book');

        await fetchBooks();
        setShowAddEditModal(false);
        setError('');
      } catch (err) {
        console.error('Error updating book:', err);
        setError('Failed to update book. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle multiple books addition
      try {
        setIsLoading(true);
        const response = await fetch('/api/library/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: user?.uid,
            books: booksToSubmit,
            action: 'add-books',
            collegeId: user?.collegeId,
          }),
        });

        if (!response.ok) throw new Error('Failed to add books');

        await fetchBooks();
        setShowAddEditModal(false);
        setMultipleBooks([]);
        setError('');
      } catch (err) {
        console.error('Error adding books:', err);
        setError('Failed to add books. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle book deletion
  const handleDeleteBook = async () => {
    if (!user || !currentBook) return;

    try {
      setIsLoading(true);

      const response = await fetch('/api/library/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          bookId: currentBook._id,
          action: 'delete-book'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete book');
      }

      // Refresh the book list
      await fetchBooks();

      // Close the modal
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting book:', err);
      setError('Failed to delete book. Please try again later.');
    } finally {
      setIsLoading(false);
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
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Books Management</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Add, update, or delete books in the library</p>
        </div>
        <div>
          <button
            onClick={generateSampleCSV}
            className={`inline-flex items-center px-4 py-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download Sample CSV
          </button>
        </div>
      </div>

      {error && (
        <div className={`bg-red-100 border-l-4 ${theme === 'dark' ? 'border-red-700 text-red-200' : 'border-red-500 text-red-700'} p-4 mb-6`} role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="mb-6">
        <BookSearch 
          onSearch={handleSearch}
          genres={genres}
          isLoading={isLoading}
          defaultField={searchField}
          defaultQuery={searchQuery}
          defaultGenre={selectedGenre}
          showGenreFilter={true}
        />
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={openAddModal}
          className={`bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Book
        </button>
      </div>

      {/* Books Table */}
      <div className={`rounded-lg shadow-md overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-indigo-500' : 'border-indigo-500'}`}></div>
          </div>
        ) : getPaginatedBooks().length === 0 ? (
          <div className="p-8 text-center">
            <p className={`text-gray-500 ${theme === 'dark' ? 'text-gray-400' : ''}`}>No books found. Add a new book to get started.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={`${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Author
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Genre
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Copies
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Available
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Added On
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Unique Code
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                  {getPaginatedBooks().map((book, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{book.title}</div>
                        {book.ISBN && (
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ISBN: {book.ISBN}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{book.author}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                          {book.genre}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {book.copies}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          book.availableCopies > 0
                            ? `${theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`
                            : `${theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`
                        }`}>
                          {book.availableCopies}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(book.createdAt)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {book.uniqueCode || 'N/A'} 
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-evenly gap-3">
                          <Link 
                            href={`/dashboard/librarian/lend?uniqueCode=${book.uniqueCode}&bookId=${book._id}`}
                            className={`text-green-600 hover:text-green-900 ${theme === 'dark' ? 'text-green-400 hover:text-green-300' : ''}`}
                          >
                            Lend
                          </Link>
                          <button
                            onClick={() => openEditModal(book)}
                            className={`text-indigo-600 hover:text-indigo-900 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : ''}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(book)}
                            className={`text-red-600 hover:text-red-900 ${theme === 'dark' ? 'text-red-400 hover:text-red-300' : ''}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`px-6 py-3 flex items-center justify-between border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? `${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}`
                        : `${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? `${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}`
                        : `${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                      Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * 10, totalBooks)}
                      </span>{' '}
                      of <span className="font-medium">{totalBooks}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                          currentPage === 1
                            ? `${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}`
                            : `${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? `${theme === 'dark' ? 'z-10 bg-indigo-900 border-indigo-500 text-indigo-300' : 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'}`
                                : `${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                          currentPage === totalPages
                            ? `${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}`
                            : `${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Book Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-gray-600/40 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-700 bg-gradient-to-r from-indigo-900 to-purple-900' : 'border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
              <h3 className={`text-xl font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-white'}`}>
                {currentBook ? 'Edit Book' : 'Add New Books'}
              </h3>
              {!currentBook && (
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-white'}`}>
                  {multipleBooks.length} books added
                </span>
              )}
            </div>
            
            <div 
              className={`p-6 border-2 border-dashed rounded-lg m-6 transition-all ${
                dragActive ? `${theme === 'dark' ? 'border-indigo-500 bg-indigo-900' : 'border-indigo-500 bg-indigo-50'}` : `${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center p-4">
                <svg className={`mx-auto h-12 w-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Drag and drop CSV/Excel file or fill the form below
                </p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg shadow-sm border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <label htmlFor="title" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder="Enter book title"
                    />
                  </div>

                  <div className={`p-4 rounded-lg shadow-sm border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <label htmlFor="author" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Author <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder="Enter author name"
                    />
                  </div>

                  <div className={`p-4 rounded-lg shadow-sm border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <label htmlFor="genre" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Genre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="genre"
                      name="genre"
                      value={formData.genre}
                      onChange={handleInputChange}
                      required
                      list="genre-suggestions"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder="Select or enter genre"
                    />
                    <datalist id="genre-suggestions">
                      {genres.map((genre) => (
                        <option key={genre} value={genre} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className={`p-4 rounded-lg shadow-sm border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <label htmlFor="copies" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Number of Copies <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="copies"
                      name="copies"
                      value={formData.copies}
                      onChange={handleInputChange}
                      min="1"
                      required
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>

                  <div className={`p-4 rounded-lg shadow-sm border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <label htmlFor="ISBN" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      ISBN
                    </label>
                    <input
                      type="text"
                      id="ISBN"
                      name="ISBN"
                      value={formData.ISBN}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder="Enter ISBN (optional)"
                    />
                  </div>

                  <div className={`p-4 rounded-lg shadow-sm border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <label htmlFor="publishedYear" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Published Year
                    </label>
                    <input
                      type="number"
                      id="publishedYear"
                      name="publishedYear"
                      value={formData.publishedYear || ''}
                      onChange={handleInputChange}
                      min="1000"
                      max={new Date().getFullYear()}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder="Enter year (optional)"
                    />
                  </div>
                </div>

                <div className="col-span-full">
                  <div className={`p-4 rounded-lg shadow-sm border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <label htmlFor="description" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder="Enter book description (optional)"
                    />
                  </div>
                </div>

                <div className="col-span-full">
                  <div className={`p-4 rounded-lg shadow-sm border flex items-center ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <input
                      type="checkbox"
                      id="sendNotification"
                      name="sendNotification"
                      checked={formData.sendNotification}
                      onChange={handleInputChange}
                      className={`h-4 w-4 rounded focus:ring-indigo-500 ${theme === 'dark' ? 'text-indigo-400 border-gray-600' : 'text-indigo-600 border-gray-300'}`}
                    />
                    <label htmlFor="sendNotification" className={`ml-2 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Send notification to library members about new books
                    </label>
                  </div>
                </div>
              </div>

              {!currentBook && (
                <div className="px-6">
                  <button
                    type="button"
                    onClick={addNewBookToList}
                    className={`w-full px-4 py-2 rounded-md hover:bg-indigo-200 transition-colors flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-900 text-indigo-300 hover:bg-indigo-800' : 'bg-indigo-100 text-indigo-700'}`}
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Another Book
                  </button>
                </div>
              )}

              {/* Multiple Books List */}
              {!currentBook && multipleBooks.length > 0 && (
                <div className="px-6">
                  <h4 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Books to Add ({multipleBooks.length})</h4>
                  <div className="space-y-3">
                    {multipleBooks.map((book, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex-1">
                          <h5 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{book.title}</h5>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>by {book.author} • {book.genre}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBookFromList(index)}
                          className={`text-red-600 hover:text-red-800 ${theme === 'dark' ? 'text-red-400 hover:text-red-300' : ''}`}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className={`px-6 py-4 flex justify-end space-x-3 rounded-b-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddEditModal(false);
                    setMultipleBooks([]);
                  }}
                  className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none ${theme === 'dark' ? 'text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700' : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || (!currentBook && multipleBooks.length === 0 && !formData.title)}
                  className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none ${theme === 'dark' ? 'text-gray-100 bg-gradient-to-r from-indigo-900 to-purple-900 hover:from-indigo-800 hover:to-purple-800' : 'text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'} ${
                    (isLoading || (!currentBook && multipleBooks.length === 0 && !formData.title)) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className={`animate-spin -ml-1 mr-2 h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : currentBook ? 'Update Book' : (multipleBooks.length > 0 ? `Add ${multipleBooks.length + (formData.title ? 1 : 0)} Books` : 'Add Book')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentBook && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-xl max-w-md w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Delete Book</h3>
            </div>
            
            <div className="px-6 py-4">
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Are you sure you want to delete <span className="font-semibold">{currentBook.title}</span>? This action cannot be undone.
              </p>
            </div>
            
            <div className={`px-6 py-4 flex justify-end space-x-3 rounded-b-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none ${theme === 'dark' ? 'text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700' : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBook}
                disabled={isLoading}
                className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none ${theme === 'dark' ? 'text-gray-100 bg-red-900 hover:bg-red-800' : 'text-white bg-red-600 hover:bg-red-700'} ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className={`animate-spin -ml-1 mr-2 h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  'Delete Book'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap the component with role protection, allowing admin and librarian access
export default withRoleProtection(BooksManagementPage, ['hod', 'librarian']);
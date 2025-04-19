'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


function LendBookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('quick');
  const [loading, setLoading] = useState(false);
  const [uniqueCodeSearch, setUniqueCodeSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [foundBook, setFoundBook] = useState(null);
  const [foundStudent, setFoundStudent] = useState(null);
  const [isSearchingBook, setIsSearchingBook] = useState(false);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [showStudentResults, setShowStudentResults] = useState(false);
  
  // Advanced search
  const [advSearchTerm, setAdvSearchTerm] = useState('');
  const [advSearchType, setAdvSearchType] = useState('book');
  const [advSelectedBook, setAdvSelectedBook] = useState(null);
  const [advSelectedStudent, setAdvSelectedStudent] = useState(null);
  const [advSearchResults, setAdvSearchResults] = useState([]);
  const [isAdvSearching, setIsAdvSearching] = useState(false);
  
  // Set default due date (14 days from now) when component mounts
  useEffect(() => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
  }, []);
  
  // Quick search - Find book by unique code
  const handleBookSearch = async () => {
    if (!uniqueCodeSearch.trim() || !user) {
      setError('Please enter a valid book code');
      return;
    }

    setError('');
    setFoundBook(null);
    setIsSearchingBook(true);
    
    try {
      const response = await fetch(
        `/api/library/books?action=get-book-by-code&uid=${user?.uid}&uniqueCode=${uniqueCodeSearch.trim()}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to find book');
      }
      
      const data = await response.json();
      
      if (data.book && data.book.availableCopies > 0) {
        setFoundBook(data.book);
      } else if (data.book && data.book.availableCopies <= 0) {
        setError('This book is not available for lending (0 copies available)');
      } else {
        setError('Book with this code was not found');
      }
    } catch (err) {
      console.error('Error searching for book:', err);
      setError(err.message || 'Failed to search for book');
    } finally {
      setIsSearchingBook(false);
    }
  };
  
  // Quick search - Find student
  const handleStudentSearch = async () => {
    if (!studentSearch.trim() || !user) {
      setError('Please enter student name, email or roll number');
      return;
    }

    setError('');
    setFoundStudent(null);
    setStudentResults([]);
    setIsSearchingStudent(true);
    setShowStudentResults(true);
    
    try {
      const response = await fetch(
        `/api/user/search?uid=${user?.uid}&query=${encodeURIComponent(studentSearch.trim())}&role=student`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search students');
      }
      
      const data = await response.json();
      
      if (data.users && data.users.length > 0) {
        setStudentResults(data.users);
        if (data.users.length === 1) {
          // Auto-select if only one student found
          setFoundStudent(data.users[0]);
        }
      } else {
        setError('No students found matching your search');
      }
    } catch (err) {
      console.error('Error searching for student:', err);
      setError(err.message || 'Failed to search for student');
    } finally {
      setIsSearchingStudent(false);
    }
  };
  
  // Select a student from the results
  const handleSelectStudent = (student) => {
    setFoundStudent(student);
    setShowStudentResults(false);
  };
  
  // Advanced search
  const handleAdvancedSearch = async () => {
    if (!advSearchTerm.trim() || !user) {
      setError('Please enter a search term');
      return;
    }

    setError('');
    setIsAdvSearching(true);
    
    try {
      if (advSearchType === 'book') {
        // Search for books
        const response = await fetch(
          `/api/library/books?action=get-books&uid=${user?.uid}&query=${encodeURIComponent(advSearchTerm)}&searchField=all`
        );
        
        if (!response.ok) {
          throw new Error('Failed to search books');
        }
        
        const data = await response.json();
        setAdvSearchResults(data.books || []);
      } else {
        // Search for students
        const response = await fetch(
          `/api/user/search?uid=${user?.uid}&query=${encodeURIComponent(advSearchTerm)}&role=student`
        );
        
        if (!response.ok) {
          throw new Error('Failed to search students');
        }
        
        const data = await response.json();
        setAdvSearchResults(data.users || []);
      }
    } catch (err) {
      console.error(`Error searching ${advSearchType}:`, err);
      setError(`Failed to search ${advSearchType}. Please try again.`);
    } finally {
      setIsAdvSearching(false);
    }
  };
  
  // Select book in advanced search
  const handleAdvSelectBook = (book) => {
    setAdvSelectedBook(book);
    setAdvSearchResults([]);
    setAdvSearchTerm('');
    setAdvSearchType('student');
  };
  
  // Select student in advanced search
  const handleAdvSelectStudent = (student) => {
    setAdvSelectedStudent(student);
    setAdvSearchResults([]);
    setAdvSearchTerm('');
  };
  
  // Handle lending book (quick method)
  const handleQuickLendBook = async () => {
    if (!user || !foundBook || !foundStudent || !dueDate) {
      setError('Please select both a book and a student, and set a due date');
      return;
    }
    
    if (foundBook.availableCopies <= 0) {
      setError('This book is not available for lending');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/library/borrowings/lend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          bookId: foundBook._id,
          studentId: foundStudent._id,
          dueDate: new Date(dueDate).toISOString()
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to lend book');
      }
      
      const data = await response.json();
      
      setSuccess(`Book "${foundBook.title}" has been successfully lent to ${foundStudent.displayName}!`);
      
      // Reset form
      setFoundBook(null);
      setFoundStudent(null);
      setUniqueCodeSearch('');
      setStudentSearch('');
      setStudentResults([]);
      
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 14);
      setDueDate(defaultDueDate.toISOString().split('T')[0]);
      
    } catch (err) {
      console.error('Error lending book:', err);
      setError(err.message || 'Failed to lend book. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle lending book (advanced method)
  const handleAdvancedLendBook = async () => {
    if (!user || !advSelectedBook || !advSelectedStudent || !dueDate) {
      setError('Please select both a book and a student, and set a due date');
      return;
    }
    
    if (advSelectedBook.availableCopies <= 0) {
      setError('This book is not available for lending');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/library/borrowings/lend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          bookId: advSelectedBook._id,
          studentId: advSelectedStudent._id,
          dueDate: new Date(dueDate).toISOString()
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to lend book');
      }
      
      const data = await response.json();
      
      setSuccess(`Book "${advSelectedBook.title}" has been successfully lent to ${advSelectedStudent.displayName}!`);
      
      // Reset form
      setAdvSelectedBook(null);
      setAdvSelectedStudent(null);
      setAdvSearchTerm('');
      setAdvSearchType('book');
      
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 14);
      setDueDate(defaultDueDate.toISOString().split('T')[0]);
      
    } catch (err) {
      console.error('Error lending book:', err);
      setError(err.message || 'Failed to lend book. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset the form
  const handleReset = () => {
    setFoundBook(null);
    setFoundStudent(null);
    setUniqueCodeSearch('');
    setStudentSearch('');
    setStudentResults([]);
    setAdvSelectedBook(null);
    setAdvSelectedStudent(null);
    setAdvSearchResults([]);
    setAdvSearchTerm('');
    setAdvSearchType('book');
    setError('');
    setSuccess('');
    
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lend Books to Students</h1>
          <p className="text-gray-600 mt-1">Issue books to students quickly and efficiently</p>
        </div>
        <Link
          href="/dashboard/librarian"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Success!</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs for Quick vs Advanced Lending */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('quick')}
            className={`py-3 px-6 text-sm font-medium ${
              activeTab === 'quick'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Quick Lending (by Code)
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`py-3 px-6 text-sm font-medium ${
              activeTab === 'advanced'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Advanced Search
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'quick' ? (
            /* Quick Lending UI */
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-4">Step 1: Find Book by Unique Code</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="grow">
                    <div className="relative">
                      <input
                        type="text"
                        value={uniqueCodeSearch}
                        onChange={(e) => setUniqueCodeSearch(e.target.value.toUpperCase())}
                        placeholder="Enter the book's unique code"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleBookSearch();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleBookSearch}
                    disabled={isSearchingBook || !uniqueCodeSearch.trim()}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${
                      isSearchingBook || !uniqueCodeSearch.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSearchingBook ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </span>
                    ) : (
                      'Find Book'
                    )}
                  </button>
                </div>
              </div>
              
              {foundBook && (
                <>
                  <div className="mb-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="text-md font-medium text-green-800 mb-2">✓ Book Found</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm text-gray-700"><span className="font-medium">Title:</span> {foundBook.title}</p>
                          <p className="text-sm text-gray-700"><span className="font-medium">Author:</span> {foundBook.author}</p>
                          <p className="text-sm text-gray-700"><span className="font-medium">Code:</span> {foundBook.uniqueCode}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700"><span className="font-medium">Genre:</span> {foundBook.genre}</p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Availability:</span> 
                            <span className={foundBook.availableCopies > 0 ? 'text-green-600' : 'text-red-600'}>
                              {' '}{foundBook.availableCopies} of {foundBook.copies}
                            </span>
                          </p>
                          {foundBook.ISBN && <p className="text-sm text-gray-700"><span className="font-medium">ISBN:</span> {foundBook.ISBN}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="text-lg font-medium mb-4">Step 2: Find Student</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="grow">
                        <div className="relative">
                          <input
                            type="text"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            placeholder="Search by name, email or roll number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleStudentSearch();
                              }
                            }}
                          />
                          {showStudentResults && studentResults.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border rounded-md max-h-60 overflow-auto">
                              {studentResults.map((student) => (
                                <div
                                  key={student._id}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                                  onClick={() => handleSelectStudent(student)}
                                >
                                  <div className="font-medium">{student.displayName}</div>
                                  <div className="text-xs text-gray-600">{student.email}</div>
                                  {student.rollNo && <div className="text-xs text-gray-600">Roll No: {student.rollNo}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleStudentSearch}
                        disabled={isSearchingStudent || !studentSearch.trim()}
                        className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${
                          isSearchingStudent || !studentSearch.trim() ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSearchingStudent ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Searching...
                          </span>
                        ) : (
                          'Find Student'
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {foundStudent && (
                    <div className="mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="text-md font-medium text-blue-800 mb-2">✓ Student Selected</h3>
                        <div>
                          <p className="text-sm text-gray-700"><span className="font-medium">Name:</span> {foundStudent.displayName}</p>
                          <p className="text-sm text-gray-700"><span className="font-medium">Email:</span> {foundStudent.email}</p>
                          {foundStudent.rollNo && <p className="text-sm text-gray-700"><span className="font-medium">Roll No:</span> {foundStudent.rollNo}</p>}
                          {foundStudent.department && <p className="text-sm text-gray-700"><span className="font-medium">Department:</span> {foundStudent.department}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {foundStudent && (
                    <div className="mb-6">
                      <h2 className="text-lg font-medium mb-4">Step 3: Set Due Date</h2>
                      <div>
                        <input
                          type="date"
                          id="dueDateQuick"
                          name="dueDateQuick"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Default due date is set to 14 days from today.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {foundStudent && (
                    <div className="flex justify-end mt-8">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickLendBook}
                        disabled={loading}
                        className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          'Lend Book to Student'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Advanced Search UI */
            <div>
              {!advSelectedBook || !advSelectedStudent ? (
                <div>
                  <h2 className="text-lg font-medium mb-4">
                    Step {advSelectedBook ? '2: Select a Student' : '1: Select a Book'}
                  </h2>
                  
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    {!advSelectedBook && (
                      <div className="inline-flex items-center">
                        <input
                          type="radio"
                          id="search-book-adv"
                          value="book"
                          checked={advSearchType === 'book'}
                          onChange={() => {
                            setAdvSearchType('book');
                            setAdvSearchResults([]);
                            setAdvSearchTerm('');
                          }}
                          className="h-4 w-4 text-indigo-600 border-gray-300"
                        />
                        <label htmlFor="search-book-adv" className="ml-2 text-gray-700">
                          Search for Book
                        </label>
                      </div>
                    )}
                    
                    {!advSelectedStudent && advSelectedBook && (
                      <div className="inline-flex items-center">
                        <input
                          type="radio"
                          id="search-student-adv"
                          value="student"
                          checked={advSearchType === 'student'}
                          onChange={() => {
                            setAdvSearchType('student');
                            setAdvSearchResults([]);
                            setAdvSearchTerm('');
                          }}
                          className="h-4 w-4 text-indigo-600 border-gray-300"
                        />
                        <label htmlFor="search-student-adv" className="ml-2 text-gray-700">
                          Search for Student
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="grow">
                      <input
                        type="text"
                        value={advSearchTerm}
                        onChange={(e) => setAdvSearchTerm(e.target.value)}
                        placeholder={
                          advSearchType === 'book'
                            ? "Search for books by title, author, or ISBN"
                            : "Search for students by name, email, or roll number"
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAdvancedSearch();
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={handleAdvancedSearch}
                      disabled={isAdvSearching || !advSearchTerm.trim()}
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${
                        isAdvSearching || !advSearchTerm.trim() ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isAdvSearching ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Searching...
                        </span>
                      ) : (
                        'Search'
                      )}
                    </button>
                  </div>

                  {/* Advanced Search Results */}
                  {advSearchResults.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-md font-medium mb-2">
                        Search Results ({advSearchResults.length})
                      </h3>
                      
                      <div className="bg-gray-50 border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                {advSearchType === 'book' ? (
                                  <>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Title
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Author
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Code
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Available
                                    </th>
                                  </>
                                ) : (
                                  <>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Email/Roll No
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Department
                                    </th>
                                  </>
                                )}
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {advSearchResults.map((result) => (
                                <tr key={result._id}>
                                  {advSearchType === 'book' ? (
                                    <>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{result.title}</div>
                                        {result.ISBN && (
                                          <div className="text-xs text-gray-500">ISBN: {result.ISBN}</div>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {result.author}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {result.uniqueCode || 'N/A'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          result.availableCopies > 0
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {result.availableCopies} / {result.copies}
                                        </span>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{result.displayName}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{result.email}</div>
                                        {result.rollNo && (
                                          <div className="text-xs text-gray-500">Roll No: {result.rollNo}</div>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {result.department || 'N/A'}
                                      </td>
                                    </>
                                  )}
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                      onClick={() => {
                                        if (advSearchType === 'book') {
                                          if (result.availableCopies <= 0) {
                                            setError('This book is not available for lending');
                                            return;
                                          }
                                          handleAdvSelectBook(result);
                                        } else {
                                          handleAdvSelectStudent(result);
                                        }
                                      }}
                                      disabled={advSearchType === 'book' && result.availableCopies <= 0}
                                      className={`text-indigo-600 hover:text-indigo-900 ${
                                        advSearchType === 'book' && result.availableCopies <= 0
                                          ? 'opacity-50 cursor-not-allowed'
                                          : ''
                                      }`}
                                    >
                                      Select
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Step 3: Review and Submit
                <div>
                  <h2 className="text-lg font-medium mb-4">Step 3: Review and Confirm</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h3 className="text-md font-medium mb-2">Book Details</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Title:</span> {advSelectedBook.title}</p>
                        <p><span className="font-medium">Author:</span> {advSelectedBook.author}</p>
                        <p><span className="font-medium">Genre:</span> {advSelectedBook.genre}</p>
                        <p><span className="font-medium">Available Copies:</span> {advSelectedBook.availableCopies} / {advSelectedBook.copies}</p>
                        {advSelectedBook.ISBN && <p><span className="font-medium">ISBN:</span> {advSelectedBook.ISBN}</p>}
                        {advSelectedBook.uniqueCode && <p><span className="font-medium">Unique Code:</span> {advSelectedBook.uniqueCode}</p>}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h3 className="text-md font-medium mb-2">Student Details</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Name:</span> {advSelectedStudent.displayName}</p>
                        <p><span className="font-medium">Email:</span> {advSelectedStudent.email}</p>
                        {advSelectedStudent.rollNo && <p><span className="font-medium">Roll No:</span> {advSelectedStudent.rollNo}</p>}
                        <p><span className="font-medium">Department:</span> {advSelectedStudent.department || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Default due date is set to 14 days from today.
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAdvancedLendBook}
                      disabled={loading}
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        'Lend Book'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Helpful Information Box */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md shadow-sm mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <span className="font-bold">Quick Lending</span> allows you to quickly issue books using their unique codes. 
              <span className="font-bold"> Advanced Search</span> provides more detailed search capabilities.
            </p>
          </div>
        </div>
      </div>
      
      {/* Quick Links and Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-900 mb-2">Managing Books</h3>
          <p className="text-gray-600 mb-3 text-sm">Need to add new books or update existing ones?</p>
          <Link 
            href="/dashboard/librarian/books"
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Go to Books Management
            <svg className="ml-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-900 mb-2">Return Requests</h3>
          <p className="text-gray-600 mb-3 text-sm">View and process book return requests from students.</p>
          <Link 
            href="/dashboard/librarian/returns"
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Manage Returns
            <svg className="ml-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Wrap with role protection
export default withRoleProtection(LendBookPage, ['librarian', 'hod']);
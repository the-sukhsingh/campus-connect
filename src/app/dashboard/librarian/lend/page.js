'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';

function LendBookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const urlBookCode = searchParams.get('uniqueCode');
  const urlBookId = searchParams.get('bookId');
  const [activeTab, setActiveTab] = useState('quick');
  const [loading, setLoading] = useState(false);
  const [uniqueCodeSearch, setUniqueCodeSearch] = useState(urlBookCode || '');
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
  const { theme } = useTheme();
  
  // Book copy state
  const [bookCopies, setBookCopies] = useState([]);
  const [selectedBookCopy, setSelectedBookCopy] = useState(null);
  const [isLoadingCopies, setIsLoadingCopies] = useState(false);
  const [copyNumber, setCopyNumber] = useState('');
  
  // Advanced search
  const [advSearchTerm, setAdvSearchTerm] = useState('');
  const [advSearchType, setAdvSearchType] = useState('book');
  const [advSelectedBook, setAdvSelectedBook] = useState(null);
  const [advSelectedStudent, setAdvSelectedStudent] = useState(null);
  const [advSelectedBookCopy, setAdvSelectedBookCopy] = useState(null);
  const [advBookCopies, setAdvBookCopies] = useState([]);
  const [advSearchResults, setAdvSearchResults] = useState([]);
  const [isAdvSearching, setIsAdvSearching] = useState(false);
  const [isAdvLoadingCopies, setIsAdvLoadingCopies] = useState(false);
  
  // Set default due date (14 days from now) when component mounts
  useEffect(() => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
  }, []);
  
  // Load book copies when a book is found
  useEffect(() => {
    if (foundBook) {
      fetchBookCopies(foundBook._id);
    }
  }, [foundBook]);
  
  // Load book copies for advanced search when a book is selected
  useEffect(() => {
    if (advSelectedBook) {
      fetchAdvBookCopies(advSelectedBook._id);
    }
  }, [advSelectedBook]);

  // Auto-search book when navigating from book details page
  useEffect(() => {
    if (urlBookCode && user) {
      setUniqueCodeSearch(urlBookCode);
      handleBookSearch(urlBookCode);
    }
  }, [user, urlBookCode]);
  // Fetch book copies for the found book
  const fetchBookCopies = async (bookId) => {
    if (!bookId || !user) return;
    
    setIsLoadingCopies(true);
    setBookCopies([]);
    
    try {
      const response = await fetch(
        `/api/library/book-copies?firebaseUid=${user?.uid}&bookId=${bookId}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch book copies');
      }
      
      const data = await response.json();
      
      // Check response format and extract book copies
      if (data.success && data.bookCopies) {
        // Filter only available copies
        const availableCopies = data.bookCopies.filter(copy => copy.status === 'available');
        setBookCopies(availableCopies);
        
        if (availableCopies.length > 0) {
          setSelectedBookCopy(availableCopies[0]);
          setCopyNumber(availableCopies[0].copyNumber.toString());
        }
      } else if (data.success && data.copies) {
        // Alternative response format
        const availableCopies = data.copies.filter(copy => copy.status === 'available');
        setBookCopies(availableCopies);
        
        if (availableCopies.length > 0) {
          setSelectedBookCopy(availableCopies[0]);
          setCopyNumber(availableCopies[0].copyNumber.toString());
        }
      } else {
        throw new Error('No book copies found in response');
      }
    } catch (err) {
      console.error('Error fetching book copies:', err);
      setError(err.message || 'Failed to fetch book copies');
    } finally {
      setIsLoadingCopies(false);
    }
  };
  
  // Fetch book copies for advanced search
  const fetchAdvBookCopies = async (bookId) => {
    if (!bookId || !user) return;
    
    setIsAdvLoadingCopies(true);
    setAdvBookCopies([]);
    
    try {
      const response = await fetch(
        `/api/library/book-copies?firebaseUid=${user?.uid}&bookId=${bookId}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch book copies');
      }
      
      const data = await response.json();
      
      // Check response format and extract book copies
      if (data.success && data.bookCopies) {
        // Filter only available copies
        const availableCopies = data.bookCopies.filter(copy => copy.status === 'available');
        setAdvBookCopies(availableCopies);
        
        if (availableCopies.length > 0) {
          setAdvSelectedBookCopy(availableCopies[0]);
        }
      } else if (data.success && data.copies) {
        // Alternative response format
        const availableCopies = data.copies.filter(copy => copy.status === 'available');
        setAdvBookCopies(availableCopies);
        
        if (availableCopies.length > 0) {
          setAdvSelectedBookCopy(availableCopies[0]);
        }
      } else {
        throw new Error('No book copies found in response');
      }
    } catch (err) {
      console.error('Error fetching book copies:', err);
      setError(err.message || 'Failed to fetch book copies');
    } finally {
      setIsAdvLoadingCopies(false);
    }
  };
  
  // Quick search - Find book by unique code
  const handleBookSearch = async (uniqueCodeSearch) => {
    if (!user) return;
    console.log("Unique Code Search:", uniqueCodeSearch);
    if (!uniqueCodeSearch.trim()) {
      setError('Please enter a valid book code');
      return;
    }

    setError('');
    setFoundBook(null);
    setSelectedBookCopy(null);
    setBookCopies([]);
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
        console.log('Student results:', data.users);
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
    setAdvSelectedBookCopy(null);
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
  
  // Handle book copy selection
  const handleBookCopyChange = (e) => {
    const copyId = e.target.value;
    const selectedCopy = bookCopies.find(copy => copy._id === copyId);
    setSelectedBookCopy(selectedCopy);
    if (selectedCopy) {
      setCopyNumber(selectedCopy.copyNumber.toString());
    }
  };
  
  // Handle advanced book copy selection
  const handleAdvBookCopyChange = (e) => {
    const copyId = e.target.value;
    const selectedCopy = advBookCopies.find(copy => copy._id === copyId);
    setAdvSelectedBookCopy(selectedCopy);
  };
  
  // Handle lending book (quick method)
  const handleQuickLendBook = async () => {
    if (!user || !foundBook || !foundStudent || !dueDate || !selectedBookCopy) {
      setError('Please select a book, a student, a book copy, and set a due date');
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
          bookCopyId: selectedBookCopy._id,
          copyNumber: parseInt(copyNumber, 10),
          studentId: foundStudent._id,
          dueDate: new Date(dueDate).toISOString()
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to lend book');
      }
      
      const data = await response.json();
      
      setSuccess(`Book "${foundBook.title}" (Copy #${selectedBookCopy.copyNumber}) has been successfully lent to ${foundStudent.displayName}!`);
      
      // Reset form
      setFoundBook(null);
      setFoundStudent(null);
      setSelectedBookCopy(null);
      setBookCopies([]);
      setUniqueCodeSearch('');
      setStudentSearch('');
      setStudentResults([]);
      setCopyNumber('');
      
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
    if (!user || !advSelectedBook || !advSelectedStudent || !dueDate || !advSelectedBookCopy) {
      setError('Please select a book, a student, a book copy, and set a due date');
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
          bookCopyId: advSelectedBookCopy._id,
          copyNumber: advSelectedBookCopy.copyNumber,
          studentId: advSelectedStudent._id,
          dueDate: new Date(dueDate).toISOString()
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to lend book');
      }
      
      const data = await response.json();
      
      setSuccess(`Book "${advSelectedBook.title}" (Copy #${advSelectedBookCopy.copyNumber}) has been successfully lent to ${advSelectedStudent.displayName}!`);
      
      // Reset form
      setAdvSelectedBook(null);
      setAdvSelectedStudent(null);
      setAdvSelectedBookCopy(null);
      setAdvBookCopies([]);
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
    setSelectedBookCopy(null);
    setBookCopies([]);
    setUniqueCodeSearch('');
    setStudentSearch('');
    setStudentResults([]);
    setCopyNumber('');
    setAdvSelectedBook(null);
    setAdvSelectedStudent(null);
    setAdvSelectedBookCopy(null);
    setAdvBookCopies([]);
    setAdvSearchResults([]);
    setAdvSearchTerm('');
    setAdvSearchType('book');
    setError('');
    setSuccess('');
    
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
  };

    // Theme-based style classes
    const cardStyle = theme === 'dark'
    ? 'bg-gray-800 border-gray-700 shadow-slate-700/30'
    : 'bg-white border-gray-200 shadow-gray-200/50';
  
  const headingStyle = theme === 'dark'
    ? 'text-gray-100'
    : 'text-gray-800';
  
  const inputStyle = theme === 'dark'
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-indigo-600';
  
  const buttonPrimary = theme === 'dark'
    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
    : 'bg-indigo-600 hover:bg-indigo-700 text-white';
  
  const buttonSecondary = theme === 'dark'
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600'
    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300';
  
  const tabActive = theme === 'dark'
    ? 'text-indigo-400 border-indigo-400'
    : 'text-indigo-600 border-indigo-600';
  
  const tabInactive = theme === 'dark'
    ? 'text-gray-400 hover:text-gray-300'
    : 'text-gray-500 hover:text-gray-700';
  
  const resultCardStyle = theme === 'dark'
    ? 'bg-gray-700 border-gray-600'
    : 'bg-gray-50 border-gray-200';

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            {urlBookId && (
              <button
                onClick={() => router.push(`/dashboard/library/books/${urlBookId}`)}
                className={`${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} flex items-center`}
              >
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Book Details
              </button>
            )}
            <h1 className={`text-2xl font-serif font-bold ${headingStyle}`}>Lend Books to Students</h1>
          </div>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1 font-light italic`}>
            Issue books to students quickly and efficiently
          </p>
        </div>
      </div>

      {error && (
        <div className={`${theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-100 border-red-500 text-red-700'} border-l-4 p-4 mb-6 rounded-r`} role="alert">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className={`${theme === 'dark' ? 'bg-green-900/30 border-green-700 text-green-200' : 'bg-green-100 border-green-500 text-green-700'} border-l-4 p-4 mb-6 rounded-r`} role="alert">
          <div className="flex">
            <div className="py-1">
              <svg className={`h-6 w-6 ${theme === 'dark' ? 'text-green-500' : 'text-green-500'} mr-4`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div className={`${cardStyle} border rounded-lg overflow-hidden mb-8 shadow`}>
        <div className={`flex border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('quick')}
            className={`py-3 px-6 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'quick' ? tabActive : tabInactive
            }`}
          >
            Quick Lending (by Code)
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`py-3 px-6 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'advanced' ? tabActive : tabInactive
            }`}
          >
            Advanced Search
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'quick' ? (
            /* Quick Lending UI */
            <div>
              <div className="mb-8">
                <h2 className={`text-lg font-serif font-medium mb-4 ${headingStyle} border-b pb-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  Step 1: Find Book by Unique Code
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="grow">
                    <div className="relative">
                      <input
                        type="text"
                        value={uniqueCodeSearch}
                        onChange={(e) => setUniqueCodeSearch(e.target.value.toUpperCase())}
                        placeholder="Enter the book's unique code"
                        className={`w-full px-3 py-2.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${inputStyle}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleBookSearch(
                              uniqueCodeSearch.trim()
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleBookSearch(
                      uniqueCodeSearch.trim()
                    )}
                    disabled={isSearchingBook || !uniqueCodeSearch.trim()}
                    className={`px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors duration-200 ${buttonPrimary} ${
                      isSearchingBook || !uniqueCodeSearch.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSearchingBook ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                  <div className="mb-8">
                    <div className={`${theme === 'dark' ? 'bg-green-900/20 border-green-700/50 text-green-300' : 'bg-green-50 border-green-200 text-green-800'} p-5 rounded-lg border`}>
                      <h3 className={`text-md font-medium mb-3 ${theme === 'dark' ? 'text-green-300' : 'text-green-800'} flex items-center`}>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Book Found
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1.5`}>
                            <span className="font-medium">Title:</span> {foundBook.title}
                          </p>
                          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1.5`}>
                            <span className="font-medium">Author:</span> {foundBook.author}
                          </p>
                          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1.5`}>
                            <span className="font-medium">Code:</span> {foundBook.uniqueCode}
                          </p>
                        </div>
                        <div>
                          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1.5`}>
                            <span className="font-medium">Genre:</span> {foundBook.genre}
                          </p>
                          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1.5`}>
                            <span className="font-medium">Availability:</span> 
                            <span className={foundBook.availableCopies > 0 
                              ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') 
                              : (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                            }>
                              {' '}{foundBook.availableCopies} of {foundBook.copies}
                            </span>
                          </p>
                          {foundBook.ISBN && (
                            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1.5`}>
                              <span className="font-medium">ISBN:</span> {foundBook.ISBN}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Book Copy Selection */}
                  <div className="mb-8">
                    <h2 className={`text-lg font-serif font-medium mb-4 ${headingStyle} border-b pb-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      Step 2: Select Book Copy
                    </h2>
                    {isLoadingCopies ? (
                      <div className={`flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading available copies...
                      </div>
                    ) : bookCopies.length > 0 ? (
                      <div>
                        <div className="mb-4">
                          <label htmlFor="bookCopy" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Available Copies
                          </label>
                          <select
                            id="bookCopy"
                            name="bookCopy"
                            value={selectedBookCopy ? selectedBookCopy._id : ''}
                            onChange={handleBookCopyChange}
                            className={`block w-full py-2.5 px-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:w-auto ${inputStyle}`}
                          >
                            {bookCopies.map(copy => (
                              <option key={copy._id} value={copy._id}>
                                Copy #{copy.copyNumber} - {copy.condition} condition
                              </option>
                            ))}
                          </select>
                        </div>
                        {selectedBookCopy && (
                          <div className={`${theme === 'dark' ? 'bg-blue-900/20 border-blue-700/50 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'} p-4 rounded-md border text-sm`}>
                            <p className="mb-1"><span className="font-medium">Selected:</span> Copy #{selectedBookCopy.copyNumber}</p>
                            <p className="mb-1"><span className="font-medium">Condition:</span> {selectedBookCopy.condition}</p>
                            {selectedBookCopy.notes && <p><span className="font-medium">Notes:</span> {selectedBookCopy.notes}</p>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`p-4 ${theme === 'dark' ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800'} border rounded-md`}>
                        No available copies of this book were found. All copies may be borrowed or unavailable.
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-8">
                    <h2 className={`text-lg font-serif font-medium mb-4 ${headingStyle} border-b pb-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      Step 3: Find Student
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="grow">
                        <div className="relative">
                          <input
                            type="text"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            placeholder="Search by name, email or roll number"
                            className={`w-full px-3 py-2.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${inputStyle}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleStudentSearch();
                              }
                            }}
                          />
                          {showStudentResults && studentResults.length > 0 && (
                            <div className={`absolute z-10 mt-1 w-full border rounded-md max-h-60 overflow-auto shadow-lg ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                              {studentResults.map((student) => (
                                <div
                                  key={student._id}
                                  className={`px-4 py-3 cursor-pointer border-b last:border-0 ${theme === 'dark' ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-100 border-gray-200'}`}
                                  onClick={() => handleSelectStudent(student)}
                                >
                                  <div className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{student.displayName}</div>
                                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{student.email}</div>
                                  {student.rollNo && <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Roll No: {student.rollNo}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleStudentSearch}
                        disabled={isSearchingStudent || !studentSearch.trim()}
                        className={`px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors duration-200 ${buttonPrimary} ${
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
                    <div className="mb-8">
                      <div className={`${theme === 'dark' ? 'bg-blue-900/20 border-blue-700/50 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'} p-5 rounded-lg border`}>
                        <h3 className={`text-md font-medium mb-3 flex items-center ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          Student Selected
                        </h3>
                        <div>
                          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1.5`}>
                            <span className="font-medium">Name:</span> {foundStudent.displayName}
                          </p>
                          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1.5`}>
                            <span className="font-medium">Email:</span> {foundStudent.email}
                          </p>
                          {foundStudent.rollNo && (
                            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1.5`}>
                              <span className="font-medium">Roll No:</span> {foundStudent.rollNo}
                            </p>
                          )}
                          {foundStudent.department && (
                            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1.5`}>
                              <span className="font-medium">Department:</span> {foundStudent.department}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {foundStudent && (
                    <div className="mb-8">
                      <h2 className={`text-lg font-serif font-medium mb-4 ${headingStyle} border-b pb-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        Step 4: Set Due Date
                      </h2>
                      <div>
                        <input
                          type="date"
                          id="dueDateQuick"
                          name="dueDateQuick"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className={`px-3 py-2.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${inputStyle}`}
                          required
                        />
                        <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Default due date is set to 14 days from today.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {foundStudent && selectedBookCopy && (
                    <div className="flex justify-end mt-8">
                      <button
                        type="button"
                        onClick={handleReset}
                        className={`mr-4 px-4 py-2.5 border rounded-md shadow-sm text-sm font-medium transition-colors duration-200 ${buttonSecondary}`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickLendBook}
                        disabled={loading}
                        className={`px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors duration-200 ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} ${
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
            /* Advanced Search UI - similar theming would continue here */
                        /* Advanced Search UI */
            <div>
              {!advSelectedBook || !advSelectedStudent ? (
                <div>
                  <h2 className={`text-lg font-serif font-medium mb-4 ${headingStyle} border-b pb-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
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
                          onChange={() => setAdvSearchType('book')}
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-indigo-500 bg-gray-700 border-gray-600' : 'text-indigo-600 border-gray-300'}`}
                        />
                        <label htmlFor="search-book-adv" className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
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
                          onChange={() => setAdvSearchType('student')}
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-indigo-500 bg-gray-700 border-gray-600' : 'text-indigo-600 border-gray-300'}`}
                        />
                        <label htmlFor="search-student-adv" className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
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
                        className={`w-full px-3 py-2.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${inputStyle}`}
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
                      className={`px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors duration-200 ${buttonPrimary} ${
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
            
                  {advSearchResults.length > 0 && (
                    <div className="mt-6">
                      <h3 className={`text-md font-medium mb-3 ${headingStyle}`}>
                        Search Results ({advSearchResults.length})
                      </h3>
                      
                      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg overflow-hidden shadow`}>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}>
                              <tr>
                                {advSearchType === 'book' ? (
                                  <>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                      Title
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                      Author
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                      Code
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                      Available
                                    </th>
                                  </>
                                ) : (
                                  <>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                      Name
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                      Email/Roll No
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                      Department
                                    </th>
                                  </>
                                )}
                                <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                              {advSearchResults.map((result) => (
                                <tr key={result._id} className={theme === 'dark' ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                                  {advSearchType === 'book' ? (
                                    <>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{result.title}</div>
                                        {result.ISBN && (
                                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ISBN: {result.ISBN}</div>
                                        )}
                                      </td>
                                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {result.author}
                                      </td>
                                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                                        {result.uniqueCode || 'N/A'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          result.availableCopies > 0
                                            ? theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                                            : theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
                                        }`}>
                                          {result.availableCopies} / {result.copies}
                                        </span>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{result.displayName}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{result.email}</div>
                                        {result.rollNo && (
                                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Roll No: {result.rollNo}</div>
                                        )}
                                      </td>
                                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {result.department || 'N/A'}
                                      </td>
                                    </>
                                  )}
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                      onClick={() => {
                                        advSearchType === 'book' 
                                          ? handleAdvSelectBook(result) 
                                          : handleAdvSelectStudent(result);
                                      }}
                                      disabled={advSearchType === 'book' && result.availableCopies <= 0}
                                      className={`${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-900'} ${
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
                <div>
                  <h2 className={`text-lg font-serif font-medium mb-4 ${headingStyle} border-b pb-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    Step 3: Review and Confirm
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className={`${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'} p-5 rounded-lg border`}>
                      <h3 className={`text-md font-medium mb-3 ${headingStyle}`}>Book Details</h3>
                      <div className="space-y-2">
                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          <span className="font-medium">Title:</span> {advSelectedBook.title}
                        </p>
                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          <span className="font-medium">Author:</span> {advSelectedBook.author}
                        </p>
                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          <span className="font-medium">Genre:</span> {advSelectedBook.genre}
                        </p>
                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          <span className="font-medium">Available Copies:</span>{' '}
                          <span className={advSelectedBook.availableCopies > 0 
                            ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') 
                            : (theme === 'dark' ? 'text-red-400' : 'text-red-600')}
                          >
                            {advSelectedBook.availableCopies} / {advSelectedBook.copies}
                          </span>
                        </p>
                        {advSelectedBook.ISBN && (
                          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <span className="font-medium">ISBN:</span> {advSelectedBook.ISBN}
                          </p>
                        )}
                        {advSelectedBook.uniqueCode && (
                          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <span className="font-medium">Unique Code:</span> {advSelectedBook.uniqueCode}
                          </p>
                        )}
                      </div>
                      
                      <div className={`mt-4 border-t pt-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h4 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Select Book Copy</h4>
                        {isAdvLoadingCopies ? (
                          <div className={`flex items-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading copies...
                          </div>
                        ) : advBookCopies.length > 0 ? (
                          <select
                            value={advSelectedBookCopy ? advSelectedBookCopy._id : ''}
                            onChange={handleAdvBookCopyChange}
                            className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${inputStyle}`}
                          >
                            {advBookCopies.map(copy => (
                              <option key={copy._id} value={copy._id}>
                                Copy #{copy.copyNumber} - {copy.condition} condition
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>No available copies found.</p>
                        )}
                      </div>
                    </div>
                    
                    <div className={`${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'} p-5 rounded-lg border`}>
                      <h3 className={`text-md font-medium mb-3 ${headingStyle}`}>Student Details</h3>
                      <div className="space-y-2">
                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          <span className="font-medium">Name:</span> {advSelectedStudent.displayName}
                        </p>
                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          <span className="font-medium">Email:</span> {advSelectedStudent.email}
                        </p>
                        {advSelectedStudent.rollNo && (
                          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <span className="font-medium">Roll No:</span> {advSelectedStudent.rollNo}
                          </p>
                        )}
                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          <span className="font-medium">Department:</span> {advSelectedStudent.department || 'N/A'}
                        </p>
                      </div>
                      
                      <div className={`mt-4 border-t pt-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-start">
                          <div className={`mt-1 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                          </div>
                          <p className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            Always verify student identity before proceeding with the lending process.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <label htmlFor="dueDate" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`px-3 py-2.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${inputStyle}`}
                      required
                    />
                    <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Default due date is set to 14 days from today.
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-8">
                    <button
                      type="button"
                      onClick={handleReset}
                      className={`px-4 py-2.5 border rounded-md shadow-sm text-sm font-medium transition-colors duration-200 ${buttonSecondary}`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAdvancedLendBook}
                      disabled={loading || !advSelectedBookCopy}
                      className={`px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors duration-200 ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} ${
                        (loading || !advSelectedBookCopy) ? 'opacity-50 cursor-not-allowed' : ''
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
    </div>
  );
}

export default withRoleProtection(LendBookPage, ['admin', 'librarian']);
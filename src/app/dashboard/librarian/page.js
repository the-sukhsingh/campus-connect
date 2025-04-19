'use client';

import { withRoleProtection } from '@/utils/withRoleProtection';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function LibrarianDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Librarian Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Books Management */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-indigo-500 text-white mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Books Management</h2>
            <p className="text-gray-600 mb-4">Add, edit, or remove books from the library inventory.</p>
            <Link 
              href="/dashboard/librarian/books"
              className="block text-center py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Manage Books
            </Link>
          </div>
        </div>

        {/* Book Lending */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-green-500 text-white mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Book Lending</h2>
            <p className="text-gray-600 mb-4">Lend books to students by searching with their name, email, or roll number.</p>
            <Link 
              href="/dashboard/librarian/lend"
              className="block text-center py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Lend Books
            </Link>
          </div>
        </div>
        
        {/* Book Returns */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-blue-500 text-white mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Book Returns</h2>
            <p className="text-gray-600 mb-4">Manage and approve book return requests from students.</p>
            <Link 
              href="/dashboard/librarian/returns"
              className="block text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Manage Returns
            </Link>
          </div>
        </div>
        
        {/* View All Books */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-purple-500 text-white mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Book Catalog</h2>
            <p className="text-gray-600 mb-4">Browse through the complete catalog of books in the library.</p>
            <Link 
              href="/dashboard/student/books/catalog"
              className="block text-center py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              View Catalog
            </Link>
          </div>
        </div>
        
        {/* Borrowing History */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-yellow-500 text-white mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Borrowing History</h2>
            <p className="text-gray-600 mb-4">View and track all the past and current borrowings in the library.</p>
            <Link 
              href="/dashboard/librarian/borrowings"
              className="block text-center py-2 px-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              View History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRoleProtection(LibrarianDashboardPage, ['hod', 'librarian']);
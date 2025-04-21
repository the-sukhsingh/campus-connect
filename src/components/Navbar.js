'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, dbUser, loading, logout } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Navigation links based on user role
  const getNavLinks = () => {
    if (!dbUser || !dbUser.role) return [];
    
    switch (dbUser.role) {
      case 'admin':
        return [
          { name: 'Dashboard', href: '/dashboard/admin' },
          { name: 'Colleges', href: '/dashboard/admin/colleges' }
        ];
      case 'student':
        return [
          { name: 'Dashboard', href: '/dashboard/student' },
          { name: 'Attendance', href: '/dashboard/student/attendance' },
          { name: 'Catalog', href: '/dashboard/student/books/catalog'},
          { name: 'Rooms', href: '/dashboard/rooms' },
          { name: 'Room Booking', href: '/dashboard/room-bookings' },
          { name: 'Books', href: '/dashboard/student/books/' },
          { name: 'Events', href: '/dashboard/student/events' }
        ];
      case 'faculty':
        return [
          { name: 'Dashboard', href: '/dashboard/faculty' },
          { name: 'Announcements', href: '/dashboard/faculty/announcements' },
          { name: 'Assigned Classes', href: '/dashboard/faculty/assigned-classes' },
          { name: 'Rooms', href: '/dashboard/rooms' },
          { name: 'Room Booking', href: '/dashboard/room-bookings' },
          { name: 'Attendance', href: '/dashboard/faculty/attendance' },
          { name: 'Events', href: '/dashboard/events' }
        ];
      case 'hod':
        return [
          { name: 'Dashboard', href: '/dashboard/hod' },
          { name: 'Announcements', href: '/dashboard/hod/announcements' },
          { name: 'Classes', href: '/dashboard/hod/classes' },
          { name: 'College', href: '/dashboard/hod/college/manage' },
          { name: 'Rooms', href: '/dashboard/rooms' },
          { name: 'Room Booking', href: '/dashboard/room-bookings' },
          { name: 'Library', href: '/dashboard/hod/library' },
          { name: 'Teachers', href: '/dashboard/hod/teachers' },
          { name: 'Events', href: '/dashboard/events' }
        ];
      case 'librarian':
        return [
          { name: 'Dashboard', href: '/dashboard/librarian' },
          { name: 'Books', href: '/dashboard/librarian/books' },
          { name: 'Catalog', href: '/dashboard/student/books/catalog'},
          { name: 'Rooms', href: '/dashboard/rooms' },
          { name: 'Room Booking', href: '/dashboard/room-bookings' },
          { name: 'Lend', href: '/dashboard/librarian/lend' },
          { name: 'Returns', href: '/dashboard/librarian/returns' },
          { name: 'Events', href: '/dashboard/events' }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-gray-800 text-white w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 text-xl font-bold">
              Campus Connect
            </Link>
            
            {/* Desktop Nav Links */}
            {user && dbUser && (
              <div className="hidden md:block ml-10">
                <div className="flex items-center space-x-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        pathname === link.href
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {loading ? (
              <p className="text-sm">Loading...</p>
            ) : user ? (
              <div className="hidden md:flex items-center gap-4">
                
                <Link
                  href="/dashboard/password-change"
                  className="px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Change Password
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Sign in
              </Link>
            )}
            
            {/* Mobile menu button */}
            {user && (
              <div className="md:hidden ml-4">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
                  <svg
                    className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <svg
                    className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900 py-2">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === link.href
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {user && (
              <>
                <Link
                  href="/dashboard/password-change"
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Change Password
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-300 hover:bg-gray-700 hover:text-white"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
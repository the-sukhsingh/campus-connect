'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { LogOut, Menu, X, ChevronRight, ChevronLeft, User, Settings, Bell, BookOpen } from 'lucide-react';

export default function Navbar() {
  const { user, dbUser, loading, logout } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const navRef = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getNavLinks = () => {
    if (!dbUser || !dbUser.role) return [];

    const commonLinks = [{ name: 'Dashboard', href: `/dashboard/${dbUser.role}`, icon: '🏠', ariaLabel: 'Go to Dashboard' }];

    const roleLinks = {
      admin: [
        { name: 'Colleges', href: '/dashboard/admin/colleges', icon: '🏛️', ariaLabel: 'Manage Colleges' },
        { name: 'Room Bookings', href: '/dashboard/admin/room-bookings', icon: '📅', ariaLabel: 'Manage Room Bookings' }
      ],
      student: [
        { name: 'Attendance', href: '/dashboard/student/attendance', icon: '📊', ariaLabel: 'View Attendance' },
        { name: 'Catalog', href: '/dashboard/student/books/catalog', icon: '📚', ariaLabel: 'Browse Book Catalog' },
        { name: 'My Books', href: '/dashboard/student/books/', icon: '📖', ariaLabel: 'View My Books' },
        { name: 'Events', href: '/dashboard/student/events', icon: '🎉', ariaLabel: 'View Events' },
      ],
      faculty: [
        { name: 'Announcements', href: '/dashboard/faculty/announcements', icon: '📢', ariaLabel: 'Manage Announcements' },
        { name: 'Classes', href: '/dashboard/faculty/assigned-classes', icon: '👨‍🏫', ariaLabel: 'View Assigned Classes' },
        { name: 'Rooms', href: '/dashboard/rooms', icon: '🚪', ariaLabel: 'Browse Rooms' },
        { name: 'Room Booking', href: '/dashboard/room-bookings', icon: '📅', ariaLabel: 'Book a Room' },
        { name: 'Attendance', href: '/dashboard/faculty/attendance', icon: '📋', ariaLabel: 'Manage Attendance' },
        { name: 'Events', href: '/dashboard/events', icon: '🎭', ariaLabel: 'View Events' },
      ],
      hod: [
        { name: 'Announcements', href: '/dashboard/hod/announcements', icon: '📢', ariaLabel: 'Manage Announcements' },
        { name: 'Classes', href: '/dashboard/hod/classes', icon: '🧑‍🎓', ariaLabel: 'Manage Classes' },
        { name: 'College', href: '/dashboard/hod/college/manage', icon: '🏫', ariaLabel: 'Manage College' },
        { name: 'Rooms', href: '/dashboard/rooms', icon: '🚪', ariaLabel: 'Browse Rooms' },
        { name: 'Room Booking', href: '/dashboard/room-bookings', icon: '📅', ariaLabel: 'Book a Room' },
        { name: 'Library', href: '/dashboard/hod/library', icon: '📚', ariaLabel: 'Manage Library' },
        { name: 'Teachers', href: '/dashboard/hod/teachers', icon: '👨‍🏫', ariaLabel: 'Manage Teachers' },
        { name: 'Events', href: '/dashboard/events', icon: '🎭', ariaLabel: 'View Events' },
      ],
      librarian: [
        { name: 'Books', href: '/dashboard/librarian/books', icon: '📚', ariaLabel: 'Manage Books' },
        { name: 'Catalog', href: '/dashboard/student/books/catalog', icon: '📖', ariaLabel: 'Browse Book Catalog' },
        { name: 'Rooms', href: '/dashboard/rooms', icon: '🚪', ariaLabel: 'Browse Rooms' },
        { name: 'Room Booking', href: '/dashboard/room-bookings', icon: '📅', ariaLabel: 'Book a Room' },
        { name: 'Lend', href: '/dashboard/librarian/lend', icon: '🤲', ariaLabel: 'Lend Books' },
        { name: 'Returns', href: '/dashboard/librarian/returns', icon: '↩️', ariaLabel: 'Process Returns' },
        { name: 'Events', href: '/dashboard/events', icon: '🎭', ariaLabel: 'View Events' },
      ],
    };

    return [...commonLinks, ...(roleLinks[dbUser.role] || [])];
  };

  // Scroll navigation links horizontally
  const scrollNav = (direction) => {
    if (navRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      navRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Update max scroll width when links change
  useEffect(() => {
    if (navRef.current) {
      const updateMaxScroll = () => {
        setMaxScroll(navRef.current.scrollWidth - navRef.current.clientWidth);
      };
      updateMaxScroll();
      window.addEventListener('resize', updateMaxScroll);
      return () => window.removeEventListener('resize', updateMaxScroll);
    }
  }, [navRef.current, dbUser]);

  // Track scroll position
  const handleScroll = () => {
    if (navRef.current) {
      setScrollPosition(navRef.current.scrollLeft);
    }
  };

  // Active link detector with improved matching
  const isActive = (href) => {
    if (pathname === href) return true;

    // Special case for nested routes (e.g., /dashboard/student/books/123 should highlight "Books" link)
    const pathnameSegments = pathname.split('/');
    const hrefSegments = href.split('/');

    // Compare segments up to the href's depth
    if (hrefSegments.length >= 3 && pathnameSegments.length >= hrefSegments.length) {
      const relevantPathSegments = pathnameSegments.slice(0, hrefSegments.length);
      return relevantPathSegments.join('/') === href;
    }

    return false;
  };

  const navLinks = getNavLinks();

  // Mock notifications for demonstration
  const notifications = [
    { id: 1, title: 'New announcement posted', time: '10 min ago' },
    { id: 2, title: 'Your book is due tomorrow', time: '1 hour ago' },
    { id: 3, title: 'Room booking confirmed', time: '3 hours ago' },
  ];

  // Get user's initials for avatar
  const getUserInitials = () => {
    if (dbUser && dbUser.displayName) {
      return dbUser.displayName.split(' ')[0].charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-800 via-purple-700 to-indigo-700 text-white shadow-lg sticky top-0 z-50" role="navigation" aria-label="Main Navigation">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-pink-300 to-red-400 hover:scale-105 transition-transform flex items-center"
            aria-label="CampusConnect Home"
          >
            <BookOpen className="mr-2 mt-2 text-yellow-300" size={24} aria-hidden="true" />
            <span className="hidden sm:inline">CampusConnect</span>
            <span className="sm:hidden">CC</span>
          </Link>

          {/* Desktop Navigation */}
          {user && dbUser && (
            <div className="hidden md:flex items-center ml-6 relative flex-1 max-w-4xl">
              {scrollPosition > 10 && (
                <button
                  onClick={() => scrollNav('left')}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 bg-indigo-700/80 rounded-full p-1 shadow-md hover:bg-indigo-600 transition-colors z-10"
                  aria-label="Scroll navigation left"
                >
                  <ChevronLeft size={18} />
                </button>
              )}

              <div
                className="flex items-center gap-1 overflow-x-auto px-1 py-1.5 rounded-xl scrollbar-hide scrollDiv" 
                ref={navRef}
                onScroll={handleScroll}
              >
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-all duration-300 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center whitespace-nowrap mx-1 ${isActive(link.href)
                      ? 'bg-white/90 text-indigo-700 font-bold shadow-md hover:bg-opacity-100'
                      : 'text-white hover:bg-white/20 hover:scale-105'
                      }`}
                    aria-label={link.ariaLabel}
                    aria-current={isActive(link.href) ? "page" : undefined}
                  >
                    <span className="mr-1.5" aria-hidden="true">{link.icon}</span>
                    <span>{link.name}</span>
                  </Link>
                ))}
              </div>

              {scrollPosition < maxScroll - 10 && (
                <button
                  onClick={() => scrollNav('right')}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 bg-indigo-700/80 rounded-full p-1 shadow-md hover:bg-indigo-600 transition-colors z-10"
                  aria-label="Scroll navigation right"
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          )}

            
          <div className="flex items-center gap-2 md:gap-4">
            {/* Loading Indicator */}


            {loading ? (
              <div className="text-sm italic flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" role="status" aria-label="Loading"></div>
                <span className="sr-only">Loading user information...</span>
              </div>
            ) : user ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setUserMenuOpen(false);
                    }}
                    className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Notifications"
                    aria-expanded={notificationsOpen}
                  >
                    <Bell size={20} />
                    <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center" aria-label="3 unread notifications">
                      3
                    </span>
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded-lg shadow-lg py-2 animate-fadeDown origin-top-right">
                      <h3 className="px-4 py-2 font-bold border-b border-gray-200">Notifications</h3>
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.map(notif => (
                          <div key={notif.id} className="px-4 py-2 hover:bg-gray-100 border-b border-gray-100">
                            <p className="text-sm font-medium">{notif.title}</p>
                            <p className="text-xs text-gray-500">{notif.time}</p>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-2 text-center">
                        <Link href="#" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center gap-1.5 rounded-full hover:bg-white/10 py-1 px-[6px] transition-colors"
                    aria-label="User menu"
                    aria-expanded={userMenuOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                      {getUserInitials()}
                    </div>
                    <span className="hidden md:inline text-sm font-medium truncate max-w-[100px]">
                      {dbUser?.name || user.email}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-lg shadow-lg py-1 animate-fadeDown origin-top-right">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="font-medium truncate">{dbUser?.displayName || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{dbUser?.email || user.email}</p>
                        <p className="text-xs font-medium text-indigo-600 mt-1 capitalize">{dbUser?.role || 'User'}</p>
                      </div>


                      <Link href="/dashboard/password-change" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors">
                        <Settings size={16} className="mr-2" />
                        Change Password
                      </Link>

                      <div className="border-t border-gray-200 mt-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                        >
                          <LogOut size={16} className="mr-2" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/auth"
                className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-md transition-all hover:scale-105 hover:shadow-md text-sm font-medium flex items-center"
                aria-label="Sign in to your account"
              >
                <User size={16} className="mr-1.5" aria-hidden="true" />
                Sign in
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            {user && (
              <button
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setUserMenuOpen(false);
                  setNotificationsOpen(false);
                }}
                className="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X size={24} className="text-red-200" /> : <Menu size={24} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Animated dropdown */}
      {isMenuOpen && (
        <div
          className="md:hidden bg-gradient-to-b from-indigo-900 to-purple-900 py-2 px-3 space-y-1 animate-fadeDown shadow-inner"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="mobile-menu-button"
        >
          {/* User Info at Top of Mobile Menu */}
          {dbUser && (
            <div className="bg-white/10 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-base font-bold">
                  {getUserInitials()}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{dbUser.name}</p>
                  <p className="text-xs text-white/70">{dbUser.email}</p>
                  <p className="text-xs font-medium bg-white/20 rounded-full px-2 py-0.5 mt-1 inline-block capitalize">{dbUser.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section in Mobile Menu */}
          <div className="bg-white/5 rounded-lg mb-3">
            <div className="px-3 py-2 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-medium">Notifications</h3>
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            </div>
            <div className="max-h-36 overflow-y-auto">
              {notifications.map(notif => (
                <div key={notif.id} className="px-3 py-2 border-b border-white/5 last:border-b-0">
                  <p className="text-sm">{notif.title}</p>
                  <p className="text-xs text-white/60">{notif.time}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg overflow-hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium transition-all border-b border-white/10 last:border-b-0 ${isActive(link.href)
                  ? 'bg-white/20 font-semibold'
                  : 'hover:bg-white/10'
                  }`}
                onClick={() => setIsMenuOpen(false)}
                aria-label={link.ariaLabel}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                <span className="mr-3 text-lg" aria-hidden="true">{link.icon}</span>
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <Link
              href="/dashboard/password-change"
              className="flex-1 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 py-2 rounded-md text-sm"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings size={16} className="mr-1" />
              Settings
            </Link>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/80 hover:bg-red-600 rounded-md text-sm font-medium transition-all"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}

{/* Add global styles */}
<style jsx global>{`
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeDown {
    animation: fadeDown 0.2s ease forwards;
  }
   .scrollDiv::-webkit-scrollbar {
    height: 1px;
  }

  .scrollDiv::-webkit-scrollbar-track {
    background: transparent;
  }

  .scrollDiv::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.4);
    border-radius: 1px;
  }

  .scrollDiv::-webkit-scrollbar-button {
    display: none;
    height: 0;
    width: 0;
  }

  .scrollDiv {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.4) transparent;
  }
`}</style>
    </nav>
  );
}

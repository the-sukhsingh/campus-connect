'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { LogOut, Menu, X, User, Settings, Bell, BookOpen, Trash2, Check, ExternalLink, ChevronDown, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { user, dbUser, loading, logout } = useAuth();
  const { notifications, unreadCount, removeNotification, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const navRef = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [expandedMobileSubmenu, setExpandedMobileSubmenu] = useState(null);
  const menuRefs = useRef({});

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

    const commonLinks = [{ name: 'Dashboard', href: `/dashboard/${dbUser.role}`, icon: '🏠' }];

    const roleLinks = {
      admin: [
        { name: 'Colleges', href: '/dashboard/admin/colleges', icon: '🏛️' },
        { name: 'Room Bookings', href: '/dashboard/admin/room-bookings', icon: '📅' }
      ],
      student: [
        { name: 'Dashboard', href: '/dashboard/student', icon: '🏠' },
        { name: 'Attendance', href: '/dashboard/student/attendance', icon: '📊' },
        { name: 'Notes', href: '/dashboard/student/notes', icon: '📝' },
        {
          name: 'Library',
          href: '/dashboard/student/books/catalog',
          icon: '📚',
          submenu: [
            { name: 'Catalog', href: '/dashboard/student/books/catalog' },
            { name: 'My Books', href: '/dashboard/student/books' }
          ]
        },
        { name: 'Announcements', href: '/dashboard/student/announcements', icon: '📢' },
        { name: 'Events', href: '/dashboard/student/events', icon: '🎉' },
        { name: 'Feedback', href: '/dashboard/feedback', icon: '💬' },
        { name: 'Safety Alerts', href: '/dashboard/safety-alerts', icon: '🚨' }
      ],
      faculty: [
        { name: 'Dashboard', href: '/dashboard/faculty', icon: '🏠' },
        {
          name: 'Classes',
          href: '/dashboard/faculty/classes',
          icon: '👨‍🏫',
          submenu: [
            { name: 'My Classes', href: '/dashboard/faculty/classes' },
            { name: 'Assigned Classes', href: '/dashboard/faculty/assigned-classes' },
            { name: 'Attendance', href: '/dashboard/faculty/attendance' }
          ]
        },
        { name: 'Notes', href: '/dashboard/faculty/notes', icon: '📝' },
        { name: 'Space', href: '/dashboard/room-bookings', icon: '🚪' },
        { name: 'Announcements', href: '/dashboard/faculty/announcements', icon: '📢' },
        { name: 'Events', href: '/dashboard/events', icon: '🎭' },
        { name: 'Feedback', href: '/dashboard/feedback', icon: '💬' },
        { name: 'Safety Alerts', href: '/dashboard/safety-alerts', icon: '🚨' }
      ],
      hod: [
        { name: 'Dashboard', href: '/dashboard/hod', icon: '🏠' },
        { name: 'College', href: '/dashboard/hod/college/manage', icon: '🏫' },
        { name: 'Teachers', href: '/dashboard/hod/teachers', icon: '👨‍🏫' },
        { name: 'Classes', href: '/dashboard/hod/classes', icon: '🧑‍🎓' },
        { name: 'Notes', href: '/dashboard/faculty/notes', icon: '📝' },
        {
          name: 'Spaces',
          href: '/dashboard/hod/rooms',
          icon: '🚪',
          submenu: [
            { name: 'Manage Spaces', href: '/dashboard/hod/rooms' },
            { name: 'Manage Space Bookings', href: '/dashboard/hod/room-bookings' },
            { name: 'Energy Usage', href: '/dashboard/hod/energy' }
          ]
        },
        { name: 'Announcements', href: '/dashboard/hod/announcements', icon: '📢' },
        { name: 'Events', href: '/dashboard/events', icon: '🎭' },
        { name: 'Feedback', href: '/dashboard/hod/feedback', icon: '💬' },
        { name: 'Safety Alerts', href: '/dashboard/safety-alerts', icon: '🚨' }
      ],
      librarian: [
        { name: 'Dashboard', href: '/dashboard/librarian', icon: '🏠' },
        { name: 'Books', href: '/dashboard/librarian/books', icon: '📚' },
        { name: 'Lend', href: '/dashboard/librarian/lend', icon: '🤲' },
        { name: 'Returns', href: '/dashboard/librarian/returns', icon: '↩️' },
        { name: 'Feedback', href: '/dashboard/feedback', icon: '💬' },
        { name: 'Safety Alerts', href: '/dashboard/safety-alerts', icon: '🚨' }
      ],
    };

    return dbUser.role === 'admin' ? [...commonLinks, ...(roleLinks[dbUser.role] || [])] : (roleLinks[dbUser.role] || []);
  };

  const scrollNav = (direction) => {
    if (navRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      navRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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

  const handleScroll = () => {
    if (navRef.current) {
      setScrollPosition(navRef.current.scrollLeft);
    }
  };

  const isActive = (href) => {
    if (pathname === href) return true;

    const pathnameSegments = pathname?.split('/');
    const hrefSegments = href?.split('/');

    if (hrefSegments?.length >= 3 && pathnameSegments?.length >= hrefSegments?.length) {
      const relevantPathSegments = pathnameSegments?.slice(0, hrefSegments?.length);
      return relevantPathSegments?.join('/') === href;
    }

    return false;
  };

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';

    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

      const now = new Date();
      const isToday = date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown time';
    }
  };

  const handleNavigation = (e, href) => {
    e.preventDefault();
    setIsMenuOpen(false);
    router.push(href);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setNotificationsOpen(false);

    if (notification.url && notification.url !== '/') {
      if (notification.url.startsWith('/') && !notification.url.match(/^https?:\/\//)) {
        router.push(notification.url);
      } else {
        window.open(notification.url, '_blank');
      }
    }
  };

  const handleDeleteNotification = (e, id) => {
    e.stopPropagation();
    removeNotification(id);
  };

  const handleMarkAsRead = (e, id) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const getUserInitials = () => {
    if (dbUser && dbUser.displayName) {
      return dbUser.displayName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className={`${theme === 'dark' ? 'bg-[#11141f]' : 'bg-gray-200 border-b'} text-${theme === 'dark' ? 'white' : 'gray-800'} shadow-lg sticky top-0 z-50`} role="navigation" aria-label="Main Navigation">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            onClick={(e) => handleNavigation(e, '/')}
            className="text-xl font-bold flex items-center"
            aria-label="CampusConnect Home"
          >
            <BookOpen className={`mr-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`} size={24} aria-hidden="true" />
            <span className={`hidden sm:inline ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>CampusConnect</span>
            <span className="sm:hidden">CC</span>
          </Link>

          {user && dbUser && (
            <div className="hidden md:flex items-center overflow-y-visible flex-1 justify-center max-w-4xl">
              <div className="flex items-center space-x-1">
                {getNavLinks().map((link, index) => {
                  const hasSubmenu = link.submenu && link.submenu.length > 0;
                  const isActiveLink = isActive(link.href);
                  
                  return (
                    <div
                      key={link.href || index}
                      className="relative"
                      ref={el => menuRefs.current[link.name] = el}
                      onMouseEnter={() => setHoveredItem(link.name)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {hasSubmenu ? (
                        <button
                          onClick={(e) => {e.preventDefault()}}
                          className={`flex items-center px-3 py-2 text-sm rounded-md whitespace-nowrap transition-all duration-200 ${
                            isActiveLink
                              ? theme === 'dark' 
                                ? 'bg-[#2a2a3c] text-white font-medium' 
                                : 'bg-gray-100 text-gray-900 font-medium'
                              : theme === 'dark'
                                ? 'text-gray-400 hover:text-white hover:bg-[#2a2a3c]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {/* <span className="mr-1.5">{link.icon}</span> */}
                          <span>{link.name}</span>
                          <ChevronDown size={14} className="ml-1" />
                        </button>
                      ) : (
                        <Link
                          href={link.href}
                          className={`flex items-center px-3 py-2 text-sm rounded-md whitespace-nowrap transition-all duration-200 ${
                            isActiveLink
                              ? theme === 'dark' 
                                ? 'bg-[#2a2a3c] text-white font-medium' 
                                : 'bg-gray-100 text-gray-900 font-medium'
                              : theme === 'dark'
                                ? 'text-gray-400 hover:text-white hover:bg-[#2a2a3c]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {/* <span className="mr-1.5">{link.icon}</span> */}
                          <span>{link.name}</span>
                        </Link>
                      )}

                      {hasSubmenu && hoveredItem === link.name && (
                        <div className={`absolute mt-1 w-56 ${theme === 'dark' ? 'bg-[#2a2a3c] text-white border-[#323248]' : 'bg-white text-gray-800 border-gray-200'} rounded-md shadow-lg py-1 border z-50`}>
                          <div className={`px-3 py-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                            <p className={`font-medium text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{link.name}</p>
                          </div>
                          <ul className="py-1">
                            {link.submenu.map((submenuItem) => (
                              <li key={submenuItem.href}>
                                <Link
                                  href={submenuItem.href}
                                  onClick={() => setHoveredItem(null)}
                                  className={`flex items-center px-4 py-2 text-sm hover:${theme === 'dark' ? 'bg-[#323248]' : 'bg-gray-100'} transition-colors ${
                                    isActive(submenuItem.href) 
                                      ? theme === 'dark' 
                                        ? 'bg-[#323248] text-white' 
                                        : 'bg-gray-100 text-gray-900' 
                                      : theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                  }`}
                                >
                                  {submenuItem.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-[#2a2a3c]' : 'hover:bg-gray-100'} transition-colors`}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'light' ? (
                <Sun size={20} className="text-yellow-600" />
              ) : (
                <Moon size={20} className="text-white" />
              )}
            </button>

            {loading ? (
              <div className="text-sm italic flex items-center">
                <div className={`animate-spin h-4 w-4 border-2 ${theme === 'dark' ? 'border-white border-t-transparent' : 'border-gray-800 border-t-transparent'} rounded-full mr-2`} role="status" aria-label="Loading"></div>
                <span className="sr-only">Loading user information...</span>
              </div>
            ) : user ? (
              <>
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setUserMenuOpen(false);
                    }}
                    className={`relative p-2 rounded-full ${theme === 'dark' ? 'hover:bg-[#2a2a3c]' : 'hover:bg-gray-100'} transition-colors`}
                    aria-label="Notifications"
                    aria-expanded={notificationsOpen}
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center" aria-label={`${unreadCount} unread notifications`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className={`absolute right-0 mt-2 w-80 ${theme === 'dark' ? 'bg-[#1e1e2d] border-[#323248] text-white' : 'bg-white border-gray-200 text-gray-800'} border rounded-lg shadow-lg py-2 z-50`}>
                      <div className={`px-4 py-2 font-bold border-b ${theme === 'dark' ? 'border-[#323248]' : 'border-gray-200'} flex justify-between items-center`}>
                        <h3>Notifications</h3>
                        <div className="flex gap-1">
                          {unreadCount > 0 && (
                            <button
                              onClick={() => markAllAsRead()}
                              className={`text-xs ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300 hover:bg-[#323248]' : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'} font-medium flex items-center gap-1 p-1 rounded`}
                              title="Mark all as read"
                            >
                              <Check size={14} />
                              <span>Read all</span>
                            </button>
                          )}
                          <button
                            onClick={() => clearAllNotifications()}
                            className={`text-xs ${theme === 'dark' ? 'text-red-400 hover:text-red-300 hover:bg-[#323248]' : 'text-red-600 hover:text-red-800 hover:bg-red-50'} font-medium flex items-center gap-1 p-1 rounded`}
                            title="Clear all notifications"
                          >
                            <Trash2 size={14} />
                            <span>Clear all</span>
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(notification => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`px-4 py-2 hover:${theme === 'dark' ? 'bg-[#323248]' : 'bg-gray-100'} border-b ${theme === 'dark' ? 'border-[#323248]' : 'border-gray-200'} cursor-pointer transition-colors ${!notification.read ? theme === 'dark' ? 'bg-[#2a2a3c]' : 'bg-gray-100' : ''}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className={`text-sm ${!notification.read ? 'font-bold' : 'font-medium'}`}>
                                    {notification.title}
                                  </p>
                                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} line-clamp-2 mb-1`}>{notification.body}</p>
                                  <div className="flex justify-between items-center mt-1">
                                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} italic`}>
                                      {formatNotificationTime(notification.timestamp)}
                                    </span>
                                    <div className="flex gap-1">
                                      {!notification.read && (
                                        <button
                                          onClick={(e) => handleMarkAsRead(e, notification.id)}
                                          className={`text-blue-400 hover:text-blue-300 p-1 rounded-full hover:${theme === 'dark' ? 'bg-[#323248]' : 'bg-blue-50'}`}
                                          title="Mark as read"
                                        >
                                          <Check size={14} />
                                        </button>
                                      )}
                                      {notification.url && notification.url !== '/' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (notification.url.startsWith('/') && !notification.url.match(/^https?:\/\//)) {
                                              window.open(notification.url, '_blank');
                                            } else {
                                              window.open(notification.url, '_blank');
                                            }
                                          }}
                                          className={`text-gray-400 hover:text-gray-300 p-1 rounded-full hover:${theme === 'dark' ? 'bg-[#323248]' : 'bg-gray-100'}`}
                                          title="Open in new tab"
                                        >
                                          <ExternalLink size={14} />
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                                        className={`text-red-400 hover:text-red-300 p-1 rounded-full hover:${theme === 'dark' ? 'bg-[#323248]' : 'bg-red-50'}`}
                                        title="Delete notification"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className={`px-4 py-6 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            <Bell className={`mx-auto mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} size={32} />
                            <p className="text-sm">No notifications yet</p>
                            <p className="text-xs mt-1">When you receive notifications, they&apos;ll appear here</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setNotificationsOpen(false);
                    }}
                    className={`flex items-center gap-1 rounded-full ${theme === 'dark' ? 'hover:bg-[#2a2a3c]' : 'hover:bg-gray-100'} py-1 pl-1.5 pr-2 transition-colors`}
                    aria-label="User menu"
                    aria-expanded={userMenuOpen}
                  >
                    <div className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-[#323248]' : 'bg-gray-200'} flex items-center justify-center text-sm font-medium`}>
                      {getUserInitials()}
                    </div>
                    <span className={`hidden md:inline text-sm font-medium truncate max-w-[100px] ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      {dbUser?.displayName || user.email}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className={`absolute right-0 mt-2 w-56 ${theme === 'dark' ? 'bg-[#1e1e2d] border-[#323248] text-white' : 'bg-white border-gray-200 text-gray-800'} rounded-lg shadow-lg py-1 border z-50`}>
                      <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'border-[#323248]' : 'border-gray-200'}`}>
                        <p className="font-medium truncate">{dbUser?.displayName || 'User'}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>{dbUser?.email || user.email}</p>
                        <p className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} mt-1 capitalize`}>{dbUser?.role || 'User'}</p>
                      </div>

                      <Link 
                        href="/dashboard/password-change" 
                        onClick={(e) => handleNavigation(e, '/dashboard/password-change')} 
                        className={`flex items-center px-4 py-2 text-sm ${theme === 'dark' ? 'hover:bg-[#323248]' : 'hover:bg-gray-100'} transition-colors`}
                      >
                        <Settings size={16} className="mr-2" />
                        Change Password
                      </Link>

                      <div className={`border-t ${theme === 'dark' ? 'border-[#323248]' : 'border-gray-200'} mt-1`}>
                        <button
                          onClick={handleSignOut}
                          className={`flex items-center w-full text-left px-4 py-2 text-sm ${theme === 'dark' ? 'text-red-400 hover:bg-[#323248]' : 'text-red-600 hover:bg-gray-100'} transition-colors`}
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
                onClick={(e) => handleNavigation(e, '/auth')}
                className={`px-4 py-1.5 ${theme === 'dark' ? 'bg-[#3699ff] hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} rounded-md transition-all text-sm font-medium flex items-center text-white`}
                aria-label="Sign in to your account"
              >
                <User size={16} className="mr-1.5" aria-hidden="true" />
                Sign in
              </Link>
            )}

            {user && (
              <button
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setUserMenuOpen(false);
                  setNotificationsOpen(false);
                }}
                className={`md:hidden p-2 rounded-md ${theme === 'dark' ? 'hover:bg-[#2a2a3c]' : 'hover:bg-gray-100'} transition-colors`}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X size={24} className={theme === 'dark' ? 'text-red-400' : 'text-red-600'} /> : <Menu size={24} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div
          className={`md:hidden ${theme === 'dark' ? 'bg-[#1e1e2d]' : 'bg-white'} py-4 px-3 space-y-3 shadow-inner fixed inset-x-0 top-[64px] h-svh overflow-y-auto z-40`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="mobile-menu-button"
        >

          <div className="space-y-2">
            {getNavLinks().map((link) => {
              const isActive = pathname === link.href;
              const hasSubmenu = link.submenu && link.submenu.length > 0;
              
              return (
                <div key={link.name} className="rounded-md overflow-hidden">
                  <div className="flex">
                    <Link
                      href={hasSubmenu ? '#' : link.href}
                      onClick={(e) => hasSubmenu ? (e.preventDefault(), setExpandedMobileSubmenu(expandedMobileSubmenu === link.name ? null : link.name)) : handleNavigation(e, link.href)}
                      className={`flex items-center flex-grow p-4 text-base font-medium transition-all rounded-l-md ${
                        isActive ? theme === 'dark' ? 'bg-[#2a2a3c] font-semibold' : 'bg-gray-100 font-semibold' : theme === 'dark' ? 'hover:bg-[#323248]' : 'hover:bg-gray-100'
                      }`}
                    >
                      {/* <span className="mr-3 text-xl" aria-hidden="true">{link.icon}</span> */}
                      {link.name}
                      {hasSubmenu && (
                        <ChevronDown 
                          size={16}
                          className={`ml-auto transition-transform ${expandedMobileSubmenu === link.name ? 'rotate-180' : ''}`} 
                        />
                      )}
                    </Link>
                  </div>
                  
                  {hasSubmenu && expandedMobileSubmenu === link.name && (
                    <div className={`pl-10 ${theme === 'dark' ? 'bg-[#323248]' : 'bg-gray-100'} py-2 rounded-b-md`}>
                      {link.submenu.map((submenuItem) => (
                        <Link
                          key={submenuItem.href}
                          href={submenuItem.href}
                          onClick={(e) => handleNavigation(e, submenuItem.href)}
                          className={`block py-3 px-4 text-base ${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-[#2a2a3c]' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} transition-colors rounded-md my-1`}
                        >
                          {submenuItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={`border-t ${theme === 'dark' ? 'border-[#323248]' : 'border-gray-200'} pt-4 mt-4`}>
            <button
              onClick={logout}
              className={`flex items-center w-full p-3 ${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-[#2a2a3c]' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} rounded-md transition-colors`}
            >
              <LogOut size={18} className="mr-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

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
      `}</style>
    </nav>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { LogOut, Menu, X, ChevronRight, ChevronLeft, User, Settings, Bell, BookOpen, Trash2, Check, ExternalLink, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { user, dbUser, loading, logout } = useAuth();
  const { notifications, unreadCount, removeNotification, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
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
        { name: 'Notes', href: '/dashboard/notes', icon: '📝' },
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
        { name: 'Notes', href: '/dashboard/notes', icon: '📝' },
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
        {
          name: 'Space',
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
        { name: 'Announcements', href: '/dashboard/librarian/announcements', icon: '📢' },
        { name: 'Events', href: '/dashboard/events', icon: '🎭' },
        { name: 'Feedback', href: '/dashboard/feedback', icon: '💬' },
        { name: 'Safety Alerts', href: '/dashboard/safety-alerts', icon: '🚨' }
      ],
    };

    return dbUser.role === 'admin' ? [...commonLinks, ...(roleLinks[dbUser.role] || [])] : (roleLinks[dbUser.role] || []);
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

    const pathnameSegments = pathname?.split('/');
    const hrefSegments = href?.split('/');

    if (hrefSegments?.length >= 3 && pathnameSegments?.length >= hrefSegments?.length) {
      const relevantPathSegments = pathnameSegments?.slice(0, hrefSegments?.length);
      return relevantPathSegments?.join('/') === href;
    }

    return false;
  };

  const navLinks = getNavLinks();

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
    <nav className="bg-gradient-to-r from-indigo-800 via-purple-700 to-indigo-700 text-white shadow-lg sticky top-0 z-50" role="navigation" aria-label="Main Navigation">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            onClick={(e) => handleNavigation(e, '/')}
            className="text-2xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-pink-300 to-red-400 hover:scale-105 transition-transform flex items-center"
            aria-label="CampusConnect Home"
          >
            <BookOpen className="mr-2 text-yellow-300" size={24} aria-hidden="true" />
            <span className="hidden sm:inline">CampusConnect</span>
            <span className="sm:hidden">CC</span>
          </Link>

          {user && dbUser && (
            <div className="hidden md:flex items-center ml-6 overflow-y-visible flex-1 max-w-4xl">
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
                className="flex z-20 items-center gap-1 overflow-x-auto overflow-y-visible px-1 py-1.5 rounded-xl scrollbar-hide scrollDiv" 
                ref={navRef}
                onScroll={handleScroll}
              >
                {navLinks.map((link, index) => {
                  const hasSubmenu = link.submenu && link.submenu.length > 0;
                  
                  return (
                    <div
                      key={link.href || index}
                      className="relative"
                      ref={el => menuRefs.current[link.name] = el}
                      onMouseEnter={() => setHoveredItem(link.name)}
                    >
                      <div onMouseEnter={() => setHoveredItem(link.name)}>
                        <Link
                          href={link.href}
                          className={`flex items-center justify-between w-full py-2 px-3 text-sm font-medium whitespace-nowrap mx-1 transition-all duration-300 rounded-lg ${
                            isActive(link.href)
                              ? 'bg-white/90 text-indigo-700 font-bold shadow-md hover:bg-opacity-100'
                              : 'text-white hover:bg-white/20'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="mr-1.5" aria-hidden="true">{link.icon}</span>
                            <span>{link.name}</span>
                          </div>
                          {hasSubmenu && <ChevronDown size={14} className="ml-1" />}
                        </Link>

                        {hasSubmenu && hoveredItem === link.name && (
                          <div className="fixed mt-2 w-56 bg-white text-gray-800 rounded-lg shadow-lg py-1 animate-fadeDown origin-top">
                            <div className="px-4 py-2 border-b border-gray-200">
                              <p className="font-medium">{link.name}</p>
                            </div>
                            <ul className="py-1">
                              {link.submenu.map((submenuItem) => (
                                <li key={submenuItem.href}>
                                  <Link
                                    href={submenuItem.href}
                                    onClick={() => setHoveredItem(null)}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    {submenuItem.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
            {loading ? (
              <div className="text-sm italic flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" role="status" aria-label="Loading"></div>
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
                    className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
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
                    <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-lg shadow-lg py-2 animate-fadeDown origin-top-right">
                      <div className="px-4 py-2 font-bold border-b border-gray-200 flex justify-between items-center">
                        <h3>Notifications</h3>
                        <div className="flex gap-1">
                          {unreadCount > 0 && (
                            <button
                              onClick={() => markAllAsRead()}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 p-1 hover:bg-blue-50 rounded"
                              title="Mark all as read"
                            >
                              <Check size={14} />
                              <span>Read all</span>
                            </button>
                          )}
                          <button
                            onClick={() => clearAllNotifications()}
                            className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 p-1 hover:bg-red-50 rounded"
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
                              className={`px-4 py-2 hover:bg-gray-100 border-b border-gray-100 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className={`text-sm ${!notification.read ? 'font-bold' : 'font-medium'}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-600 line-clamp-2 mb-1">{notification.body}</p>
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-500 italic">
                                      {formatNotificationTime(notification.timestamp)}
                                    </span>
                                    <div className="flex gap-1">
                                      {!notification.read && (
                                        <button
                                          onClick={(e) => handleMarkAsRead(e, notification.id)}
                                          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"
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
                                          className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"
                                          title="Open in new tab"
                                        >
                                          <ExternalLink size={14} />
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
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
                          <div className="px-4 py-6 text-center text-gray-500">
                            <Bell className="mx-auto mb-2 text-gray-400" size={32} />
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
                    className="flex items-center gap-1.5 rounded-full hover:bg-white/10 py-1 px-[6px] transition-colors"
                    aria-label="User menu"
                    aria-expanded={userMenuOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                      {getUserInitials()}
                    </div>
                    <span className="hidden md:inline text-sm font-medium truncate max-w-[100px]">
                      {dbUser?.displayName || user.email}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-lg shadow-lg py-1 animate-fadeDown origin-top-right">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="font-medium truncate">{dbUser?.displayName || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{dbUser?.email || user.email}</p>
                        <p className="text-xs font-medium text-indigo-600 mt-1 capitalize">{dbUser?.role || 'User'}</p>
                      </div>

                      <Link href="/dashboard/password-change" onClick={(e) => handleNavigation(e, '/dashboard/password-change')} className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors">
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
                onClick={(e) => handleNavigation(e, '/auth')}
                className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-md transition-all hover:scale-105 hover:shadow-md text-sm font-medium flex items-center"
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

      {/* Mobile menu */}
      {isMenuOpen && (
        <div
          className="md:hidden bg-gradient-to-b from-indigo-900 to-purple-900 py-4 px-3 space-y-3 animate-fadeDown shadow-inner fixed inset-x-0 top-[64px] max-h-[calc(100vh-64px)] overflow-y-auto z-40"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="mobile-menu-button"
        >
          {dbUser && (
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                  {getUserInitials()}
                </div>
                <div>
                  <div className="font-medium text-white">{dbUser?.displayName || user?.email}</div>
                  <div className="text-xs text-white/70">{dbUser?.role || 'User'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile navigation links */}
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
                        isActive ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
                      }`}
                    >
                      <span className="mr-3 text-xl" aria-hidden="true">{link.icon}</span>
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
                    <div className="pl-10 bg-white/5 py-2 rounded-b-md">
                      {link.submenu.map((submenuItem) => (
                        <Link
                          key={submenuItem.href}
                          href={submenuItem.href}
                          onClick={(e) => handleNavigation(e, submenuItem.href)}
                          className="block py-3 px-4 text-base text-white/80 hover:text-white hover:bg-white/10 transition-colors rounded-md my-1"
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

          {/* Mobile user menu */}
          <div className="border-t border-white/10 pt-4 mt-4">
            <button
              onClick={logout}
              className="flex items-center w-full p-3 text-white/90 hover:bg-white/10 rounded-md transition-colors"
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

        .navbar-submenu {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 999;
          background-color: white;
          width: 200px;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          overflow: visible;
        }
      `}</style>
    </nav>
  );
}

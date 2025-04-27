'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useState, useEffect, useRef } from "react";
import { EyeIcon, Bell, Calendar, BookOpen, MapPin, Clock } from "lucide-react";

export default function Home() {
  const { user, dbUser, loading } = useAuth();
  const { theme } = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [animationReady, setAnimationReady] = useState(false);
  const observerRef = useRef(null);
  const animatedElementsRef = useRef([]);

  // Fetch recent announcements and events when user is logged in
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (user) {
        try {
          setAnnouncementsLoading(true);
          // Pass the user's Firebase UID to filter announcements by college
          const response = await fetch(`/api/announcements?action=get-all&limit=3&uid=${user?.uid}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch announcements');
          }
          
          const data = await response.json();
          setAnnouncements(data.announcements || []);
        } catch (error) {
          console.error('Error fetching announcements:', error);
        } finally {
          setAnnouncementsLoading(false);
        }
      }
    };

    const fetchEvents = async () => {
      if (!user) return; // Skip if user is not logged in
      try {
        setEventsLoading(true);
        // Fetch upcoming events for all users regardless of login status
        // This allows guests to see public events
        const endpoint = user 
          ? `/api/events?action=get-upcoming&limit=4&uid=${user?.uid}` 
          : `/api/events?action=get-upcoming&limit=4&public=true`;
          
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        console.log("Data from events API:", data);
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
          console.log("Events fetched:", data.events);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchAnnouncements();
    fetchEvents(); // Always fetch events for all users
    
    // Set animation ready after initial data fetch attempts
    const timer = setTimeout(() => {
      setAnimationReady(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [user]);

  // Setup Intersection Observer for animations after content is loaded
  useEffect(() => {
    if (!animationReady) return;
    
    // Cleanup any existing observer
    if (observerRef.current) {
      animatedElementsRef.current.forEach(el => {
        if (el) observerRef.current.unobserve(el);
      });
    }
    
    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
            observerRef.current.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    // Wait for next render cycle to ensure DOM elements are available
    setTimeout(() => {
      // Observe all elements with animation classes
      const animElements = document.querySelectorAll('.animate-fade-in, .animate-slide-up, .feature-card, .cta-element');
      animatedElementsRef.current = Array.from(animElements);
      
      animElements.forEach(el => {
        if (el) {
          // Ensure elements start hidden
          el.style.opacity = 0;
          el.style.transform = 'translateY(20px)';
          el.style.transition = 'all 0.6s ease-out';
          observerRef.current.observe(el);
        }
      });
    }, 100);

    return () => {
      // Clean up observer on unmount
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [animationReady, announcements, events]);

  // Function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to format time
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to open announcement modal
  const openAnnouncementModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  // Function to close announcement modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
  };

  // Generate dummy events if needed
  const getDummyEvents = () => {
    return [
      {
        _id: 'event1',
        title: 'Annual Tech Symposium',
        description: 'Join us for a day of technology talks, demonstrations, and networking opportunities.',
        startDate: new Date('2025-06-15T10:00:00'),
        endDate: new Date('2025-06-15T16:00:00'),
        location: 'Main Auditorium',
        type: 'Academic'
      },
      {
        _id: 'event2',
        title: 'Campus Sports Day',
        description: 'Annual sports competition featuring various indoor and outdoor sports activities.',
        date: new Date('2025-06-20T09:00:00'),
        location: 'Sports Complex',
        type: 'Sports'
      },
      {
        _id: 'event3',
        title: 'Career Fair 2025',
        description: 'Meet representatives from top companies and explore internship and job opportunities.',
        date: new Date('2025-07-01T10:00:00'),
        location: 'Student Center',
        type: 'Academic'
      },
      {
        _id: 'event4',
        title: 'AI Workshop Series',
        description: 'Hands-on workshop on artificial intelligence and machine learning fundamentals.',
        date: new Date('2025-06-10T14:00:00'),
        location: 'Computer Science Building',
        type: 'Workshop'
      },
    ];
  };

  // Display announcements based on API or dummy data
  const displayAnnouncements = user ? announcements : getDummyEvents();
  const displayEvents = user ? events : getDummyEvents();

  // Get the appropriate badge color based on announcement type
  const getBadgeColor = (type) => {
    switch(type?.toLowerCase()) {
      case 'important':
        return theme === 'dark' 
          ? 'bg-red-700 text-red-100 hover:bg-red-600' 
          : 'bg-red-500 text-white hover:bg-red-600';
      case 'urgent':
        return theme === 'dark' 
          ? 'bg-orange-700 text-orange-100 hover:bg-orange-600' 
          : 'bg-orange-500 text-white hover:bg-orange-600';
      default:
        return theme === 'dark' 
          ? 'bg-blue-700 text-blue-100 hover:bg-blue-600' 
          : 'bg-blue-500 text-white hover:bg-blue-600';
    }
  };

  // Get the appropriate border color based on event type
  const getEventBorderColor = (type) => {
    switch(type?.toLowerCase()) {
      case 'sports':
        return 'from-red-500 to-red-600';
      case 'workshop':
        return 'from-green-500 to-green-600';
      case 'cultural':
        return 'from-purple-500 to-purple-600';
      case 'academic':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-indigo-500 to-indigo-600';
    }
  };

  return (
    <>
      {/* Modal for announcement details */}
      {showModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border`}>
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <h3 className="text-xl font-bold">{selectedAnnouncement.title}</h3>
              <div className="flex items-center text-sm mt-2 text-blue-100">
                <span>Posted by {selectedAnnouncement.createdBy?.displayName || "Faculty"}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(selectedAnnouncement.createdAt)}</span>
              </div>
              {selectedAnnouncement.classId ? (
                <div className="mt-2 bg-blue-700/30 text-white px-3 py-1.5 rounded-md inline-flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Class: {selectedAnnouncement.classId.name} • {selectedAnnouncement.classId.department} • {selectedAnnouncement.classId.currentSemester} Sem
                </div>
              ) : (
                <div className="mt-2 bg-green-700/30 text-white px-3 py-1.5 rounded-md inline-flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  General Announcement
                </div>
              )}
              {selectedAnnouncement.expiryDate && (
                <div className="mt-2 text-xs text-blue-100">
                  Expires on: {new Date(selectedAnnouncement.expiryDate).toLocaleDateString()}
                </div>
              )}
            </div>
            <div className={`p-6 overflow-y-auto flex-grow ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              <p className="whitespace-pre-wrap">{selectedAnnouncement.content}</p>
            </div>
            <div className={`border-t p-4 flex justify-end ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
              <button
                onClick={closeModal}
                className={`px-4 py-2 rounded-md hover:bg-opacity-80 transition-colors font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
        {/* Hero Section */}
        <section className={`w-full min-h-[92vh] text-center flex justify-center items-center py-12 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-gradient-to-b from-white to-blue-50 border-gray-200'} overflow-hidden rounded-b-3xl shadow-lg mb-16 border relative`}>

          {/* Enhanced animated background with parallax effect */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Abstract geometric shapes with refined glow */}
            <div className={`absolute top-0 left-0 w-full h-full ${theme === 'dark' ? 'opacity-30' : 'opacity-70'}`}>
              <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-blue-600 blur-[120px] animate-pulse" style={{ animationDuration: '15s' }}></div>
              <div className="absolute top-[60%] -right-[5%] w-[40%] h-[40%] rounded-full bg-indigo-600 blur-[130px] animate-pulse" style={{ animationDuration: '18s' }}></div>
              <div className="absolute top-[40%] left-[30%] w-[35%] h-[35%] rounded-full bg-violet-500 blur-[150px] animate-pulse" style={{ animationDuration: '20s', animationDelay: '2s' }}></div>
            </div>

            {/* Particle effects */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute rounded-full ${theme === 'dark' ? 'bg-blue-400/20' : 'bg-blue-600/20'} animate-particle`}
                  style={{
                    width: `${Math.random() * 10 + 2}px`,
                    height: `${Math.random() * 10 + 2}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 20 + 10}s`,
                    animationDelay: `${Math.random() * 5}s`
                  }}
                ></div>
              ))}
            </div>
          </div>

          <div className="container mx-auto px-4 z-10 max-w-5xl space-y-8 relative">
            {/* Elegant branding element */}
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full animate-fadeIn opacity-0" 
                style={{ animationDelay: '0.1s', animationFillMode: 'forwards', animationDuration: '1.2s' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>

            {/* Main headline with refined typography */}
            <div className="animate-fadeIn opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards', animationDuration: '1.5s' }}>
              <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight ${theme === 'dark' ? 'bg-gradient-to-br from-blue-300 via-blue-200 to-indigo-300' : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600'} bg-clip-text text-transparent`}>
                Welcome to <span className="inline-block">Campus Connect</span>
              </h1>
            </div>

            {/* Elegant divider */}
            <div className="flex justify-center animate-scaleIn opacity-0" style={{ animationDelay: '0.7s', animationFillMode: 'forwards', animationDuration: '1s' }}>
              <div className={`h-1 w-24 rounded-full ${theme === 'dark' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}></div>
            </div>

            {/* Refined subheading */}
            <div className="animate-slideUp opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards', animationDuration: '1s' }}>
              <p className={`text-xl sm:text-2xl max-w-3xl mx-auto ${theme === 'dark' ? 'text-blue-100/90' : 'text-gray-700'} font-light leading-relaxed`}>
                Your all-in-one platform for seamless campus management,
                <span className="block mt-2">designed to elevate your educational experience.</span>
              </p>
            </div>

            {/* Stats display to add credibility */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-10 animate-slideUp opacity-0" style={{ animationDelay: '1s', animationFillMode: 'forwards', animationDuration: '1s' }}>
              <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-gray-200'} rounded-xl p-4 backdrop-blur-sm border`}>
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>50+</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Institutions</div>
              </div>
              <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-gray-200'} rounded-xl p-4 backdrop-blur-sm border`}>
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>10k+</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Students</div>
              </div>
              <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-gray-200'} rounded-xl p-4 backdrop-blur-sm border`}>
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>98%</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Satisfaction</div>
              </div>
            </div>

            {/* CTA with refined design */}
            <div className="mt-12 animate-scaleIn opacity-0" style={{ animationDelay: '1.2s', animationFillMode: 'forwards', animationDuration: '1s' }}>
              <Link
                href={user ? `/dashboard/${dbUser?.role || ''}` : "/auth"}
                className={`relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ${theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'} 
                    h-12 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:translate-y-[-2px] duration-300 group`}
              >
                <span className="relative z-10 text-sm font-semibold">{user ? 'Go to Dashboard' : 'Get Started Now'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 relative z-10">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm"></div>
                </div>
              </Link>

            
            </div>

            {/* Subtle visual indicator for scroll */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce" style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-6 w-6 ${theme === 'dark' ? 'text-blue-300/50' : 'text-blue-600/50'}`}>
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </div>
          </div>

          {/* Enhanced floating elements with more depth */}
          <div className="absolute top-20 left-[10%] w-12 h-12 rounded-full border-2 border-blue-400/30 animate-float opacity-60" style={{ animationDuration: '6s' }}></div>
          <div className="absolute bottom-40 right-[15%] w-8 h-8 rounded-full border-2 border-indigo-400/30 animate-float opacity-60" style={{ animationDuration: '8s', animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-10 h-10 rounded-full border-2 border-purple-400/30 animate-float opacity-60" style={{ animationDuration: '7s', animationDelay: '0.5s' }}></div>
     
     
          <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
            opacity: 0;
            transform: translateY(30px); 
            }
            to { 
            opacity: 1;
            transform: translateY(0); 
            }
          }
          
          @keyframes scaleIn {
            from { 
            opacity: 0;
            transform: scale(0.9); 
            }
            to { 
            opacity: 1;
            transform: scale(1); 
            }
          }
          
          @keyframes float {
            0%, 100% {
            transform: translateY(0) rotate(0deg);
            }
            50% {
            transform: translateY(-20px) rotate(5deg);
            }
          }

          @keyframes slideInLeft {
            from {
            opacity: 0;
            transform: translateX(-50px);
            }
            to {
            opacity: 1;
            transform: translateX(0);
            }
          }

          @keyframes slideInRight {
            from {
            opacity: 0;
            transform: translateX(50px);
            }
            to {
            opacity: 1;
            transform: translateX(0);
            }
          }

          @keyframes rotateIn {
            from {
            opacity: 0;
            transform: rotate(-10deg) scale(0.95);
            }
            to {
            opacity: 1;
            transform: rotate(0) scale(1);
            }
          }

          @keyframes bounce {
            0%, 100% {
            transform: translateY(0);
            }
            50% {
            transform: translateY(-15px);
            }
          }

          @keyframes shimmer {
            0% {
            background-position: -200% 0;
            }
            100% {
            background-position: 200% 0;
            }
          }
          
          @keyframes particle {
            0%, 100% {
            opacity: 0;
            transform: translateY(0) translateX(0);
            }
            25% {
            opacity: 1;
            }
            50% {
            opacity: 0.5;
            transform: translateY(-100px) translateX(70px);
            }
            75% {
            opacity: 1;
            }
          }
          
          .animate-fadeIn {
            animation-name: fadeIn;
          }
          
          .animate-slideUp {
            animation-name: slideUp;
          }
          
          .animate-scaleIn {
            animation-name: scaleIn;
          }
          
          .animate-float {
            animation-name: float;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }

          .animate-slideInLeft {
            animation-name: slideInLeft;
          }

          .animate-slideInRight {
            animation-name: slideInRight;
          }

          .animate-rotateIn {
            animation-name: rotateIn;
          }

          .animate-bounce {
            animation-name: bounce;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }

          .animate-shimmer {
            animation-name: shimmer;
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
            background-size: 200% 100%;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
            animation-duration: 4s;
          }
          
          .animate-particle {
            animation-name: particle;
            animation-timing-function: ease-out;
            animation-iteration-count: infinite;
          }
          `}</style>
              
        </section>

        <div className="container mx-auto px-4 py-8 max-w-6xl">

          {/* Announcements Section */}
          <section id="announcements" className={`w-full py-16 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} overflow-hidden rounded-xl shadow-md mb-16 border`}>
            <div className="container px-4 md:px-6 relative">
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 animate-fade-in" style={{opacity: 0, transform: 'translateY(100px)', transition: 'all 0.6s ease-out'}}>
                <div className="space-y-2">
                  <div className={`inline-flex items-center rounded-full ${theme === 'dark' ? 'bg-blue-900/60 text-blue-100' : 'bg-blue-100 text-blue-700'} px-3 py-1 text-sm`}>
                    <Bell className="mr-1 h-3 w-3" />
                    <span>Stay Updated</span>
                  </div>
                  <h2 className={`text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl ${theme === 'dark' ? 'text-blue-200' : 'bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800'}`}>Campus Announcements</h2>
                  <p className={`max-w-[700px] ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed`}>Stay informed with the latest announcements and updates from around the campus.</p>
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {announcementsLoading ? (
                  <div className="col-span-full flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  displayAnnouncements.map((announcement, index) => (
                    <div key={announcement._id || `dummy-${index}`} className="animate-slide-up" style={{opacity: 0, transform: 'translateY(20px)', transition: `all 0.5s ease-out ${index * 0.1}s`}} onClick={() => openAnnouncementModal(announcement)}>
                      <div className={`rounded-lg ${theme === 'dark' ? 'bg-slate-700/80 text-white border-slate-600 hover:bg-slate-700' : 'bg-slate-50 text-card-foreground border-gray-100 hover:bg-slate-100'} shadow-sm overflow-hidden h-full group hover:shadow-lg transition-all duration-300 border cursor-pointer`}>
                        <div className="flex flex-col space-y-1.5 p-6 pb-2 relative overflow-hidden">
                          <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-gradient-to-r from-blue-900/30 to-blue-800/20' : 'bg-gradient-to-r from-blue-100/50 to-blue-50/50'} opacity-50 group-hover:opacity-70 transition-opacity`}></div>
                          <div className="relative z-10">
                            <div className="flex justify-between items-start">
                              <div className="font-semibold tracking-tight text-xl">{announcement.title}</div>
                              <div className={`inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ml-2 ${getBadgeColor(announcement.type)}`}>
                                {announcement.type?.charAt(0).toUpperCase() + announcement.type?.slice(1) || 'General'}
                              </div>
                            </div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                              {new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div className="p-6 pt-0 relative z-10">
                          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} line-clamp-3`}>{announcement.content}</p>
                        </div>
                        <div className="flex items-center p-6 pt-0">
                          <button className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-md group/btn p-0 h-auto ${theme === 'dark' ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}>
                            <span>Read more</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1">
                              <path d="M5 12h14"></path>
                              <path d="m12 5 7 7-7 7"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-center mt-10 animate-fade-in" style={{opacity: 0, transform: 'translateY(20px)', transition: 'all 0.5s ease-out 0.3s'}}>
                <Link href={dbUser?.role ? `/dashboard/${dbUser.role}/announcements` : "/dashboard/announcements"} className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border ${theme === 'dark' ? 'border-blue-700 bg-blue-700/30 hover:bg-blue-600 text-blue-50' : 'border-blue-600 bg-blue-50 hover:bg-blue-100 text-blue-700'} h-11 rounded-md px-8 group`}>
                  View All Announcements
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
            </div>
          </section>

          {/*Events Section */}
          <section className={`w-full py-16 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-gray-200'} overflow-hidden rounded-xl shadow-md mb-16 border`}>
            <div className="container px-4 md:px-6 relative">
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 animate-fade-in" style={{opacity: 0, transform: 'translateY(100px)', transition: 'all 0.6s ease-out'}}>
                <div className="space-y-2">
                  <div className={`inline-flex items-center rounded-full ${theme === 'dark' ? 'bg-blue-900/60 text-blue-100' : 'bg-blue-100 text-blue-700'} px-3 py-1 text-sm`}>
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>Mark Your Calendar</span>
                  </div>
                  <h2 className={`text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl ${theme === 'dark' ? 'text-blue-200' : 'bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800'}`}>Upcoming Events</h2>
                  <p className={`max-w-[700px] ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed`}>Discover exciting events happening on campus and never miss out on important activities.</p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {eventsLoading ? (
                  <div className="col-span-full flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  displayEvents.map((event, index) => (
                    <div key={event._id || `dummy-event-${index}`} style={{opacity: 0, animation: `rotateIn 0.8s ease-out ${0.2 + index * 0.15}s forwards`}}>
                      <div className={`rounded-lg ${theme === 'dark' ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-gray-100'} shadow-sm overflow-hidden h-full group transition-all duration-300 border relative hover:shadow-xl`}>
                        {/* Gradient top bar with animation */}
                        <div className={`absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r ${getEventBorderColor(event.type)} transform origin-left transition-all duration-300 group-hover:h-2`}></div>
                        
                        {/* Card content with improved spacing */}
                        <div className="p-6 pb-4">
                          {/* Event category badge with animation */}
                          <div className="flex justify-between items-start mb-3">
                            <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors bg-gradient-to-r ${getEventBorderColor(event.type)} text-white border-0 transform group-hover:scale-105 transition-transform`}>
                              {event.type || event.category || 'Event'}
                            </div>
                            <div className={`inline-flex items-center rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'} p-1  transition-colors`}>
                              <EyeIcon className={`h-3.5 w-3.5 ${theme === 'dark' ? 'text-slate-300 group-hover:text-blue-300' : 'text-slate-500 group-hover:text-blue-600'}`} />
                            </div>
                          </div>
                          
                          {/* Event title with hover effect */}
                          <h3 className={`font-semibold tracking-tight text-xl mb-2 group-hover:text-blue-${theme === 'dark' ? '400' : '600'} transition-colors`}>{event.title}</h3>
                          
                          {/* Date and time with icons */}
                          <div className={`flex flex-col space-y-2 mb-3`}>
                            <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                              <Calendar className="h-4 w-4" style={{animationDuration: '2s'}} />
                              <span>{new Date(event.startDate || event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            
                            <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(event.startDate || event.date)}</span>
                            </div>
                            
                            <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              <MapPin className="h-4 w-4" />
                              <span>{event.location || event.venue || 'Campus'}</span>
                            </div>
                          </div>
                          
                          {/* Event description with better typography */}
                          <div className={`${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'} rounded-md p-3 mb-4 group-hover:shadow-inner transition-shadow`}>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} line-clamp-2 italic`}>{event.description}</p>
                          </div>
                        </div>
                        
                        {/* Call to action button with enhanced animation */}
                        <div className="px-6 pb-6">
                          <Link
                            href={`dashboard/events/${event._id}`}
                           className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 border ${theme === 'dark' ? 'border-blue-700 bg-blue-700/30 hover:bg-blue-600 text-blue-100' : 'border-blue-200 bg-blue-50 hover:bg-blue-600 hover:text-white hover:border-blue-600'} h-10 rounded-md px-4 w-full group/btn transition-all duration-300`}>
                            View Event
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1">
                              <path d="M5 12h14"></path>
                              <path d="m12 5 7 7-7 7"></path>
                            </svg>
                          </Link>
                        </div>
                        
                        {/* Enhanced gradient overlay effect on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-b ${theme === 'dark' ? 'from-blue-800/20 via-transparent to-transparent' : 'from-blue-100/30 via-transparent to-transparent'} opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300`}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-center mt-10 animate-fade-in" style={{opacity: 0, transform: 'translateY(20px)', transition: 'all 0.5s ease-out 0.3s'}}>
                <Link href="/dashboard/events" className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border ${theme === 'dark' ? 'border-blue-700 bg-blue-700/30 hover:bg-blue-600 text-blue-50' : 'border-blue-600 bg-blue-50 hover:bg-blue-100 text-blue-700'} h-11 rounded-md px-8 group`}>
                  View All Events
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className={`w-full py-16 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} overflow-hidden rounded-xl shadow-md mb-16 border`}>
            <div className="container px-4 md:px-6 relative">
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 animate-fade-in">
                <div className="space-y-2">
                  <div className={`inline-flex items-center rounded-full ${theme === 'dark' ? 'bg-blue-900/60 text-blue-100' : 'bg-blue-100 text-blue-700'} px-3 py-1 text-sm`}>
                    <span>Campus Connect Features</span>
                  </div>
                  <h2 className={`text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl ${theme === 'dark' ? 'text-blue-200' : 'bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800'}`}>Everything You Need</h2>
                  <p className={`max-w-[800px] ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed`}>Our integrated platform brings together all the tools and services you need for a seamless campus experience.</p>
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Feature Cards */}
                <div className="feature-card" style={{transitionDelay: '0.2s'}}>
                  <div className={`${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border group h-full relative overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-r ${theme === 'dark' ? 'from-blue-900/60 to-transparent' : 'from-blue-50 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    <div className={`mb-4 rounded-full w-16 h-16 flex items-center justify-center ${theme === 'dark' ? 'bg-blue-900/50 group-hover:bg-blue-800/50' : 'bg-blue-50 group-hover:bg-blue-100'} transition-colors relative z-10`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-10 w-10 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <polyline points="16 11 18 13 22 9"></polyline>
                      </svg>
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} relative z-10`}>Attendance System</h3>
                    <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} relative z-10`}>Track student and faculty attendance with modern QR code scanning and geofencing technology.</p>
                    
                  </div>
                </div>
                <div className="feature-card" style={{transitionDelay: '0.4s'}}>
                  <div className={`${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border group h-full relative overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-r ${theme === 'dark' ? 'from-blue-900/30 to-transparent' : 'from-blue-50 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    <div className={`mb-4 rounded-full w-16 h-16 flex items-center justify-center ${theme === 'dark' ? 'bg-blue-900/50 group-hover:bg-blue-800/50' : 'bg-blue-50 group-hover:bg-blue-100'} transition-colors relative z-10 animate-shimmer`}>
                      <Bell className={`h-10 w-10 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} relative z-10`}>News &amp; Announcements</h3>
                    <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} relative z-10`}>Keep everyone informed with targeted announcements and emergency notifications.</p>
                    
                  </div>
                </div>
                <div className="feature-card" style={{transitionDelay: '0.6s'}}>
                  <div className={`${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border group h-full relative overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-r ${theme === 'dark' ? 'from-blue-900/30 to-transparent' : 'from-blue-50 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    <div className={`mb-4 rounded-full w-16 h-16 flex items-center justify-center ${theme === 'dark' ? 'bg-blue-900/50 group-hover:bg-blue-800/50' : 'bg-blue-50 group-hover:bg-blue-100'} transition-colors relative z-10 animate-float`}>
                      <BookOpen className={`h-10 w-10 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} relative z-10`}>Library Management</h3>
                    <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} relative z-10`}>Digitize book borrowing, returns, and resource tracking with smart inventory management.</p>
                    
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="w-full py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl mb-16 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-indigo-400/20 blur-3xl"></div>
              <div className="absolute top-1/4 left-1/4 w-6 h-6 rounded-full border border-white/30 animate-float" style={{animationDuration: '6s'}}></div>
              <div className="absolute bottom-1/4 right-1/4 w-4 h-4 rounded-full border border-white/30 animate-float" style={{animationDuration: '8s', animationDelay: '1s'}}></div>
            </div>
            
            <div className="container px-4 md:px-6 relative z-10">
              <div className="flex flex-col items-center text-center max-w-3xl mx-auto cta-element">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">Ready to Transform Your Campus Experience?</h2>
                <p className="text-xl text-blue-100 mb-8">Join thousands of students and faculty members already using Campus Connect to enhance their educational journey.</p>
                <Link 
                  href={user ? `/dashboard/${dbUser?.role || ''}` : "/auth"}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-white text-blue-600 hover:bg-blue-50 h-11 rounded-md px-8 group text-sm relative overflow-hidden"
                >
                  <span className="relative z-10">{user ? 'Go to Dashboard' : 'Get Started Now'}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-white/80 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 relative z-10">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
            </div>
          </section>

          {/* User Roles Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {!user && (
              <>
                <div style={{opacity: 0, animation: 'slideInLeft 0.8s ease-out 0.3s forwards'}} className={`p-8 rounded-lg shadow-md ${theme === 'dark' ? 'bg-slate-700/80 border-slate-600' : 'bg-white border-gray-200'} border relative overflow-hidden group hover:shadow-lg transition-all duration-300`}>
                  <div className={`absolute top-0 left-0 w-full h-1 bg-blue-500`}></div>
                  <div className={`inline-block p-3 rounded-full mb-4 ${theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'} animate-float`} style={{animationDuration: '4s'}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-6 w-6 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} group-hover:text-blue-500 transition-colors`}>For Students</h3>
                  <ul className={`space-y-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Track your attendance
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Check upcoming events
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Borrow library books
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Get announcement updates
                    </li>
                  </ul>
                </div>
                
                <div style={{opacity: 0, animation: 'scaleIn 0.8s ease-out 0.5s forwards'}} className={`p-8 rounded-lg shadow-md ${theme === 'dark' ? 'bg-slate-700/80 border-slate-600' : 'bg-white border-gray-200'} border relative overflow-hidden group hover:shadow-lg transition-all duration-300`}>
                  <div className={`absolute top-0 left-0 w-full h-1 bg-green-500`}></div>
                  <div className={`inline-block p-3 rounded-full mb-4 ${theme === 'dark' ? 'bg-green-900/50' : 'bg-green-100'} animate-bounce`} style={{animationDuration: '4s'}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-6 w-6 ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} group-hover:text-green-500 transition-colors`}>For Faculty</h3>
                  <ul className={`space-y-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Manage class attendance
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Create announcements
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Track assigned classes
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Respond to invites
                    </li>
                  </ul>
                </div>
                
                <div style={{opacity: 0, animation: 'slideInRight 0.8s ease-out 0.7s forwards'}} className={`p-8 rounded-lg shadow-md ${theme === 'dark' ? 'bg-slate-700/80 border-slate-600' : 'bg-white border-gray-200'} border relative overflow-hidden group hover:shadow-lg transition-all duration-300`}>
                  <div className={`absolute top-0 left-0 w-full h-1 bg-purple-500`}></div>
                  <div className={`inline-block p-3 rounded-full mb-4 ${theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-100'} animate-shimmer`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-6 w-6 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M9 9h.01" />
                      <path d="M15 9h.01" />
                      <path d="M9 15h.01" />
                      <path d="M15 15h.01" />
                      <path d="M9 3v18" />
                      <path d="M15 3v18" />
                      <path d="M3 9h18" />
                      <path d="M3 15h18" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} group-hover:text-purple-500 transition-colors`}>For HODs</h3>
                  <ul className={`space-y-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Manage college resources
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Assign teachers to classes
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Monitor library activities
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Create announcements
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { EyeIcon } from "lucide-react";

export default function Home() {
  const { user, dbUser, loading } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Fetch recent announcements when user is logged in
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (user) {
        try {
          setAnnouncementsLoading(true);
          // Pass the user's Firebase UID to filter announcements by college
          const response = await fetch(`/api/announcements?action=get-all&limit=5&uid=${user?.uid}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch announcements');
          }
          
          const data = await response.json();
          setAnnouncements(data.announcements || []);
          console.log("Announcements fetched:", data.announcements);
        } catch (error) {
          console.error('Error fetching announcements:', error);
        } finally {
          setAnnouncementsLoading(false);
        }
      }
    };

    fetchAnnouncements();
  }, [user]);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Modal for announcement details */}
      {showModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
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
                  Class: {selectedAnnouncement.classId.name} • {selectedAnnouncement.classId.department} • {selectedAnnouncement.classId.semester}
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
            <div className="p-6 overflow-y-auto flex-grow">
              <p className="whitespace-pre-wrap text-gray-700">{selectedAnnouncement.content}</p>
            </div>
            <div className="border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Welcome to Campus Connect</h1>
        <p className="text-xl">Your comprehensive campus management system</p>
      </section>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {user ? (
          <>
            {/* Welcome Card */}
            <div className="col-span-full p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-3">Welcome, {user.displayName || user.email}</h2>
              <p className="mb-2">You are successfully authenticated with Firebase!</p>
              
              {dbUser && dbUser.role && (
                <div className="mt-3">
                  <div className="inline-block bg-white text-blue-800 font-medium px-3 py-1 rounded-full text-sm mb-3">
                    {dbUser.role.toUpperCase()}
                  </div>
                  <div className="mt-3">
                    <Link 
                      href={`/dashboard/${dbUser.role}`}
                      className="inline-block px-5 py-3 bg-white text-blue-800 rounded-md hover:bg-gray-100 transition-colors font-medium"
                    >
                      Go to {dbUser.role.charAt(0).toUpperCase() + dbUser.role.slice(1)} Dashboard
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick Access Links */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                Quick Access
              </h3>
              <div className="space-y-2">
                <Link href="/dashboard/events" className="block p-3 hover:bg-gray-50 rounded-md transition-colors">
                  <div className="font-medium">Events</div>
                  <div className="text-sm text-gray-500">Check upcoming events</div>
                </Link>
                <Link href="/dashboard/library/books" className="block p-3 hover:bg-gray-50 rounded-md transition-colors">
                  <div className="font-medium">Library</div>
                  <div className="text-sm text-gray-500">Browse available books</div>
                </Link>
                {dbUser && ['faculty', 'hod', 'librarian'].includes(dbUser.role) && (
                  <>
                    <Link href="/dashboard/safety-alerts" className="block p-3 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
                      <div className="font-medium text-red-700">Safety Alerts</div>
                      <div className="text-sm text-red-600">Create or manage safety alerts</div>
                    </Link>
                    <Link href="/dashboard/faculty/attendance" className="block p-3 hover:bg-gray-50 rounded-md transition-colors">
                      <div className="font-medium">Attendance</div>
                      <div className="text-sm text-gray-500">Manage class attendance</div>
                    </Link>
                  </>
                )}
                {dbUser && dbUser.role === 'student' && (
                  <Link href="/dashboard/student/attendance" className="block p-3 hover:bg-gray-50 rounded-md transition-colors">
                    <div className="font-medium">My Attendance</div>
                    <div className="text-sm text-gray-500">View your attendance records</div>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Announcements */}
            <div className="md:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
                </svg>
                Recent Announcements
              </h3>
              
              {announcementsLoading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div 
                      key={announcement._id} 
                      className="bg-white border-l-4 border-blue-500 p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1 relative overflow-hidden group"
                      onClick={() => openAnnouncementModal(announcement)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg text-blue-800">{announcement.title}</h4>
                        <div className="flex items-center gap-2">
                          {announcement.classId ? (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Class
                            </span>
                          ) : (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                              </svg>
                              General
                            </span>
                          )}
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{announcement.createdBy?.displayName || "Faculty"}</span>
                        
                      </div>
                      <p className="mt-3 text-gray-700 whitespace-pre-wrap line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-4 justify-end">
                        <span className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                          View Announcement
                          <EyeIcon className="h-4 w-4 ml-1 mt-1" />
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {['faculty', 'hod'].includes(dbUser?.role) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                      <Link
                        href={`/dashboard/${dbUser.role}/announcements`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Manage Announcements
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No announcements available.</p>
              )}
            </div>
          </>
        ) : (
          // Not signed in section
          <>
            <div className="col-span-full bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Get Started with Campus Connect</h2>
                <p className="text-lg mb-6">Please sign in to access all features of our campus management system.</p>
                <Link
                  href="/auth"
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Sign In Now
                </Link>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-bold mb-3">For Students</h3>
              <ul className="space-y-2 list-disc list-inside text-gray-700">
                <li>Track your attendance</li>
                <li>Check upcoming events</li>
                <li>Borrow library books</li>
                <li>Get announcement updates</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-bold mb-3">For Faculty</h3>
              <ul className="space-y-2 list-disc list-inside text-gray-700">
                <li>Manage class attendance</li>
                <li>Create announcements</li>
                <li>Track assigned classes</li>
                <li>Respond to invites</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-bold mb-3">For HODs</h3>
              <ul className="space-y-2 list-disc list-inside text-gray-700">
                <li>Manage college resources</li>
                <li>Assign teachers to classes</li>
                <li>Monitor library activities</li>
                <li>Create announcements</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

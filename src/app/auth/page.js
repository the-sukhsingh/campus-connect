'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthPage() {
  const [activeAnimation, setActiveAnimation] = useState('student');
  const router = useRouter();
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAnimation(current => {
        if (current === 'student') return 'faculty';
        if (current === 'faculty') return 'hod';
        return 'student';
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-24 left-32 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="z-10 w-full max-w-lg">
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden backdrop-blur-lg backdrop-filter bg-opacity-95 transform transition-all hover:scale-[1.01] border border-gray-200">
          <div className="p-8 sm:p-12">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600 mb-2">
                GNDU Smart Campus
              </h1>
              <p className="text-gray-600">Welcome to the future of campus management</p>
            </div>

            <div className="relative h-56 mb-8 overflow-hidden rounded-xl shadow-md">
              <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                style={{ opacity: activeAnimation === 'student' ? 1 : 0 }}>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-purple-800/90 flex items-center justify-center">
                  <div className="text-center text-white p-6">
                    <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5"></path>
                    </svg>
                    <h3 className="text-xl font-bold mb-1">Student Portal</h3>
                    <p className="opacity-80 text-sm">Access courses, assignments, and campus resources</p>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out" 
                style={{ opacity: activeAnimation === 'faculty' ? 1 : 0 }}>
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/90 to-green-800/90 flex items-center justify-center">
                  <div className="text-center text-white p-6">
                    <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <h3 className="text-xl font-bold mb-1">Faculty Portal</h3>
                    <p className="opacity-80 text-sm">Manage classes, grades, and student communications</p>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out" 
                style={{ opacity: activeAnimation === 'hod' ? 1 : 0 }}>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-blue-800/90 flex items-center justify-center">
                  <div className="text-center text-white p-6">
                    <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <h3 className="text-xl font-bold mb-1">HOD Portal</h3>
                    <p className="opacity-80 text-sm">Oversee department operations and performance</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Link 
                href="/auth/student" 
                className="relative flex items-center justify-center w-full px-6 py-4 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-md overflow-hidden group transform transition-all hover:scale-[1.02] hover:shadow-lg"
              >
                <span className="absolute right-0 w-8 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                  Student Login
                </div>
              </Link>
              
              <Link 
                href="/auth/faculty" 
                className="relative flex items-center justify-center w-full px-6 py-4 text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-800 rounded-lg shadow-md overflow-hidden group transform transition-all hover:scale-[1.02] hover:shadow-lg"
              >
                <span className="absolute right-0 w-8 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  Faculty Login
                </div>
              </Link>
              
              <Link 
                href="/auth/hod" 
                className="relative flex items-center justify-center w-full px-6 py-4 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-md overflow-hidden group transform transition-all hover:scale-[1.02] hover:shadow-lg"
              >
                <span className="absolute right-0 w-8 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  HOD Login
                </div>
              </Link>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Choose your role to access personalized features
              </p>
              <p className="mt-4 text-xs text-gray-400">
                © {new Date().getFullYear()} GNDU Smart Campus | All rights reserved
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add keyframe animation for background blobs */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
// import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
// import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import Image from 'next/image';
import { BookOpen } from 'lucide-react';

export default function AuthPage() {
  const [activeCard, setActiveCard] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const { theme } = useTheme();
  // const router = useRouter();
  

  
  const getCardStyles = (role) => {
    if (activeCard === role || hoveredCard === role) {
      return 'scale-105 shadow-xl z-20';
    }
    return 'scale-100 shadow-lg opacity-90 z-10';
  };
  
  const getRoleIcon = (role) => {
    switch(role) {
      case 'student':
        return (
          <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
          </svg>
        );
      case 'faculty':
        return (
          <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
          </svg>
        );
      case 'hod':
        return (
          <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        );
      default:
        return null;
    }
  };
  
  const getRoleStyles = (role) => {
    // Color schemes adjusted for both dark and light theme
    if (theme === 'dark') {
      switch(role) {
        case 'student':
          return {
            bg: 'bg-gradient-to-r from-indigo-900 to-indigo-700',
            text: 'text-indigo-100',
            highlight: 'text-indigo-300',
            button: 'bg-indigo-700 hover:bg-indigo-800',
            border: 'border-indigo-600'
          };
        case 'faculty':
          return {
            bg: 'bg-gradient-to-r from-emerald-900 to-emerald-700',
            text: 'text-emerald-100',
            highlight: 'text-emerald-300',
            button: 'bg-emerald-700 hover:bg-emerald-800',
            border: 'border-emerald-600'
          };
        case 'hod':
          return {
            bg: 'bg-gradient-to-r from-blue-900 to-blue-700',
            text: 'text-blue-100',
            highlight: 'text-blue-300',
            button: 'bg-blue-700 hover:bg-blue-800',
            border: 'border-blue-600'
          };
      }
    } else {
      switch(role) {
        case 'student':
          return {
            bg: 'bg-gradient-to-r from-indigo-100 to-indigo-200',
            text: 'text-indigo-900',
            highlight: 'text-indigo-700',
            button: 'bg-indigo-600 hover:bg-indigo-700',
            border: 'border-indigo-300'
          };
        case 'faculty':
          return {
            bg: 'bg-gradient-to-r from-emerald-100 to-emerald-200',
            text: 'text-emerald-900',
            highlight: 'text-emerald-700',
            button: 'bg-emerald-600 hover:bg-emerald-700',
            border: 'border-emerald-300'
          };
        case 'hod':
          return {
            bg: 'bg-gradient-to-r from-blue-100 to-blue-200',
            text: 'text-blue-900',
            highlight: 'text-blue-700',
            button: 'bg-blue-600 hover:bg-blue-700',
            border: 'border-blue-300'
          };
      }
    }
    
    // Default fallback
    return {
      bg: theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100',
      text: theme === 'dark' ? 'text-gray-100' : 'text-gray-900',
      highlight: theme === 'dark' ? 'text-gray-300' : 'text-gray-700',
      button: theme === 'dark' ? 'bg-gray-700 hover:bg-gray-800' : 'bg-gray-600 hover:bg-gray-700',
      border: theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
    };
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Classic paper texture background */}
      <div className="absolute inset-0 opacity-5 paper-texture"></div>

      {/* Content */}
      <div className="z-10 w-full max-w-5xl">
        <div className="text-center mb-10">
          <div className={`inline-flex items-center justify-center p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
          <div className="inline-block relative">
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
                <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-400 flex items-center justify-center shadow-inner overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                  <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
              </div>
          </div>
          <h1 className={`font-serif text-4xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Campus Connect
          </h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-lg max-w-xl mx-auto`}>
            Welcome to the next generation campus management platform.
            <span className="block mt-1 font-light italic">Select your role to continue.</span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-10 max-w-4xl mx-auto">
          {['student', 'faculty', 'hod'].map((role) => {
            const styles = getRoleStyles(role);
            
            return (
              <div 
                key={role}
                className={`w-full md:w-1/3 flex-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg border ${styles.border} transition-all duration-500 transform ${getCardStyles(role)}`}
                onMouseEnter={() => setHoveredCard(role)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`${styles.bg} p-6 transition-all duration-300`}>
                  <div className={`text-center ${styles.text}`}>
                    {getRoleIcon(role)}
                    <h2 className="text-xl font-serif font-semibold capitalize">{role} Portal</h2>
                    <p className={`text-sm mt-1 ${styles.highlight}`}>
                      {role === 'student' && "Access courses & campus resources"}
                      {role === 'faculty' && "Manage classes, Study Material & communications"}
                      {role === 'hod' && "Oversee departmental activities & announcements"}
                    </p>
                  </div>
                </div>
                
                <div className="p-5">
                  <Link 
                    href={`/auth/${role}`}
                    className={`block w-full py-3 px-4 rounded-md text-center text-white ${styles.button} transition-all duration-300 transform hover:scale-[1.02] shadow-md font-medium`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)} Login
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-12 text-center">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose your role to access personalized campus features
          </p>
          <p className={`mt-4 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
            © {new Date().getFullYear()} Campus Connect | All rights reserved
          </p>
        </div>
      </div>
      
      <style jsx>{`
        .paper-texture {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239C92AC' fill-opacity='0.4' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: repeat;
          ${theme === 'dark' ? 'filter: invert(0.8);' : ''}
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (prefers-reduced-motion: no-preference) {
          .animate-fade-in {
            animation: fadeIn 0.6s ease-out forwards;
          }
        }
                  @keyframes shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(150%); }
        }
      `}</style>
    </div>
  );
}
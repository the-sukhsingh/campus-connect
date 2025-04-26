'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthPage() {
  const [activeCard, setActiveCard] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [particles, setParticles] = useState([]);
  const router = useRouter();
  
  // Create floating particles in the background
  useEffect(() => {
    const particleCount = 40;
    const newParticles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
      color: [
        'bg-slate-400', 'bg-slate-300', 'bg-blue-300',
        'bg-indigo-300', 'bg-emerald-300', 'bg-gray-300'
      ][Math.floor(Math.random() * 6)]
    }));
    
    setParticles(newParticles);
    
    const interval = setInterval(() => {
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          x: ((particle.x + particle.speedX + 100) % 100),
          y: ((particle.y + particle.speedY + 100) % 100),
        }))
      );
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  // Rotate through cards for automatic showcase animation
  useEffect(() => {
    const roles = ['student', 'faculty', 'hod'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      setActiveCard(roles[currentIndex]);
      currentIndex = (currentIndex + 1) % roles.length;
    }, 2000);
    
    // Initial setting
    setActiveCard('student');
    
    return () => clearInterval(interval);
  }, []);
  
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5"></path>
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
    switch(role) {
      case 'student':
        return {
          bg: 'from-indigo-500 to-indigo-700',
          text: 'text-indigo-100',
          highlight: 'text-indigo-200',
          button: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'
        };
      case 'faculty':
        return {
          bg: 'from-emerald-500 to-emerald-700',
          text: 'text-emerald-50',
          highlight: 'text-emerald-200',
          button: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
        };
      case 'hod':
        return {
          bg: 'from-blue-500 to-blue-700',
          text: 'text-blue-50',
          highlight: 'text-blue-200',
          button: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
        };
      default:
        return {
          bg: 'from-gray-500 to-gray-700',
          text: 'text-gray-100',
          highlight: 'text-gray-200',
          button: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${particle.color}`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              transition: 'left 0.5s linear, top 0.5s linear'
            }}
          />
        ))}
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-pattern opacity-5"></div>
      </div>

      {/* Content */}
      <div className="z-10 w-full max-w-5xl">
        <div className="text-center mb-10">
          <div className="inline-block rounded-full bg-white p-3 shadow-lg mb-5">
            <svg className="w-12 h-12 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 inline-block text-transparent bg-clip-text">
            GNDU Smart Campus
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Welcome to the next generation campus management platform. Select your role to continue.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-5 md:gap-8 max-w-4xl mx-auto">
          {['student', 'faculty', 'hod'].map((role) => {
            const styles = getRoleStyles(role);
            
            return (
              <div 
                key={role}
                className={`w-full md:w-1/3 flex-1 bg-white rounded-2xl overflow-hidden backdrop-blur-sm bg-opacity-70 shadow-lg border border-gray-100 transition-all duration-500 transform ${getCardStyles(role)}`}
                onMouseEnter={() => setHoveredCard(role)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`bg-gradient-to-br ${styles.bg} p-6 transition-all duration-300`}>
                  <div className={`text-center ${styles.text}`}>
                    {getRoleIcon(role)}
                    <h2 className="text-xl font-semibold">{role.charAt(0).toUpperCase() + role.slice(1)} Portal</h2>
                    <p className={`text-sm opacity-90 mt-1 ${styles.highlight}`}>
                      {role === 'student' && "Access courses, assignments, and campus resources"}
                      {role === 'faculty' && "Manage classes, grades, and student communications"}
                      {role === 'hod' && "Oversee department operations and performance"}
                    </p>
                  </div>
                </div>
                
                <div className="p-5">
                  <Link 
                    href={`/auth/${role}`}
                    className={`block w-full py-3 px-4 rounded-lg text-center text-white bg-gradient-to-r ${styles.button} transition-all duration-300 transform hover:scale-[1.02] shadow-md font-medium`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)} Login
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            Choose your role to access personalized campus features
          </p>
          <p className="mt-4 text-xs text-gray-500">
            © {new Date().getFullYear()} GNDU Smart Campus | All rights reserved
          </p>
        </div>
      </div>
      
      <style jsx>{`
        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (prefers-reduced-motion: no-preference) {
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
          }
        }
      `}</style>
    </div>
  );
}
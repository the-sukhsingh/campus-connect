'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function StudentAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [floatingLabels, setFloatingLabels] = useState({ email: false, password: false });
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 0, y: 0 });

  // Interactive background effect
  const handleMouseMove = (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    setBackgroundPosition({ x, y });
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    // Validate student email domain if needed
    // if (!email.toLowerCase().endsWith('@student.gndu.ac.in')) {
    //   setError('Please use your student email address (@student.gndu.ac.in)');
    //   return false;
    // }
    
    return true;
  };

  const getReadableErrorMessage = (errorMsg) => {
    if (errorMsg.includes('auth/wrong-password') || errorMsg.includes('auth/user-not-found')) {
      return 'Invalid email or password. Please try again.';
    } else if (errorMsg.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Please sign in instead.';
    } else if (errorMsg.includes('auth/weak-password')) {
      return 'Password is too weak. Please choose a stronger password.';
    } else if (errorMsg.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    } else if (errorMsg.includes('auth/network-request-failed')) {
      return 'Network error. Please check your internet connection and try again.';
    } else if (errorMsg.includes('auth/too-many-requests')) {
      return 'Too many unsuccessful login attempts. Please try again later or reset your password.';
    }
    return errorMsg || 'An error occurred. Please try again.';
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Sign up and then save role to MongoDB
        const userCredential = await signUpWithEmail(email, password);
        
        // Set user role to student in the database
        await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseUid: userCredential.user?.uid,
            role: 'student', // Explicitly set role as student
            email: email.toLowerCase(),
            displayName: userCredential.user.displayName || email.split('@')[0],
          }),
        });
        
        router.push('/dashboard/student');
      } else {
        const userCredential = await signInWithEmail(email, password);
        
        // Verify if the user is a student
        const response = await fetch(`/api/user/firebase/${userCredential.user.uid}`);
        const userData = await response.json();
        
        if (userData.role !== 'student') {
          throw new Error('auth/wrong-role');
        }
        
        router.push('/dashboard/student');
      }
    } catch (error) {
      if (error.message === 'auth/wrong-role') {
        setError('This account does not have student privileges. Please use the correct login page for your role.');
      } else {
        setError(getReadableErrorMessage(error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      const result = await signInWithGoogle();
      
      // Check if user already exists
      const userResponse = await fetch(`/api/user/firebase/${result.user.uid}`);
      const existingUser = await userResponse.json();
      
      if (existingUser && existingUser._id && existingUser.role !== 'student') {
        throw new Error('auth/wrong-role');
      }
      
      // Set user role to student in the database
      await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: result.user?.uid,
          role: 'student', // Explicitly set role as student
          email: result.user.email?.toLowerCase(),
          displayName: result.user.displayName,
        }),
      });
      
      router.push('/dashboard/student');
    } catch (error) {
      if (error.message === 'auth/wrong-role') {
        setError('This Google account is already registered with a different role. Please use the correct login page for your role.');
      } else {
        setError(getReadableErrorMessage(error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = (field) => {
    setFloatingLabels(prev => ({...prev, [field]: true}));
  };

  const handleInputBlur = (field, value) => {
    if (!value) {
      setFloatingLabels(prev => ({...prev, [field]: false}));
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-r from-purple-900 to-indigo-800 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Interactive particle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at ${backgroundPosition.x * 100}% ${backgroundPosition.y * 100}%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
            transition: 'background-position 0.2s ease-out'
          }}
        />
        <div className="student-particles"></div>
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm backdrop-filter bg-opacity-95 dark:bg-opacity-80 transform transition-all hover:scale-[1.01]">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-5 rounded-full bg-gradient-to-br from-purple-600 to-indigo-500 shadow-lg">
                <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500 mb-2">
                Student Portal
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {isSignUp 
                  ? 'Create your student account to access campus resources' 
                  : 'Welcome back! Access your student dashboard'
                }
              </p>
            </div>
            
            {error && (
              <div className="relative py-4 px-5 mb-6 text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-200 rounded-lg flex items-center overflow-hidden animate-fade-in">
                <div className="mr-4 flex-shrink-0">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <p className="text-sm font-medium">{error}</p>
                <button 
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  onClick={() => setError('')}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleEmailAuth}>
              <div className="relative">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`peer block w-full px-4 py-3 rounded-lg border ${error && error.includes('email') ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-transparent transition-all`}
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => handleInputFocus('email')}
                  onBlur={(e) => handleInputBlur('email', e.target.value)}
                  disabled={isLoading}
                />
                <label 
                  htmlFor="email-address" 
                  className={`absolute left-4 transition-all duration-200 ${
                    floatingLabels.email || email 
                      ? '-top-2 text-xs text-purple-600 bg-white dark:bg-gray-800 px-1' 
                      : 'top-3 text-gray-500'
                  }`}
                >
                  Email address
                </label>
              </div>
              
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  className={`peer block w-full px-4 py-3 rounded-lg border ${error && error.includes('password') ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-transparent pr-10 transition-all`}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => handleInputFocus('password')}
                  onBlur={(e) => handleInputBlur('password', e.target.value)}
                  disabled={isLoading}
                />
                <label 
                  htmlFor="password" 
                  className={`absolute left-4 transition-all duration-200 ${
                    floatingLabels.password || password 
                      ? '-top-2 text-xs text-purple-600 bg-white dark:bg-gray-800 px-1' 
                      : 'top-3 text-gray-500'
                  }`}
                >
                  Password
                </label>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-end">
                  <div className="text-sm">
                    <Link href="#" className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300">
                      Forgot your password?
                    </Link>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative flex w-full justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 overflow-hidden ${
                    isLoading 
                      ? 'bg-purple-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                  }`}
                >
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-purple-300 group-hover:text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSignUp ? "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" : "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"} />
                    </svg>
                  </span>
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isSignUp ? 'Creating student account...' : 'Signing in...'}
                    </>
                  ) : (
                    <>{isSignUp ? 'Create student account' : 'Sign in as student'}</>
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className={`group relative flex w-full justify-center items-center rounded-lg bg-white dark:bg-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors ${
                    isLoading ? 'cursor-not-allowed opacity-70' : ''
                  }`}
                >
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                  </svg>
                  {isLoading ? 'Signing in...' : 'Sign in with Google'}
                </button>
              </div>
            </div>

            <div className="text-sm text-center mt-6">
              <button 
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                disabled={isLoading}
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>
            </div>
            
            <div className="text-xs text-center mt-6 text-gray-500 dark:text-gray-400">
              <Link href="/auth" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex justify-center items-center">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to main login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Student-specific animated styles */}
      <style jsx>{`
        .student-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: student-particle-move 60s linear infinite;
        }

        @keyframes student-particle-move {
          0% {
            background-position: 0 0, 0 0;
          }
          100% {
            background-position: 1000px 1000px, -1000px -1000px;
          }
        }

        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
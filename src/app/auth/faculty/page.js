'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function FacultyAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [floatingLabels, setFloatingLabels] = useState({ email: false, password: false });
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  
  const [gradientAngle, setGradientAngle] = useState(135);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientAngle(prev => (prev + 1) % 360);
    }, 100);
    
    return () => clearInterval(interval);
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
        const userCredential = await signUpWithEmail(email, password);
        
        await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseUid: userCredential.user?.uid,
            role: 'faculty',
            email: email.toLowerCase(),
            displayName: userCredential.user.displayName || email.split('@')[0],
          }),
        });
        
        router.push('/dashboard/faculty');
      } else {
        const userCredential = await signInWithEmail(email, password);
        
        const response = await fetch(`/api/user/firebase/${userCredential.user.uid}`);
        const userData = await response.json();
        
        if (userData.role !== 'faculty') {
          throw new Error('auth/wrong-role');
        }
        
        router.push('/dashboard/faculty');
      }
    } catch (error) {
      if (error.message === 'auth/wrong-role') {
        setError('This account does not have faculty privileges. Please use the correct login page for your role.');
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
      
      const userResponse = await fetch(`/api/user/firebase/${result.user.uid}`);
      const existingUser = await userResponse.json();
      
      if (existingUser && existingUser._id && existingUser.role !== 'faculty') {
        throw new Error('auth/wrong-role');
      }
      
      await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: result.user?.uid,
          role: 'faculty',
          email: result.user.email?.toLowerCase(),
          displayName: result.user.displayName,
        }),
      });
      
      router.push('/dashboard/faculty');
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
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" 
      style={{ 
        background: `linear-gradient(${gradientAngle}deg, #166534 0%, #14532d 25%, #064e3b 50%, #0f766e 75%, #0e7490 100%)`
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none shapes-container">
        <div className="green-shape-1"></div>
        <div className="green-shape-2"></div>
        <div className="green-shape-3"></div>
        <div className="green-shape-4"></div>
        <div className="green-shape-5"></div>
      </div>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="light-beam light-beam-1"></div>
        <div className="light-beam light-beam-2"></div>
      </div>
      
      <div className="z-10 w-full max-w-md">
        <div className="backdrop-filter backdrop-blur-lg bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl border border-green-100 dark:border-green-900">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 shadow-lg">
                <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500 dark:from-green-400 dark:to-emerald-300 mb-2">
                Faculty Portal
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {isSignUp 
                  ? 'Create your faculty account to connect with students' 
                  : 'Welcome back! Access your teaching resources'
                }
              </p>
              
              <div className="mt-4 inline-flex items-center justify-center bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full px-3 py-1 text-xs font-medium">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                Secure faculty access
              </div>
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
                  className={`peer block w-full px-4 py-3 rounded-lg border ${error && error.includes('email') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-transparent transition-all`}
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
                      ? '-top-2 text-xs text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 px-1' 
                      : 'top-3 text-gray-500 dark:text-gray-400'
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
                  className={`peer block w-full px-4 py-3 rounded-lg border ${error && error.includes('password') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-transparent pr-10 transition-all`}
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
                      ? '-top-2 text-xs text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 px-1' 
                      : 'top-3 text-gray-500 dark:text-gray-400'
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
                    <Link href="#" className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300">
                      Forgot your password?
                    </Link>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative flex w-full justify-center rounded-lg px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 overflow-hidden ${
                    isLoading 
                      ? 'bg-green-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  }`}
                >
                  <span className="absolute right-0 top-0 w-12 h-full transform translate-x-12 -skew-x-12 bg-white opacity-20 group-hover:-translate-x-full ease-out duration-700"></span>
                  
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-green-300 group-hover:text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSignUp ? "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" : "M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"} />
                    </svg>
                  </span>
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isSignUp ? 'Creating faculty account...' : 'Signing in...'}
                    </>
                  ) : (
                    <>{isSignUp ? 'Create faculty account' : 'Sign in as faculty'}</>
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
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className={`group relative flex w-full justify-center items-center rounded-lg bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
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
                className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors"
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
      
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        
        @keyframes float-reverse {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        
        .green-shape-1 {
          position: absolute;
          width: 300px;
          height: 300px;
          top: -100px;
          left: -100px;
          background: radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, rgba(16, 185, 129, 0.1) 70%, transparent 100%);
          border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
          animation: float 15s ease-in-out infinite;
        }
        
        .green-shape-2 {
          position: absolute;
          width: 400px;
          height: 400px;
          bottom: -150px;
          right: -150px;
          background: radial-gradient(circle, rgba(6, 95, 70, 0.2) 0%, rgba(4, 120, 87, 0.1) 70%, transparent 100%);
          border-radius: 60% 40% 30% 70% / 50% 60% 30% 60%;
          animation: float-reverse 18s ease-in-out infinite;
        }
        
        .green-shape-3 {
          position: absolute;
          width: 200px;
          height: 200px;
          top: 30%;
          right: 10%;
          background: radial-gradient(circle, rgba(6, 78, 59, 0.15) 0%, rgba(5, 150, 105, 0.08) 70%, transparent 100%);
          border-radius: 30% 70% 50% 50% / 50% 40% 60% 50%;
          animation: float 20s ease-in-out infinite;
        }
        
        .green-shape-4 {
          position: absolute;
          width: 250px;
          height: 250px;
          bottom: 20%;
          left: 5%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.08) 70%, transparent 100%);
          border-radius: 50% 50% 30% 70% / 60% 40% 70% 40%;
          animation: float-reverse 25s ease-in-out infinite;
        }
        
        .green-shape-5 {
          position: absolute;
          width: 180px;
          height: 180px;
          top: 20%;
          left: 10%;
          background: radial-gradient(circle, rgba(4, 120, 87, 0.15) 0%, rgba(6, 95, 70, 0.08) 70%, transparent 100%);
          border-radius: 70% 30% 50% 50% / 40% 60% 40% 60%;
          animation: float 22s ease-in-out infinite;
        }
        
        .light-beam {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.05;
          pointer-events: none;
          background: linear-gradient(45deg, transparent 45%, #ffffff 45%, #ffffff 55%, transparent 55%);
        }
        
        .light-beam-1 {
          transform: translateX(-50%) rotate(45deg) scale(2);
          animation: move-beam-1 20s linear infinite;
        }
        
        .light-beam-2 {
          transform: translateX(50%) rotate(-45deg) scale(2);
          animation: move-beam-2 30s linear infinite;
        }
        
        @keyframes move-beam-1 {
          0% { transform: translateX(-100%) rotate(45deg) scale(2); }
          100% { transform: translateX(100%) rotate(45deg) scale(2); }
        }
        
        @keyframes move-beam-2 {
          0% { transform: translateX(100%) rotate(-45deg) scale(2); }
          100% { transform: translateX(-100%) rotate(-45deg) scale(2); }
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
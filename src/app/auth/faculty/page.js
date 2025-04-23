'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FacultyAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [floatingLabels, setFloatingLabels] = useState({ email: false, password: false });
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!password.trim()) {
      setError('Password is required');
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
      const userCredential = await signInWithEmail(email, password);
      
      // Verify if the user is a faculty member
      const response = await fetch(`/api/user/firebase/${userCredential.user.uid}`);
      const userData = await response.json();
      console.log("Userdata is", userData);

      if (userData.role !== 'faculty' && userData.role !== 'librarian') {
        throw new Error('auth/wrong-role');
      }
      
      router.push(`/dashboard/${userData.role}`);
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
      
      // Check if user already exists
      const userResponse = await fetch(`/api/user/firebase/${result.user.uid}`);
      const existingUser = await userResponse.json();
      
      if (existingUser && existingUser._id && existingUser.role !== 'faculty') {
        throw new Error('auth/wrong-role');
      } else if (!existingUser || !existingUser._id) {
        throw new Error('auth/no-account');
      }
      
      router.push('/dashboard/faculty');
    } catch (error) {
      if (error.message === 'auth/wrong-role') {
        setError('This Google account is already registered with a different role. Please use the correct login page for your role.');
      } else if (error.message === 'auth/no-account') {
        setError('Your account doesn\'t exist. Faculty accounts can only be created by HOD. Please contact your department head.');
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
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
       {/* Animated bubbles */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bubble-1"></div>
        <div className="bubble-2"></div>
        <div className="bubble-3"></div>
        <div className="bubble-4"></div>
        <div className="bubble-5"></div>
        <div className="bubble-6"></div>
        <div className="bubble-7"></div>
        <div className="bubble-8"></div>

      </div>
      
      <div className="z-10 w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden backdrop-filter backdrop-blur-sm bg-opacity-95 dark:bg-opacity-80 transform transition-all hover:scale-[1.01] border border-green-200 dark:border-green-900">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-5 rounded-full bg-gradient-to-br from-green-600 to-green-800 shadow-lg">
                <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-600 mb-2">
                Faculty Portal
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Sign in to access your teaching dashboard
              </p>
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <svg className="inline-block w-4 h-4 mr-1 -mt-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                  Faculty accounts can only be created by HODs
                </p>
              </div>
            </div>
            
            {error && (
              <div className="relative py-4 px-5 mb-6 text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-200 rounded-lg flex items-center">
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
                  className={`peer block w-full px-4 py-3 rounded-lg border ${error && error.includes('email') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-transparent transition-all`}
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
                  autoComplete="current-password"
                  required
                  className={`peer block w-full px-4 py-3 rounded-lg border ${error && error.includes('password') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-transparent pr-10 transition-all`}
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

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <Link href="#" className="font-medium text-green-600 hover:text-green-300 dark:text-green-400 dark:hover:text-green-300">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative flex w-full justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300 overflow-hidden ${
                    isLoading 
                      ? 'bg-green-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900'
                  }`}
                >
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-green-300 group-hover:text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </span>
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>Sign in as faculty</>
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
                  className={`group relative flex w-full justify-center items-center rounded-lg bg-white dark:bg-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300 transition-colors ${
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
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .bg-pattern {
          background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0);
          background-size: 20px 20px;
        }
           @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes bubble-move {
          0% { transform: translate(0, 100vh) scale(0); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translate(0, -100vh) scale(1); opacity: 0; }
        }

        .bg-pattern {
          background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0);
          background-size: 20px 20px;
        }

        .bubble-1, .bubble-2, .bubble-3, .bubble-4, .bubble-5 {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          pointer-events: none;
        }

        .bubble-1 {
          width: 80px;
          height: 80px;
          left: 10%;
          animation: bubble-move 8s infinite linear;
        }

        .bubble-2 {
          width: 360px;
          height: 360px;
          left: 30%;
          animation: bubble-move 12s infinite linear;
          animation-delay: -2s;
        }

        .bubble-3 {
          width: 140px;
          height: 140px;
          left: 50%;
          animation: bubble-move 10s infinite linear;
          animation-delay: -5s;
        }

        .bubble-4 {
          width: 270px;
          height: 270px;
          left: 70%;
          animation: bubble-move 14s infinite linear;
          animation-delay: -7s;
        }

        .bubble-5 {
          width: 450px;
          height: 450px;
          left: 90%;
          animation: bubble-move 11s infinite linear;
          animation-delay: -3s;
        }
        .bubble-6 {
          width: 690px;
          height: 690px;
          left: 20%;
          animation: bubble-move 9s infinite linear;
          animation-delay: -4s;
        }
        .bubble-7 {
          width: 330px;
          height: 330px;
          left: 40%;
          animation: bubble-move 13s infinite linear;
          animation-delay: -6s;
        }
        .bubble-8 {
          width: 120px;
          height: 120px;
          left: 60%;
          animation: bubble-move 15s infinite linear;
          animation-delay: -8s;
        }
      `}</style>
    </div>
  );
}
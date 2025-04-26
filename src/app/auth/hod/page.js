'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HodAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [floatingLabels, setFloatingLabels] = useState({ email: false, password: false });
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  
  // Animation state
  const [constellations, setConstellations] = useState([]);
  
  // Generate constellation nodes and connections
  useEffect(() => {
    const generateConstellations = () => {
      // Generate nodes (stars)
      const nodes = Array.from({ length: 40 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        pulseSpeed: Math.random() * 3 + 1,
      }));
      
      // Generate connections between some nodes
      const connections = [];
      for (let i = 0; i < 20; i++) {
        const startIndex = Math.floor(Math.random() * nodes.length);
        let endIndex;
        do {
          endIndex = Math.floor(Math.random() * nodes.length);
        } while (startIndex === endIndex);
        
        connections.push({
          start: startIndex,
          end: endIndex,
          opacity: Math.random() * 0.15 + 0.05
        });
      }
      
      setConstellations({ nodes, connections });
    };
    
    generateConstellations();
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
        // Sign up and then save role to MongoDB
        const userCredential = await signUpWithEmail(email, password);
        
        // Set user role to HOD in the database
        await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseUid: userCredential.user?.uid,
            role: 'hod', // Explicitly set role as HOD
            email: email.toLowerCase(),
            displayName: userCredential.user.displayName || email.split('@')[0],
          }),
        });
        
        router.push('/dashboard/hod');
      } else {
        const userCredential = await signInWithEmail(email, password);
        
        // Verify if the user is a HOD
        const response = await fetch(`/api/user/firebase/${userCredential.user.uid}`);
        const userData = await response.json();
        
        if (userData.role !== 'hod') {
          throw new Error('auth/wrong-role');
        }
        
        router.push('/dashboard/hod');
      }
    } catch (error) {
      if (error.message === 'auth/wrong-role') {
        setError('This account does not have HOD privileges. Please use the correct login page for your role.');
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
      
      if (existingUser && existingUser._id && existingUser.role !== 'hod') {
        throw new Error('auth/wrong-role');
      }
      
      // Set user role to HOD in the database
      await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: result.user?.uid,
          role: 'hod', // Explicitly set role as HOD
          email: result.user.email?.toLowerCase(),
          displayName: result.user.displayName,
        }),
      });
      
      router.push('/dashboard/hod');
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
  
  // const getReadableErrorMessage = (errorMsg) => {
  //   if (errorMsg.includes('auth/wrong-password') || errorMsg.includes('auth/user-not-found')) {
  //     return 'Invalid email or password. Please try again.';
  //   } else if (errorMsg.includes('auth/email-already-in-use')) {
  //     return 'An account with this email already exists. Please sign in instead.';
  //   } else if (errorMsg.includes('auth/weak-password')) {
  //     return 'Password is too weak. Please choose a stronger password.';
  //   } else if (errorMsg.includes('auth/invalid-email')) {
  //     return 'Please enter a valid email address.';
  //   } else if (errorMsg.includes('auth/network-request-failed')) {
  //     return 'Network error. Please check your internet connection and try again.';
  //   } else if (errorMsg.includes('auth/too-many-requests')) {
  //     return 'Too many unsuccessful login attempts. Please try again later or reset your password.';
  //   }
  //   return errorMsg || 'An error occurred. Please try again.';
  // };

  // const handleEmailAuth = async (e) => {
  //   e.preventDefault();
  //   setError('');
    
  //   if (!validateForm()) return;

  //   setIsLoading(true);
    
  //   try {
  //     if (isSignUp) {
  //       // Sign up and then save role to MongoDB
  //       const userCredential = await signUpWithEmail(email, password);
        
  //       // Set user role to HOD in the database
  //       await fetch('/api/user', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           firebaseUid: userCredential.user?.uid,
  //           role: 'hod', // Explicitly set role as HOD
  //           email: email.toLowerCase(),
  //           displayName: userCredential.user.displayName || email.split('@')[0],
  //         }),
  //       });
        
  //       router.push('/dashboard/hod');
  //     } else {
  //       const userCredential = await signInWithEmail(email, password);
        
  //       // Verify if the user is a HOD
  //       const response = await fetch(`/api/user/firebase/${userCredential.user.uid}`);
  //       const userData = await response.json();
        
  //       if (userData.role !== 'hod') {
  //         throw new Error('auth/wrong-role');
  //       }
        
  //       router.push('/dashboard/hod');
  //     }
  //   } catch (error) {
  //     if (error.message === 'auth/wrong-role') {
  //       setError('This account does not have HOD privileges. Please use the correct login page for your role.');
  //     } else {
  //       setError(getReadableErrorMessage(error.message));
  //     }
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleGoogleSignIn = async () => {
  //   setError('');
  //   setIsLoading(true);
    
  //   try {
  //     const result = await signInWithGoogle();
      
  //     // Check if user already exists in our database
  //     const userResponse = await fetch(`/api/user/firebase/${result.user.uid}`);
  //     const existingUser = await userResponse.json();
      
  //     // If user doesn't exist or is not a HOD, show error and sign them out
  //     if (!existingUser || !existingUser._id) {
  //       // Sign out the user from Firebase as they're not in our database
  //       await auth.signOut();
  //       throw new Error('auth/no-account');
  //     } else if (existingUser.role !== 'hod') {
  //       // If user exists but is not a HOD, sign them out
  //       await auth.signOut();
  //       throw new Error('auth/wrong-role');
  //     }
      
  //     router.push('/dashboard/hod');
  //   } catch (error) {
  //     if (error.message === 'auth/wrong-role') {
  //       setError('This Google account is already registered with a different role. Please use the correct login page for your role.');
  //     } else if (error.message === 'auth/no-account') {
  //       setError('Your account doesn\'t exist. HOD accounts can only be created by system administrators. Please contact IT support.');
  //     } else {
  //       setError(getReadableErrorMessage(error.message));
  //     }
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleInputFocus = (field) => {
    setFloatingLabels(prev => ({...prev, [field]: true}));
  };

  const handleInputBlur = (field, value) => {
    if (!value) {
      setFloatingLabels(prev => ({...prev, [field]: false}));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900">
      {/* Animated constellation background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none constellation-bg">
        {constellations.nodes?.map((node, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-300"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.size}px`,
              height: `${node.size}px`,
              opacity: node.opacity,
              animation: `pulse ${node.pulseSpeed}s infinite ease-in-out alternate`
            }}
          />
        ))}
        
        {/* SVG layer for constellation connections */}
        <svg className="absolute inset-0 w-full h-full">
          {constellations.connections?.map((connection, i) => {
            if (!constellations.nodes) return null;
            const start = constellations.nodes[connection.start];
            const end = constellations.nodes[connection.end];
            
            if (!start || !end) return null;
            
            return (
              <line
                key={i}
                x1={`${start.x}%`}
                y1={`${start.y}%`}
                x2={`${end.x}%`}
                y2={`${end.y}%`}
                stroke="rgba(147, 197, 253, 0.2)"
                strokeWidth="0.5"
                strokeDasharray="3,3"
                className="constellation-line"
              />
            );
          })}
        </svg>
        
        {/* Light glow effect at the center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400 rounded-full opacity-5 filter blur-3xl"></div>
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="backdrop-filter backdrop-blur-lg bg-white/10 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.01] border border-gray-700">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5 rounded-full bg-gradient-to-br from-blue-800 via-blue-600 to-indigo-800 shadow-xl">
                <div className="absolute inset-0 rounded-full bg-blue-600 opacity-30 animate-pulse"></div>
                <svg className="h-10 w-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 blur transform transition duration-200"></div>
              </div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                Department Head Portal
              </h1>
              <p className="mt-2 text-sm text-blue-200">
                {isSignUp 
                  ? 'Create your HOD account to manage your department' 
                  : 'Welcome back! Access your administrative dashboard'
                }
              </p>
            </div>
            
            {error && (
              <div className="relative py-3 px-4 mb-6 text-red-200 bg-red-900/30 rounded-md flex items-center overflow-hidden fade-in">
                <div className="mr-3 flex-shrink-0">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <p className="text-sm">{error}</p>
                <button 
                  className="absolute top-2 right-2 text-red-300 hover:text-red-100"
                  onClick={() => setError('')}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <form className="space-y-5" onSubmit={handleEmailAuth}>
              <div className="relative">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="peer block w-full px-4 py-3 rounded-md border border-gray-600 focus:border-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-40 bg-gray-800/50 text-white placeholder-transparent transition-all duration-300 focus:outline-none"
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
                      ? '-top-2 text-xs text-blue-300 bg-[var(--background)] px-1' 
                      : 'top-3 text-gray-400'
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
                  className="peer block w-full px-4 py-3 rounded-md border border-gray-600 focus:border-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-40 bg-gray-800/50 text-white placeholder-transparent pr-10 transition-all duration-300 focus:outline-none"
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
                      ? '-top-2 text-xs text-blue-300 bg-[var(--background)] px-1' 
                      : 'top-3 text-gray-400'
                  }`}
                >
                  Password
                </label>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-300"
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
                    <Link href="#" className="font-medium text-blue-300 hover:text-blue-200 transition-colors">
                      Forgot your password?
                    </Link>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative flex w-full justify-center rounded-md px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 overflow-hidden ${
                    isLoading 
                      ? 'bg-blue-700 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSignUp ? "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" : "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"} />
                    </svg>
                  </span>
                  <span className="flex items-center">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isSignUp ? 'Creating HOD account...' : 'Signing in...'}
                      </>
                    ) : (
                      <>{isSignUp ? 'Create HOD account' : 'Sign in as HOD'}</>
                    )}
                  </span>
                  
                  {/* Button highlight effect */}
                  <span className="absolute inset-0 overflow-hidden">
                    <span className="absolute left-0 top-0 h-full w-0 bg-gradient-to-r from-blue-400/20 to-transparent group-hover:w-full transition-all duration-500 ease-out"></span>
                  </span>
                </button>
              </div>
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[var(--background)] text-gray-400">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className={`group relative w-full flex justify-center items-center py-3 px-4 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${
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
                  
                  {/* Button highlight effect */}
                  <span className="absolute inset-0 overflow-hidden rounded-md">
                    <span className="absolute left-0 top-0 h-full w-0 bg-gray-600/20 group-hover:w-full transition-all duration-500 ease-out"></span>
                  </span>
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
                className="font-medium text-blue-300 hover:text-blue-200 transition-colors"
                disabled={isLoading}
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>
            </div>
            
            <div className="text-xs text-center mt-6 text-gray-500">
              <Link href="/auth" className="group hover:text-blue-300 transition-colors flex justify-center items-center">
                <svg className="h-4 w-4 mr-1 group-hover:transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to main login
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: var(--opacity); transform: scale(1); }
          100% { opacity: calc(var(--opacity) * 1.5); transform: scale(1.3); }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .constellation-bg {
          background-color: transparent;
        }
        
        .constellation-line {
          animation: lineFade 8s infinite alternate ease-in-out;
        }
        
        @keyframes lineFade {
          0% { opacity: 0.05; }
          50% { opacity: 0.2; }
          100% { opacity: 0.05; }
        }
      `}</style>
    </div>
  );
}
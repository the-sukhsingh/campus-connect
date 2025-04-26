'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [floatingLabels, setFloatingLabels] = useState({ email: false, password: false });
  const { signInWithEmail, signInWithGoogle, auth } = useAuth();
  const router = useRouter();

  // Animation states for creative background
  const [planes, setPlanes] = useState([]);
  const [books, setBooks] = useState([]);
  const [bubbles, setBubbles] = useState([]);

  // Generate floating elements for creative animation
  useEffect(() => {
    // Paper planes animation
    const generatePlanes = () => {
      const newPlanes = Array.from({ length: 8 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 25 + 10,
        rotation: Math.random() * 360,
        opacity: Math.random() * 0.3 + 0.1,
        speed: Math.random() * 40 + 20,
        delay: Math.random() * 5
      }));
      setPlanes(newPlanes);
    };

    // Book animations
    const generateBooks = () => {
      const bookColors = ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC'];
      const newBooks = Array.from({ length: 12 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        width: Math.random() * 30 + 20,
        height: Math.random() * 20 + 25,
        rotation: Math.random() * 45 - 22.5,
        color: bookColors[Math.floor(Math.random() * bookColors.length)],
        opacity: Math.random() * 0.2 + 0.05,
        speed: Math.random() * 15 + 10,
        delay: Math.random() * 5
      }));
      setBooks(newBooks);
    };

    // Knowledge bubbles
    const generateBubbles = () => {
      const newBubbles = Array.from({ length: 15 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 60 + 20,
        opacity: Math.random() * 0.1 + 0.02,
        speed: Math.random() * 30 + 15,
        blur: Math.random() * 8 + 2
      }));
      setBubbles(newBubbles);
    };

    generatePlanes();
    generateBooks();
    generateBubbles();

    // Slowly animate books and bubbles
    const interval = setInterval(() => {
      setBooks(prevBooks =>
        prevBooks.map(book => ({
          ...book,
          y: ((book.y - 0.1 + 100) % 100),
          rotation: book.rotation + (Math.random() * 0.5 - 0.25)
        }))
      );

      setBubbles(prevBubbles =>
        prevBubbles.map(bubble => ({
          ...bubble,
          y: ((bubble.y - 0.2 + 100) % 100),
          x: bubble.x + (Math.random() * 0.4 - 0.2),
          size: bubble.size + (Math.random() * 0.6 - 0.3)
        }))
      );
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

      // Verify if the user is a student
      const response = await fetch(`/api/user/firebase/${userCredential.user.uid}`);
      const userData = await response.json();

      if (userData.role !== 'student') {
        throw new Error('auth/wrong-role');
      }

      router.push('/dashboard/student');
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

      // Check if user already exists in our database
      const userResponse = await fetch(`/api/user/firebase/${result.user.uid}`);
      const existingUser = await userResponse.json();

      // If user doesn't exist or is not a student, show error and sign them out
      if (!existingUser || !existingUser._id) {
        // Sign out the user from Firebase as they're not in our database
        await auth.signOut();
        throw new Error('auth/no-account');
      } else if (existingUser.role !== 'student') {
        // If user exists but is not a student, sign them out
        await auth.signOut();
        throw new Error('auth/wrong-role');
      }

      router.push('/dashboard/student');
    } catch (error) {
      if (error.message === 'auth/wrong-role') {
        setError('This Google account is already registered with a different role. Please use the correct login page for your role.');
      } else if (error.message === 'auth/no-account') {
        setError('Your account doesn\'t exist. Student accounts can only be created by faculty. Please contact your professor.');
      } else {
        setError(getReadableErrorMessage(error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = (field) => {
    setFloatingLabels(prev => ({ ...prev, [field]: true }));
  };

  const handleInputBlur = (field, value) => {
    if (!value) {
      setFloatingLabels(prev => ({ ...prev, [field]: false }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-800">
      {/* Creative animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Knowledge bubbles in background */}
        {bubbles.map((bubble, i) => (
          <div
            key={`bubble-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              opacity: bubble.opacity,
              background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1))',
              filter: `blur(${bubble.blur}px)`,
              transition: 'top 1s ease-in-out, left 1s ease-in-out, size 1s ease-in-out',
              zIndex: 1
            }}
          />
        ))}

        {/* Floating books */}
        {books.map((book, i) => (
          <div
            key={`book-${i}`}
            className="absolute book"
            style={{
              left: `${book.x}%`,
              top: `${book.y}%`,
              width: `${book.width}px`,
              height: `${book.height}px`,
              transform: `rotate(${book.rotation}deg)`,
              background: book.color,
              opacity: book.opacity,
              animation: `float-vertical ${book.speed}s infinite ease-in-out alternate`,
              animationDelay: `${book.delay}s`,
              zIndex: 2,
              borderRadius: '2px 5px 5px 2px'
            }}
          >
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white opacity-30"></div>
            <div className="absolute top-2 left-1 right-3 h-px bg-white opacity-20"></div>
            <div className="absolute top-5 left-1 right-2 h-px bg-white opacity-20"></div>
            <div className="absolute top-9 left-2 right-3 h-px bg-white opacity-20"></div>
          </div>
        ))}

        {/* Paper planes */}
        {planes.map((plane, i) => (
          <div
            key={`plane-${i}`}
            className="absolute paper-plane"
            style={{
              left: `${plane.x}%`,
              top: `${plane.y}%`,
              opacity: plane.opacity,
              transform: `scale(${plane.size / 30}) rotate(${plane.rotation}deg)`,
              animation: `float-around ${plane.speed}s infinite linear`,
              animationDelay: `${plane.delay}s`,
              zIndex: 3
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 14H8V22L12 18L16 22V14H22L12 2Z" fill="white" className="text-white" />
            </svg>
          </div>
        ))}

        {/* Abstract pattern */}
        <div className="absolute inset-0 bg-grid opacity-10"></div>

        {/* Light flare effect */}
        <div className="absolute top-1/3 -left-1/4 w-1/2 h-1/2 bg-blue-400 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-1/2 h-1/2 bg-purple-400 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="backdrop-filter backdrop-blur-lg bg-white/10 rounded-xl shadow-2xl overflow-hidden transform transition-all hover:shadow-2xl border border-white/20">
          <div className="p-8">
            <div className="text-center mb-8 relative">
              <div className="inline-block mb-4 relative">
                <div className="absolute inset-0 bg-indigo-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
                <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-inner overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                  <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                Student Portal
              </h1>
              <p className="mt-2 text-sm text-indigo-200">
                Sign in to access your educational resources
              </p>
              <div className="mt-2 py-2 px-3 bg-indigo-900/50 rounded-md mx-auto max-w-xs border border-indigo-700/50">
                <p className="text-xs text-indigo-300 flex items-center justify-center">
                  <svg className="inline-block w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                  Student accounts can only be created by faculty
                </p>
              </div>
            </div>

            {error && (
              <div className="relative py-3 px-4 mb-6 text-red-200 bg-red-900/30 rounded-md flex items-center overflow-hidden fade-in border border-red-700/30">
                <div className="mr-3 flex-shrink-0">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <p className="text-sm">{error}</p>
                <button 
                  className="absolute top-2 right-2 text-red-400 hover:text-red-300"
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
                  className="peer block w-full px-4 py-3 rounded-md border bg-indigo-900/30 border-indigo-500/50 focus:border-indigo-400 focus:ring focus:ring-indigo-400/30 focus:ring-opacity-50 text-white placeholder-transparent transition-all duration-300 focus:outline-none"
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
                      ? '-top-2 text-xs text-indigo-300 bg-indigo-900 px-1' 
                      : 'top-3 text-indigo-400'
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
                  className="peer block w-full px-4 py-3 rounded-md border bg-indigo-900/30 border-indigo-500/50 focus:border-indigo-400 focus:ring focus:ring-indigo-400/30 focus:ring-opacity-50 text-white placeholder-transparent pr-10 transition-all duration-300 focus:outline-none"
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
                      ? '-top-2 text-xs text-indigo-300 bg-indigo-900 px-1' 
                      : 'top-3 text-indigo-400'
                  }`}
                >
                  Password
                </label>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-indigo-400 hover:text-indigo-300"
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
                  <Link href="#" className="font-medium text-indigo-300 hover:text-indigo-200 transition-colors">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 rounded-md text-white transition-all duration-300 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 overflow-hidden"
                >
                  {/* Button glow effect */}
                  <span className="absolute inset-0 overflow-hidden rounded-md">
                    <span className="absolute left-0 top-0 h-full w-0 bg-white/20 transform skew-x-12 group-hover:w-full group-hover:skew-x-12 transition-all duration-1000 ease-out"></span>
                  </span>

                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </span>
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    <>Sign in as student</>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-indigo-600/30" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-indigo-900 text-indigo-300">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="group relative w-full flex justify-center items-center py-3 px-4 rounded-md border border-indigo-700/50 bg-indigo-800/50 text-white hover:bg-indigo-700/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 overflow-hidden"
                >
                  {/* Button spotlight effect */}
                  <span className="absolute inset-0 w-full h-full">
                    <span className="absolute -left-10 -top-10 h-20 w-20 rounded-full bg-white/10 transition-all duration-1000 group-hover:scale-[12] origin-center opacity-0 group-hover:opacity-100"></span>
                  </span>

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

            <div className="text-xs text-center mt-6 text-indigo-400">
              <Link href="/auth" className="group hover:text-indigo-300 transition-colors flex justify-center items-center">
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
        @keyframes float-vertical {
          0% { transform: translateY(0) rotate(var(--rotation)); }
          100% { transform: translateY(-15px) rotate(calc(var(--rotation) + 2deg)); }
        }

        @keyframes float-around {
          0% { transform: translate(0, 0) scale(var(--scale)) rotate(var(--rotation)); }
          25% { transform: translate(20px, -15px) scale(var(--scale)) rotate(calc(var(--rotation) + 15deg)); }
          50% { transform: translate(40px, 0) scale(var(--scale)) rotate(calc(var(--rotation) + 30deg)); }
          75% { transform: translate(20px, 15px) scale(var(--scale)) rotate(calc(var(--rotation) + 45deg)); }
          100% { transform: translate(0, 0) scale(var(--scale)) rotate(calc(var(--rotation) + 60deg)); }
        }

        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(150%); }
        }

        .fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .paper-plane {
          --scale: 1;
          --rotation: 0deg;
        }

        .book {
          box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
        }

        .bg-grid {
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}
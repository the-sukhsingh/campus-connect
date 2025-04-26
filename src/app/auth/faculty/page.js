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
  const { signInWithEmail, signInWithGoogle, auth } = useAuth();
  const router = useRouter();
  
  // Animation states for creative background
  const [particles, setParticles] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [lightRays, setLightRays] = useState([]);
  
  // Generate creative animated elements for background
  useEffect(() => {
    // Create geometric particles
    const generateParticles = () => {
      const particleCount = 25;
      const newParticles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 2,
        opacity: Math.random() * 0.4 + 0.1,
        rotation: Math.random() * 360,
        type: Math.floor(Math.random() * 3), // 0: circle, 1: square, 2: triangle
        speedX: (Math.random() - 0.5) * 0.05,
        speedY: (Math.random() - 0.5) * 0.05,
        speedRotation: (Math.random() - 0.5) * 0.2,
        color: Math.random() > 0.6 ? 'emerald' : (Math.random() > 0.5 ? 'teal' : 'green')
      }));
      setParticles(newParticles);
    };
    
    // Create larger shapes
    const generateShapes = () => {
      const shapeCount = 8;
      const newShapes = Array.from({ length: shapeCount }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 80 + 40,
        opacity: Math.random() * 0.15 + 0.05,
        rotation: Math.random() * 360,
        type: Math.floor(Math.random() * 4), // 0: circle, 1: square, 2: triangle, 3: hexagon
        blur: Math.random() * 70 + 30
      }));
      setShapes(newShapes);
    };
    
    // Create light rays
    const generateLightRays = () => {
      const rayCount = 5;
      const newRays = Array.from({ length: rayCount }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        length: Math.random() * 200 + 100,
        thickness: Math.random() * 50 + 25,
        rotation: Math.random() * 360,
        opacity: Math.random() * 0.1 + 0.05
      }));
      setLightRays(newRays);
    };
    
    generateParticles();
    generateShapes();
    generateLightRays();
    
    // Animate particles
    const interval = setInterval(() => {
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          x: ((particle.x + particle.speedX + 100) % 100),
          y: ((particle.y + particle.speedY + 100) % 100),
          rotation: (particle.rotation + particle.speedRotation) % 360
        }))
      );
    }, 50);
    
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
        
        // Verify if the user is a faculty
        const response = await fetch(`/api/user/firebase/${userCredential.user.uid}`);
        const userData = await response.json();
        
        // Check if user exists and has the correct role
        if (!userData || !userData._id) {
          throw new Error('auth/no-account');
        } else if (userData.role !== 'faculty' && userData.role !== 'librarian') {
          throw new Error('auth/wrong-role');
        }
        
        router.push(`/dashboard/${userData.role}`);

    } catch (error) {
      if (error.message === 'auth/wrong-role') {
        setError('This account does not have faculty privileges. Please use the correct login page for your role.');
      } else if (error.message === 'auth/no-account') {
        setError('Your account doesn\'t exist. Faculty accounts can only be created by HOD. Please contact administration.');
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
      
      // If user doesn't exist or is not a faculty, show error and sign them out
      if (!existingUser || !existingUser._id) {
        // Sign out the user from Firebase as they're not in our database
        await auth.signOut();
        throw new Error('auth/no-account');
      } else if (existingUser.role !== 'faculty' && existingUser.role !== 'librarian') {
        // If user exists but is not a faculty, sign them out
        await auth.signOut();
        throw new Error('auth/wrong-role');
      }
      
      router.push(`/dashboard/${existingUser.role}`);
    } catch (error) {
      if (error.message === 'auth/wrong-role') {
        setError('This Google account is already registered with a different role. Please use the correct login page for your role.');
      } else if (error.message === 'auth/no-account') {
        setError('Your account doesn\'t exist. Faculty accounts can only be created by HOD. Please contact administration.');
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
  
  // Render different particle shapes
  const renderParticleShape = (type, size, color) => {
    switch(type) {
      case 0: // Circle
        return (
          <div 
            className={`rounded-full bg-${color}-500`} 
            style={{width: `${size}px`, height: `${size}px`}}
          />
        );
      case 1: // Square
        return (
          <div 
            className={`bg-${color}-500`} 
            style={{width: `${size}px`, height: `${size}px`}}
          />
        );
      case 2: // Triangle
        return (
          <div className="triangle-shape" style={{
            width: '0',
            height: '0',
            borderLeft: `${size/2}px solid transparent`,
            borderRight: `${size/2}px solid transparent`,
            borderBottom: `${size}px solid var(--triangle-color)`
          }} />
        );
    }
  };
  
  // Render different background shapes
  const renderBackgroundShape = (type, size, rotation) => {
    switch(type) {
      case 0: // Circle
        return (
          <div 
            className="rounded-full bg-emerald-500" 
            style={{width: `${size}px`, height: `${size}px`}}
          />
        );
      case 1: // Square
        return (
          <div 
            className="bg-teal-500" 
            style={{
              width: `${size}px`, 
              height: `${size}px`,
              transform: `rotate(${rotation}deg)`
            }}
          />
        );
      case 2: // Triangle
        return (
          <div 
            style={{
              width: '0',
              height: '0',
              borderLeft: `${size/2}px solid transparent`,
              borderRight: `${size/2}px solid transparent`,
              borderBottom: `${size}px solid #10B981`,
              transform: `rotate(${rotation}deg)`
            }} 
          />
        );
      case 3: // Hexagon
        return (
          <div 
            className="hexagon" 
            style={{
              width: `${size/1.5}px`, 
              height: `${size}px`,
              transform: `rotate(${rotation}deg)`
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-teal-900 via-emerald-900 to-green-900">
      {/* Creative animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Light rays */}
        {lightRays.map((ray, i) => (
          <div
            key={`ray-${i}`}
            className="absolute origin-center"
            style={{
              left: `${ray.x}%`,
              top: `${ray.y}%`,
              width: `${ray.length}px`,
              height: `${ray.thickness}px`,
              opacity: ray.opacity,
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.6) 0%, rgba(16, 185, 129, 0) 100%)',
              transform: `rotate(${ray.rotation}deg)`,
              filter: 'blur(10px)',
              zIndex: 1
            }}
          />
        ))}
        
        {/* Large blurred shapes */}
        {shapes.map((shape, i) => (
          <div
            key={`shape-${i}`}
            className="absolute"
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              opacity: shape.opacity,
              filter: `blur(${shape.blur}px)`,
              transform: `rotate(${shape.rotation}deg)`,
              zIndex: 1
            }}
          >
            {renderBackgroundShape(shape.type, shape.size, shape.rotation)}
          </div>
        ))}
        
        {/* Floating geometric particles */}
        {particles.map((particle, i) => (
          <div
            key={`particle-${i}`}
            className="absolute"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.opacity,
              transform: `rotate(${particle.rotation}deg)`,
              transition: 'left 0.5s linear, top 0.5s linear, transform 0.5s linear',
              zIndex: 2,
              '--triangle-color': particle.color === 'emerald' ? '#10B981' : 
                               particle.color === 'teal' ? '#14B8A6' : '#22C55E'
            }}
          >
            {renderParticleShape(particle.type, particle.size, particle.color)}
          </div>
        ))}
        
        {/* Mesh grid pattern */}
        <div className="absolute inset-0 mesh-grid opacity-10"></div>
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="backdrop-filter backdrop-blur-lg bg-white/10 rounded-xl shadow-2xl overflow-hidden transform transition-all hover:shadow-emerald-900/40 border border-emerald-800/30">
          <div className="p-8">
            <div className="text-center mb-8 relative">
              <div className="inline-block mb-4 relative">
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                <div className="relative w-20 h-20 mx-auto rounded-full flex items-center justify-center overflow-hidden">
                  {/* Animated gradient border */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 animate-[spin_8s_linear_infinite]"></div>
                  
                  {/* Inner circle with icon */}
                  <div className="absolute inset-1 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                    </svg>
                  </div>
                </div>
              </div>
              
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                Faculty Portal
              </h1>
              <p className="mt-2 text-sm text-emerald-200">
                Welcome back! Access your teaching dashboard
              </p>
              
              <div className="mt-3 flex justify-center space-x-2">
                <div className="h-1 w-12 rounded-full bg-emerald-500/60"></div>
                <div className="h-1 w-6 rounded-full bg-emerald-500/40"></div>
                <div className="h-1 w-3 rounded-full bg-emerald-500/20"></div>
              </div>
              
              <div className="mt-2 py-2 px-3 bg-emerald-900/50 rounded-md mx-auto max-w-xs border border-emerald-700/50">
                <p className="text-xs text-emerald-300 flex items-center justify-center">
                  <svg className="inline-block w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                  Faculty accounts can only be created by HOD
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
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-teal-400 to-transparent rounded-l-md"></div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="peer block w-full pl-5 pr-4 py-3 rounded-md border border-emerald-700/50 bg-emerald-900/30 focus:border-emerald-400 focus:ring focus:ring-emerald-300/30 text-white placeholder-transparent transition-all duration-300 focus:outline-none"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => handleInputFocus('email')}
                  onBlur={(e) => handleInputBlur('email', e.target.value)}
                  disabled={isLoading}
                />
                <label 
                  htmlFor="email-address" 
                  className={`absolute left-5 transition-all duration-200 ${
                    floatingLabels.email || email 
                      ? '-top-2 text-xs text-emerald-300 bg-emerald-900 px-1' 
                      : 'top-3 text-emerald-400'
                  }`}
                >
                  Email address
                </label>
              </div>
              
              <div className="relative">
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-teal-400 to-transparent rounded-l-md"></div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={"current-password"}
                  required
                  className="peer block w-full pl-5 pr-10 py-3 rounded-md border border-emerald-700/50 bg-emerald-900/30 focus:border-emerald-400 focus:ring focus:ring-emerald-300/30 text-white placeholder-transparent transition-all duration-300 focus:outline-none"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => handleInputFocus('password')}
                  onBlur={(e) => handleInputBlur('password', e.target.value)}
                  disabled={isLoading}
                />
                <label 
                  htmlFor="password" 
                  className={`absolute left-5 transition-all duration-200 ${
                    floatingLabels.password || password 
                      ? '-top-2 text-xs text-emerald-300 bg-emerald-900 px-1' 
                      : 'top-3 text-emerald-400'
                  }`}
                >
                  Password
                </label>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-400 hover:text-emerald-300"
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

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 rounded-md text-white transition-all duration-300 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 overflow-hidden"
                >
                  {/* Animated highlight */}
                  <span className="absolute inset-0 overflow-hidden rounded-md">
                    <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                  </span>
                  
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-emerald-300 group-hover:text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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
                    <>Sign in as faculty</>
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-emerald-700/30" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-emerald-900 text-emerald-300">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="group relative w-full flex justify-center items-center py-3 px-4 rounded-md border border-emerald-700/50 bg-emerald-800/30 text-white hover:bg-emerald-800/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 overflow-hidden"
                >
                  {/* Button ripple effect */}
                  <span className="absolute inset-0 w-full h-full">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-0 w-0 rounded-full bg-emerald-700/30 opacity-0 group-hover:w-[300%] group-hover:h-[300%] group-hover:opacity-100 duration-700 ease-out"></span>
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
            
            <div className="text-xs text-center mt-6 text-emerald-600">
              <Link href="/auth" className="group hover:text-emerald-400 transition-colors flex justify-center items-center">
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
        .mesh-grid {
          background-image: 
            linear-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px),
            linear-gradient(to right, rgba(16, 185, 129, 0.15) 1px, transparent 1px);
          background-size: 30px 30px;
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .hexagon {
          background: #14B8A6;
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
        }
      `}</style>
    </div>
  );
}
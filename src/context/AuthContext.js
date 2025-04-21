'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { getUserByFirebaseUid, getUserByEmail } from '@/services/userServiceClient';

// Define the context type
const AuthContext = createContext({
  user: null,
  dbUser: null,
  userRole: null,
  userVerified: false,
  userCollege: null,
  passwordChanged: null, // Add passwordChanged to context
  loading: true,
  error: null,
  handleUserDataMemoized: async () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  verifyInviteCode: async () => {},
  linkStudentWithCollege: async () => {},
  logout: async () => {},
});

// Create a provider component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userVerified, setUserVerified] = useState(false);
  const [userCollege, setUserCollege] = useState(null);
  const [passwordChanged, setPasswordChanged] = useState(null); // Add passwordChanged state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle user state changes with retry mechanism
  const handleUserData = async (firebaseUser) => {
    setLoading(true);
    try {
      if (firebaseUser) {
        
        // Retry mechanism for getting user data
        let userData = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!userData && attempts < maxAttempts) {
          attempts++;
          
          try {
            userData = await getUserByEmail(firebaseUser.email || '');
            if (!userData) {
              userData = await getUserByFirebaseUid(firebaseUser?.uid);
            }
          } catch (err) {
            console.error(`Attempt ${attempts} failed:`, err);
            
            if (attempts < maxAttempts) {
              // Wait before retrying (exponential backoff)
              const waitTime = 1000 * attempts;
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
        
        if (userData) {
          // User exists in database
          console.log("User data received:", userData); // Debug log
          setDbUser(userData.user);
          setUserRole(userData.user.role);
          setUserVerified(userData.user.isVerified);
          setUserCollege(userData.user.college || null);
          // Set passwordChanged state explicitly, handle both undefined and null cases
          setPasswordChanged(userData.user.passwordChanged !== undefined ? userData.user.passwordChanged : null);
        } else {
          
          // Try to save user to database with retry mechanism using API call
          let newDbUser = null;
          attempts = 0;
          
          while (!newDbUser && attempts < maxAttempts) {
            attempts++;
            
            try {
              // Call API to create a new user
              const response = await fetch('/api/user', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  firebaseUser: {
                    uid: firebaseUser?.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName
                  }
                }),
              });
              
              if (!response.ok) {
                throw new Error('Failed to create user via API');
              }
              
              newDbUser = await response.json();
            } catch (err) {
              console.error(`Attempt ${attempts} failed:`, err);
              
              if (attempts < maxAttempts) {
                // Wait before retrying (exponential backoff)
                const waitTime = 1000 * attempts;
                await new Promise(resolve => setTimeout(resolve, waitTime));
              }
            }
          }
          
          if (newDbUser) {
            console.log("New user created:", newDbUser); // Debug log
            setDbUser(newDbUser.user);
            setUserRole(newDbUser.user.role);
            setUserVerified(newDbUser.user.isVerified);
            setUserCollege(newDbUser.user.college || null);
            // Set passwordChanged state explicitly for new users
            setPasswordChanged(newDbUser.user.passwordChanged !== undefined ? newDbUser.user.passwordChanged : false);
          } else {
            console.error("Failed to save user to database after multiple attempts");
            throw new Error("Failed to create user in database");
          }
        }
      } else {
        // Reset user state when logged out
        setDbUser(null);
        setUserRole(null);
        setUserVerified(false);
        setUserCollege(null);
        setPasswordChanged(null); // Reset passwordChanged when logged out
      }
    } catch (err) {
      const error = err;
      console.error('Error handling user data:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  // Memoize the handleUserData function
  const handleUserDataMemoized = useCallback(handleUserData, []);

  // Set up the auth state listener on mount with proper error handling
  useEffect(() => {
    setLoading(true);
    
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        
        try {
          await handleUserDataMemoized(currentUser);
        } catch (err) {
          console.error("Error in auth state change handler:", err);
        }
      }, (error) => {
        console.error("Auth state change error:", error);
        setError(error);
        setLoading(false);
      });

      // Clean up the listener on unmount
      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error("Error setting up auth listener:", err);
      setError(err);
      setLoading(false);
    }
  }, [handleUserDataMemoized]);

  // Auth methods
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(auth, provider);
    } catch (err) {
      const error = err;
      console.error('Error signinwithgoogle:', error);
      setError(error);
      throw error;
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      setError(null);
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const error = err;
      console.error('Error signinwithEmail:', error);
      setError(error);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password) => {
    try {
      setError(null);
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const error = err;
      console.error('Error signupwithEmail:', error);
      setError(error);
      throw error;
    }
  };

  const verifyInviteCode = async (inviteCode) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          action: 'verify-invite',
          inviteCode
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error verifying invite code:', data.message || 'Verification failed');
        throw new Error(data.message || 'Verification failed');
      }
      
      if (data.success && data.user) {
        await handleUserDataMemoized(user);
      };
      
      return data;
    } catch (err) {
      const error = err;
      console.error('Error verifying invite code:', error);
      setError(error);
      throw error;
    }
  };

  const linkStudentWithCollege = async (collegeId, studentId, department) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          action: 'link-student',
          collegeId,
          studentId,
          department
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error linking student with college:', data.message || 'Linking failed');
        throw new Error(data.message || 'Linking failed');
      }
      
      if (data.success && data.user) {
        await handleUserDataMemoized(user);
      }
      
      return data;
    } catch (err) {
      const error = err;
      console.error('Error linking student with college:', error);
      setError(error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      // State cleanup is handled by the auth state change listener
    } catch (err) {
      const error = err;
      console.error('Error logging out:', error);
      setError(error);
      throw error;
    }
  };

  const value = {
    user,
    dbUser,
    userRole,
    userVerified,
    userCollege,
    passwordChanged, // Add passwordChanged to context value
    loading,
    error,
    handleUserDataMemoized,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    verifyInviteCode,
    linkStudentWithCollege,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export { AuthProvider };
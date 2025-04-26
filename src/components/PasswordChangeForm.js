'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
    EmailAuthProvider, 
    reauthenticateWithCredential, 
    updatePassword 
} from 'firebase/auth';

export default function PasswordChangeForm({ isFirstLogin = false }) {
    const { user, dbUser, handleUserDataMemoized } = useAuth();
    const { theme } = useTheme();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    // Password validation
    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        if (password.length < minLength) {
            return 'Password must be at least 8 characters long';
        }
        if (!hasUpperCase) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!hasLowerCase) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!hasNumbers) {
            return 'Password must contain at least one number';
        }
        if (!hasSpecialChar) {
            return 'Password must contain at least one special character';
        }
        
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            // Validate new password meets requirements
            const passwordError = validatePassword(newPassword);
            if (passwordError) {
                setError(passwordError);
                setLoading(false);
                return;
            }

            // Check if passwords match
            if (newPassword !== confirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }

            if (isFirstLogin) {
                // First login just requires setting a new password
                // Update Firebase password
                await updatePassword(user, newPassword);
                
                // Update database record via our API
                const response = await fetch('/api/user/password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        uid: user.uid,
                        newPassword: newPassword
                    }),
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Error updating password');
                }
                
                // Refresh user data from database
                await handleUserDataMemoized(user);
                
                setSuccess(true);
                // Redirect to dashboard based on role after successful password change
                setTimeout(() => {
                    if (dbUser.role === 'student') {
                        router.push('/dashboard/student');
                    } else if (dbUser.role === 'faculty') {
                        router.push('/dashboard/faculty');
                    } else if (dbUser.role === 'hod') {
                        router.push('/dashboard/hod');
                    } else {
                        router.push('/dashboard');
                    }
                }, 1500);
            } else {
                // Regular password change requires reauthentication
                const credential = EmailAuthProvider.credential(
                    user.email,
                    currentPassword
                );
                
                // Re-authenticate user
                await reauthenticateWithCredential(user, credential);
                
                // Update password
                await updatePassword(user, newPassword);
                
                setSuccess(true);
            }
        } catch (err) {
            console.error('Error changing password:', err);
            if (err.code === 'auth/wrong-password') {
                setError('Current password is incorrect');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak');
            } else if (err.code === 'auth/requires-recent-login') {
                setError('Please log out and log back in before changing your password');
            } else {
                setError(err.message || 'Failed to change password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto my-10 p-6 bg-[var(--card)] text-[var(--card-foreground)] rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-center mb-6 text-[var(--foreground)]">
                {isFirstLogin ? 'Set Your New Password' : 'Change Password'}
            </h2>
            
            {isFirstLogin && (
                <div className={`mb-4 p-3 rounded ${theme === 'dark' ? 'bg-yellow-800/50 text-yellow-50' : ' bg-yellow-50 text-yellow-800'}`}>
                    <p>This appears to be your first login. Please set a new password to continue.</p>
                </div>
            )}
            
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-800 rounded">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-800 rounded">
                    Password changed successfully!
                    {isFirstLogin && 'Redirecting to dashboard...'}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                {!isFirstLogin && (
                    <div className="mb-4">
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                            Current Password
                        </label>
                        <input
                            type="password"
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="mt-1 block w-full border border-[var(--border)] rounded-md shadow-sm p-2
                            bg-[var(--input)] text-[var(--input-foreground)]"
                            required={!isFirstLogin}
                        />
                    </div>
                )}
                
                <div className="mb-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        New Password
                    </label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1 block w-full border border-[var(--border)] rounded-md shadow-sm p-2
                        bg-[var(--input)] text-[var(--input-foreground)]"
                        required
                    />
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Password must be at least 8 characters and include uppercase, lowercase, 
                        numbers, and special characters.
                    </p>
                </div>
                
                <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full border border-[var(--border)] rounded-md shadow-sm p-2
                        bg-[var(--input)] text-[var(--input-foreground)]"
                        required
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex items-center justify-center py-2.5 px-4 border border-transparent 
                    rounded-md shadow-sm text-sm font-medium transition-colors duration-200

                    ${loading 
                        ? 'opacity-70 cursor-not-allowed' 
                        : theme === 'dark'
                        ? 'hover:bg-[var(--primary-dark)]'
                        : 'hover:bg-[var(--primary-light)]'
                    }`}
                >
                    {loading ? (
                        <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[var(--primary-foreground)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        isFirstLogin ? 'Set Password' : 'Change Password'
                    )}
                </button>
            </form>
        </div>
    );
}
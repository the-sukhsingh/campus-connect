'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
    EmailAuthProvider, 
    reauthenticateWithCredential, 
    updatePassword 
} from 'firebase/auth';

export default function PasswordChangeForm({ isFirstLogin = false }) {
    const { user, dbUser, handleUserDataMemoized } = useAuth();
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
        <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-center mb-6">
                {isFirstLogin ? 'Set Your New Password' : 'Change Password'}
            </h2>
            
            {isFirstLogin && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded">
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
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                            Current Password
                        </label>
                        <input
                            type="password"
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required={!isFirstLogin}
                        />
                    </div>
                )}
                
                <div className="mb-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                        New Password
                    </label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Password must be at least 8 characters and include uppercase, lowercase, 
                        numbers, and special characters.
                    </p>
                </div>
                
                <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {loading ? 'Processing...' : 'Change Password'}
                </button>
            </form>
        </div>
    );
}
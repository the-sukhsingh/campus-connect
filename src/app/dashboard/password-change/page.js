'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PasswordChangeForm from '@/components/PasswordChangeForm';

export default function PasswordChangePage() {
  const { user, dbUser, userRole, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // If user is already loaded and not authenticated, redirect to login
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-center mb-6">Change Your Password</h1>
            <PasswordChangeForm isFirstLogin={!dbUser?.passwordChanged} />
          </div>
        </div>
      </div>
    </div>
  );
}
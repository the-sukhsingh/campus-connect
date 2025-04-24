'use client';

import { redirect } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function SafetyAlertsLayout({ children }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      redirect('/auth/login');
    }
  }, [user, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
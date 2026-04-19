import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasAccessToken } from '@/services/auth/auth';

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();

  if (!hasAccessToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { hasAccessToken } from '@/services/auth/auth';

export default function PublicOnlyRoute({ children }: PropsWithChildren) {
  if (hasAccessToken()) {
    return <Navigate to="/episode" replace />;
  }

  return children;
}

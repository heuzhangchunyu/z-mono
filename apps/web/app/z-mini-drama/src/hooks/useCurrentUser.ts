import { useEffect, useState } from 'react';
import { hasAccessToken, readStoredUser, updateStoredUser } from '@/services/auth/auth';
import { fetchCurrentUser } from '@/services/user/user';
import type { CurrentUser } from '@/types/auth';

interface UseCurrentUserResult {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useCurrentUser(): UseCurrentUserResult {
  const storedUser = readStoredUser();
  const [user, setUser] = useState<CurrentUser | null>(
    storedUser
      ? {
          ...storedUser,
          created_at: ''
        }
      : null
  );
  const [loading, setLoading] = useState<boolean>(Boolean(storedUser));
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const nextUser = await fetchCurrentUser();
      updateStoredUser(nextUser);
      setUser(nextUser);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '获取当前用户失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasAccessToken()) {
      return;
    }

    void load();
  }, []);

  return {
    user,
    loading,
    error,
    reload: load
  };
}

import { useEffect, useState } from 'react';
import { fetchHealthStatus } from '@/api/modules/system';
import type { HealthStatus } from '@/types/system';

interface UseHealthCheckResult {
  data: HealthStatus | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useHealthCheck(): UseHealthCheckResult {
  const [data, setData] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const nextData = await fetchHealthStatus();
      setData(nextData);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '加载失败，请稍后重试';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return {
    data,
    loading,
    error,
    reload: load
  };
}

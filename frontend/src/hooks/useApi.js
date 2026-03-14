import { useState, useEffect, useCallback } from 'react';

export function useApi(fetcher, intervalMs = null) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    refetch();
    if (intervalMs) {
      const id = setInterval(refetch, intervalMs);
      return () => clearInterval(id);
    }
  }, [refetch, intervalMs]);

  return { data, error, loading, refetch };
}

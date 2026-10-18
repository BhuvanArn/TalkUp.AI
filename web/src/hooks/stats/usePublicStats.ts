import { getPublicStats } from '@/services/stats/http';
import type { PublicStats } from '@/services/stats/types';
import { useQuery } from '@tanstack/react-query';

export const PUBLIC_STATS_QUERY_KEY = ['stats', 'public'] as const;

/**
 * Public account counter for the landing page. Polls every minute (matches the
 * server-side cache). Errors stay silent: no toast, the counter just hides.
 */
export const usePublicStats = () =>
  useQuery<PublicStats>({
    queryKey: PUBLIC_STATS_QUERY_KEY,
    queryFn: getPublicStats,
    refetchInterval: 60_000,
    staleTime: 60_000,
    retry: 1,
  });

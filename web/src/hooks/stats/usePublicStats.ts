import { getPublicStats } from '@/services/stats/http';
import type { PublicStats } from '@/services/stats/types';
import { useQuery } from '@tanstack/react-query';

export const PUBLIC_STATS_QUERY_KEY = ['stats', 'public'] as const;

/**
 * Public account counter for the landing page. Fetched once per visit: a
 * marketing counter does not need to tick live, and polling from many tabs
 * behind one school IP would hit the per-IP throttle. Errors stay silent: no
 * toast, the counter just hides.
 */
export const usePublicStats = () =>
  useQuery<PublicStats>({
    queryKey: PUBLIC_STATS_QUERY_KEY,
    queryFn: getPublicStats,
    staleTime: Infinity,
    retry: 1,
  });

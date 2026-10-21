import { API_ROUTES } from '../api';
import axiosInstance from '../axiosInstance';
import type { PublicStats } from './types';

/**
 * Public landing stats. Rendered for anonymous visitors, so the call opts out
 * of the interceptor's 401 → refresh → /login escalation (`anonymousAllowed`).
 */
export async function getPublicStats(): Promise<PublicStats> {
  const { data } = await axiosInstance.get<PublicStats>(
    `${API_ROUTES.stats}/public`,
    { anonymousAllowed: true },
  );
  return data;
}

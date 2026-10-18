import { getPublicStats } from '@/services/stats/http';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PUBLIC_STATS_QUERY_KEY, usePublicStats } from './usePublicStats';

vi.mock('@/services/stats/http', () => ({
  getPublicStats: vi.fn(),
}));

const mockedGet = vi.mocked(getPublicStats);

const renderWithClient = () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, ...renderHook(() => usePublicStats(), { wrapper }) };
};

describe('usePublicStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the public stats', async () => {
    mockedGet.mockResolvedValue({ totalAccounts: 42 });

    const { result } = renderWithClient();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ totalAccounts: 42 });
  });

  it('configures polling, staleness and a single retry', () => {
    mockedGet.mockResolvedValue({ totalAccounts: 1 });

    const { queryClient } = renderWithClient();
    const query = queryClient
      .getQueryCache()
      .find({ queryKey: PUBLIC_STATS_QUERY_KEY });

    expect(query?.options).toMatchObject({
      refetchInterval: 60_000,
      staleTime: 60_000,
      retry: 1,
    });
  });

  it('surfaces errors after one retry', async () => {
    mockedGet.mockRejectedValue(new Error('down'));

    const { result } = renderWithClient();

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 4000,
    });
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });
});

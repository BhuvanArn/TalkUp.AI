import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APPLICATIONS_QUERY_KEY, useUpdateApplicationStatus } from './hooks';
import { fetchApplications, updateApplicationStatus } from './http';
import type { Application } from './types';

vi.mock('./http', () => ({
  updateApplicationStatus: vi.fn(),
  // onSettled invalidates the list; make that refetch deterministic so it
  // never clobbers the cache we assert on with a real network call.
  fetchApplications: vi.fn(),
}));

const application: Application = {
  applicationId: 'a1',
  companyName: 'Datadog Paris',
  jobTitle: 'SRE Junior',
  status: 'sent',
  offerUrl: 'https://example.com/job',
  offerDetails: null,
  cvDetails: null,
  appliedAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-08T00:00:00.000Z',
};

const renderWithClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  // Seed the cache as if useApplications had already fetched.
  queryClient.setQueryData<Application[]>(APPLICATIONS_QUERY_KEY, [
    application,
  ]);

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  const utils = renderHook(() => useUpdateApplicationStatus(), { wrapper });
  return { queryClient, ...utils };
};

const cachedStatus = (queryClient: QueryClient, applicationId: string) =>
  queryClient
    .getQueryData<Application[]>(APPLICATIONS_QUERY_KEY)
    ?.find((app) => app.applicationId === applicationId)?.status;

describe('useUpdateApplicationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: the settled-refetch mirrors the server's pre-mutation truth
    // (status "sent"), so it never masks the optimistic/rollback behavior.
    vi.mocked(fetchApplications).mockResolvedValue([application]);
  });

  it('optimistically moves the card to the new status before the request resolves', async () => {
    const moved: Application = { ...application, status: 'interview' };
    // Keep the settled-refetch coherent with the successful move.
    vi.mocked(fetchApplications).mockResolvedValue([moved]);
    let resolveRequest: (value: Application) => void = () => {};
    vi.mocked(updateApplicationStatus).mockReturnValue(
      new Promise<Application>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const { queryClient, result } = renderWithClient();

    result.current.mutate({ applicationId: 'a1', status: 'interview' });

    // While the request is still pending, the cache already reflects the move.
    await waitFor(() => {
      expect(cachedStatus(queryClient, 'a1')).toBe('interview');
    });

    resolveRequest(moved);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rolls the card back to its previous status when the request fails', async () => {
    vi.mocked(updateApplicationStatus).mockRejectedValue(
      new Error('network down'),
    );

    const { queryClient, result } = renderWithClient();

    result.current.mutate({ applicationId: 'a1', status: 'interview' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // onError restored the snapshot: the card is back in its original column.
    expect(cachedStatus(queryClient, 'a1')).toBe('sent');
  });
});

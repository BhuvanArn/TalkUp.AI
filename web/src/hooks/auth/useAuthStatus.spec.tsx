import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStatus } from './useServices';

const checkAuthStatusMock = vi.hoisted(() => vi.fn());

vi.mock('@/utils/auth.guards', () => ({
  checkAuthStatus: checkAuthStatusMock,
}));

const wrapper = (client: QueryClient) => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const newClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('useAuthStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkAuthStatusMock.mockResolvedValue({
      isAuthenticated: true,
      role: null,
      organizationId: null,
    });
  });

  it('shares one request between callers that do not set the flag', async () => {
    const client = newClient();
    const { result } = renderHook(
      () => ({ a: useAuthStatus(), b: useAuthStatus() }),
      { wrapper: wrapper(client) },
    );

    await waitFor(() => expect(result.current.a.isSuccess).toBe(true));
    expect(checkAuthStatusMock).toHaveBeenCalledTimes(1);
    expect(checkAuthStatusMock).toHaveBeenCalledWith({
      anonymousAllowed: undefined,
    });
  });

  // `anonymousAllowed: false` must behave exactly like an unflagged caller, so a
  // non-404 route shares the sidebar's cache entry instead of fetching twice.
  it('shares the plain cache entry when the flag is off', async () => {
    const client = newClient();
    const { result } = renderHook(
      () => ({
        root: useAuthStatus({ anonymousAllowed: false }),
        other: useAuthStatus(),
      }),
      { wrapper: wrapper(client) },
    );

    await waitFor(() => expect(result.current.root.isSuccess).toBe(true));
    expect(checkAuthStatusMock).toHaveBeenCalledTimes(1);
    expect(
      client
        .getQueryCache()
        .findAll()
        .map((q) => q.queryKey),
    ).toEqual([['auth', 'status']]);
  });

  // The variants must never share a key: whichever observer fetched first would
  // otherwise decide the flag for the other (mount-order dependent).
  it('keeps the anonymous variant on its own cache key', async () => {
    const client = newClient();
    const { result } = renderHook(
      () => ({
        notFound: useAuthStatus({ anonymousAllowed: true }),
        other: useAuthStatus(),
      }),
      { wrapper: wrapper(client) },
    );

    await waitFor(() => expect(result.current.notFound.isSuccess).toBe(true));
    expect(
      client
        .getQueryCache()
        .findAll()
        .map((q) => q.queryKey),
    ).toEqual(
      expect.arrayContaining([
        ['auth', 'status', 'anonymous'],
        ['auth', 'status'],
      ]),
    );
    expect(checkAuthStatusMock).toHaveBeenCalledWith({
      anonymousAllowed: true,
    });
  });
});

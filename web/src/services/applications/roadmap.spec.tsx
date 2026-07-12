import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import axiosInstance from '../axiosInstance';
import { useRegenerateRoadmap, useRoadmap } from './hooks';
import { fetchRoadmap, regenerateRoadmap } from './http';
import type { Roadmap } from './types';

vi.mock('../axiosInstance', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const mockedAxios = axiosInstance as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

const roadmap: Roadmap = {
  match_score: 62,
  summary: 'Close the Kubernetes gap.',
  topics: [
    {
      title: 'Kubernetes fundamentals',
      priority: 'HIGH',
      rationale: 'Required by the offer, absent from the CV.',
      gap: true,
    },
  ],
};

describe('roadmap http', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GETs the roadmap for an application', async () => {
    mockedAxios.get.mockResolvedValue({ data: roadmap });
    await expect(fetchRoadmap('app-1')).resolves.toEqual(roadmap);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      '/v1/api/applications/app-1/roadmap',
    );
  });

  it('POSTs a roadmap regeneration', async () => {
    mockedAxios.post.mockResolvedValue({ data: roadmap });
    await expect(regenerateRoadmap('app-1')).resolves.toEqual(roadmap);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/v1/api/applications/app-1/roadmap/regenerate',
    );
  });
});

describe('roadmap hooks', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('useRoadmap fetches and exposes the roadmap', async () => {
    mockedAxios.get.mockResolvedValue({ data: roadmap });

    const { result } = renderHook(() => useRoadmap('app-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(roadmap);
  });

  it('useRegenerateRoadmap invalidates the roadmap query on success', async () => {
    mockedAxios.post.mockResolvedValue({ data: roadmap });
    queryClient.setQueryData(['roadmap', 'app-1'], {
      match_score: 0,
      summary: 'stale',
      topics: [],
    });

    const { result } = renderHook(() => useRegenerateRoadmap('app-1'), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(queryClient.getQueryState(['roadmap', 'app-1'])?.isInvalidated).toBe(
      true,
    );
  });
});

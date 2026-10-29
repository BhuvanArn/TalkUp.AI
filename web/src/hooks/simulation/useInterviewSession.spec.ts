import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInterviewSession } from './useInterviewSession';

const mockGetInterviewSession = vi.fn();
const mockCancelInterview = vi.fn();
const mockCreateInterview = vi.fn();
const mockUpdateInterview = vi.fn();
const mockHeartbeatInterview = vi.fn();

vi.mock('@/services/ai/http', () => ({
  getInterviewSession: (...args: unknown[]) => mockGetInterviewSession(...args),
  cancelInterview: (...args: unknown[]) => mockCancelInterview(...args),
  createInterview: (...args: unknown[]) => mockCreateInterview(...args),
  updateInterview: (...args: unknown[]) => mockUpdateInterview(...args),
  heartbeatInterview: (...args: unknown[]) => mockHeartbeatInterview(...args),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const localStorageMock = {
  store: new Map<string, string>(),
  getItem: vi.fn((key: string) => localStorageMock.store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    localStorageMock.store.delete(key);
  }),
  clear: vi.fn(() => {
    localStorageMock.store.clear();
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

function makeAxiosError(status?: number) {
  const error = new Error('request failed') as Error & {
    isAxiosError: boolean;
    response?: { status: number };
  };
  error.isAxiosError = true;
  if (status !== undefined) {
    error.response = { status };
  }
  return error;
}

describe('useInterviewSession restore', () => {
  const onConnect = vi.fn();
  const onDisconnect = vi.fn();

  beforeEach(() => {
    localStorageMock.store.clear();
    vi.clearAllMocks();
    mockHeartbeatInterview.mockResolvedValue(undefined);
    vi.spyOn(axios, 'isAxiosError').mockImplementation(
      (error: unknown) =>
        typeof error === 'object' &&
        error !== null &&
        'isAxiosError' in error &&
        (error as { isAxiosError?: boolean }).isAxiosError === true,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps saved session on transient restore failures', async () => {
    localStorageMock.store.set('currentInterviewID', 'interview-1');
    localStorageMock.store.set('currentInterviewURL', 'wss://example.test/ws');
    mockGetInterviewSession.mockRejectedValue(makeAxiosError(503));

    renderHook(() =>
      useInterviewSession({
        onConnect,
        onDisconnect,
      }),
    );

    await waitFor(() => {
      expect(mockGetInterviewSession).toHaveBeenCalledWith('interview-1');
    });

    expect(mockCancelInterview).not.toHaveBeenCalled();
    expect(localStorageMock.removeItem).not.toHaveBeenCalledWith(
      'currentInterviewID',
    );
    expect(toast.error).toHaveBeenCalledWith(
      'Impossible de reprendre la simulation pour le moment. Rechargez la page pour réessayer.',
    );
  });

  it('cancels and clears storage when the saved session is gone', async () => {
    localStorageMock.store.set('currentInterviewID', 'interview-1');
    mockGetInterviewSession.mockRejectedValue(makeAxiosError(404));
    mockCancelInterview.mockResolvedValue(undefined);

    renderHook(() =>
      useInterviewSession({
        onConnect,
        onDisconnect,
      }),
    );

    await waitFor(() => {
      expect(mockCancelInterview).toHaveBeenCalledWith('interview-1');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      'currentInterviewID',
    );
    expect(toast.error).toHaveBeenCalledWith(
      'La session précédente a expiré. Vous pouvez démarrer un nouvel entretien.',
    );
  });

  it('does not cancel when reconnect fails after a valid session lookup', async () => {
    localStorageMock.store.set('currentInterviewID', 'interview-1');
    localStorageMock.store.set('currentInterviewURL', 'wss://example.test/ws');
    mockGetInterviewSession.mockResolvedValue({
      interviewID: 'interview-1',
      dbStatus: 'in_progress',
      sessionStatus: 'active',
      queuePosition: 0,
      entrypoint: 'wss://example.test/ws',
    });
    onConnect.mockImplementation(() => {
      throw new Error('WebSocket reconnect failed');
    });

    renderHook(() =>
      useInterviewSession({
        onConnect,
        onDisconnect,
      }),
    );

    await waitFor(() => {
      expect(onConnect).toHaveBeenCalledWith('wss://example.test/ws');
    });

    expect(mockCancelInterview).not.toHaveBeenCalled();
    expect(localStorageMock.removeItem).not.toHaveBeenCalledWith(
      'currentInterviewID',
    );
    expect(toast.error).toHaveBeenCalledWith(
      'Impossible de reprendre la simulation pour le moment. Rechargez la page pour réessayer.',
    );
  });
});

describe('useInterviewSession start', () => {
  const ENTRYPOINT = 'wss://example.test/ws';
  const onConnect = vi.fn();
  const onDisconnect = vi.fn();

  const renderSession = () =>
    renderHook(() => useInterviewSession({ onConnect, onDisconnect }));

  beforeEach(() => {
    localStorageMock.store.clear();
    vi.clearAllMocks();
    mockHeartbeatInterview.mockResolvedValue(undefined);
    mockUpdateInterview.mockResolvedValue(undefined);
    mockCancelInterview.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resets the call when the start fails after connecting', async () => {
    mockCreateInterview.mockResolvedValue({
      interviewID: 'interview-1',
      status: 'ready',
      entrypoint: ENTRYPOINT,
      queuePosition: 0,
    });
    mockUpdateInterview.mockRejectedValueOnce(new Error('network down'));
    const { result } = renderSession();

    await act(() => result.current.handleStreamToggle(true));

    expect(onConnect).toHaveBeenCalledWith(ENTRYPOINT);
    expect(onDisconnect).toHaveBeenCalledWith(1000, 'Start failed');
    expect(mockCancelInterview).toHaveBeenCalledWith('interview-1');
    expect(result.current.isCallActive).toBe(false);
    expect(result.current.interviewID).toBeNull();
    expect(result.current.inputUrl).toBe('');
    expect(localStorageMock.store.has('currentInterviewID')).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      'Failed to start interview. Please try again.',
    );
  });

  it('leaves the queue on End call, even if the slot frees up meanwhile', async () => {
    mockCreateInterview.mockResolvedValue({
      interviewID: 'interview-1',
      status: 'queued',
      queuePosition: 2,
    });
    let releaseSlot: (session: unknown) => void = () => {};
    mockGetInterviewSession.mockReturnValue(
      new Promise((resolve) => {
        releaseSlot = resolve;
      }),
    );
    const { result } = renderSession();

    let starting: Promise<void> = Promise.resolve();
    act(() => {
      starting = result.current.handleStreamToggle(true);
    });
    await waitFor(() => expect(result.current.isQueued).toBe(true));
    await waitFor(() => expect(mockGetInterviewSession).toHaveBeenCalled());

    // "End call" while the start still holds the lock.
    await act(() => result.current.handleStreamToggle(false));
    await act(async () => {
      releaseSlot({ sessionStatus: 'ready', entrypoint: ENTRYPOINT });
      await starting;
    });

    expect(onConnect).not.toHaveBeenCalled();
    expect(mockUpdateInterview).not.toHaveBeenCalled();
    expect(mockCancelInterview).toHaveBeenCalledWith('interview-1');
    expect(result.current.isQueued).toBe(false);
    expect(result.current.isCallActive).toBe(false);
    expect(toast.error).not.toHaveBeenCalled();
  });
});

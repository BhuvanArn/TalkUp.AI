// Separate from useInterviewSession.spec.ts, which defines `window.localStorage`
// as a non-configurable mock at module level, so it can't be blocked there.
import { safeLocalStorage } from '@/utils/safeStorage';
import { act, renderHook, waitFor } from '@testing-library/react';
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

const blocked = () => new DOMException('Access is denied', 'SecurityError');

/** Every Storage method throws, as when a browser rejects the operation. */
const throwingStorage = {
  getItem: () => {
    throw blocked();
  },
  setItem: () => {
    throw blocked();
  },
  removeItem: () => {
    throw blocked();
  },
  clear: () => {
    throw blocked();
  },
};

let blockMode: 'getter' | 'methods' = 'getter';

// Chrome/Firefox with cookies blocked throw on the `window.localStorage`
// getter itself; other setups throw from the Storage methods.
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  get() {
    if (blockMode === 'getter') throw blocked();
    return throwingStorage;
  },
});

const ENTRYPOINT = 'wss://example.test/ws';

describe.each(['getter', 'methods'] as const)(
  'useInterviewSession with localStorage blocked (%s)',
  (mode) => {
    const onConnect = vi.fn();
    const onDisconnect = vi.fn();

    const renderSession = () =>
      renderHook(() => useInterviewSession({ onConnect, onDisconnect }));

    beforeEach(() => {
      blockMode = mode;
      // The in-memory fallback is module-level: start each test empty.
      for (const key of [
        'currentInterviewID',
        'currentInterviewURL',
        'isInterviewStreaming',
      ]) {
        safeLocalStorage.removeItem(key);
      }
      vi.clearAllMocks();
      mockHeartbeatInterview.mockResolvedValue(undefined);
      mockUpdateInterview.mockResolvedValue(undefined);
      mockCancelInterview.mockResolvedValue(undefined);
      mockCreateInterview.mockResolvedValue({
        interviewID: 'interview-1',
        status: 'ready',
        entrypoint: ENTRYPOINT,
        queuePosition: 0,
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('skips session restore on mount without throwing', async () => {
      const unhandled = vi.fn();
      process.on('unhandledRejection', unhandled);

      const { result } = renderSession();
      await act(async () => {});
      // Node reports unhandled rejections after the current tick.
      await new Promise((resolve) => setTimeout(resolve, 0));

      process.off('unhandledRejection', unhandled);
      expect(unhandled).not.toHaveBeenCalled();
      expect(mockGetInterviewSession).not.toHaveBeenCalled();
      expect(result.current.isCallActive).toBe(false);
    });

    it('starts a simulation after the initial stop toggle', async () => {
      const { result } = renderSession();

      // SimulationVideoArea reports `isStreaming=false` on mount before the
      // user ever clicks "Start new call".
      await act(() => result.current.handleStreamToggle(false));
      await act(() => result.current.handleStreamToggle(true));

      expect(mockCreateInterview).toHaveBeenCalledTimes(1);
      expect(onConnect).toHaveBeenCalledWith(ENTRYPOINT);
      expect(result.current.isCallActive).toBe(true);
      expect(result.current.interviewID).toBe('interview-1');
      expect(mockUpdateInterview).toHaveBeenCalledWith('interview-1', {
        status: 'in_progress',
      });
      expect(toast.error).not.toHaveBeenCalled();

      await act(() => result.current.handleStreamToggle(false));
    });

    it('completes the interview it started when the call ends', async () => {
      const { result } = renderSession();

      await act(() => result.current.handleStreamToggle(true));
      await act(() => result.current.handleStreamToggle(false));

      expect(mockUpdateInterview).toHaveBeenCalledWith('interview-1', {
        status: 'completed',
      });
      expect(result.current.isCallActive).toBe(false);
    });

    it('cancels the created interview when the start fails', async () => {
      mockUpdateInterview.mockRejectedValueOnce(new Error('network down'));
      const { result } = renderSession();

      await act(() => result.current.handleStreamToggle(true));

      await waitFor(() => {
        expect(mockCancelInterview).toHaveBeenCalledWith('interview-1');
      });
      expect(result.current.isCallActive).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to start interview. Please try again.',
      );
    });
  },
);

import { AuthProvider } from '@/contexts/AuthContext';
import {
  useAudioPlayback,
  useAudioStreaming,
  useInterviewSession,
} from '@/hooks/simulation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ReadyState } from 'react-use-websocket';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Route as SimulationsRoute } from './simulations';

const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

vi.mock('@/utils/auth.guards', () => ({
  createAuthGuard: vi.fn(() => () => Promise.resolve()),
}));

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('react-use-websocket', () => ({
  default: vi.fn(() => ({
    sendMessage: vi.fn(),
    sendJsonMessage: vi.fn(),
    lastMessage: null,
    lastJsonMessage: null,
    readyState: ReadyState.CLOSED,
    getWebSocket: vi.fn(() => ({ close: vi.fn() })),
    connect: mockConnect,
    disconnect: mockDisconnect,
  })),
  ReadyState: {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
    UNINSTANTIATED: -1,
  },
}));

const mockCreateInterview = vi.fn();

vi.mock('@/services/ai/http', () => ({
  createInterview: (...args: any[]) => mockCreateInterview(...args),
}));

const mockHandleStreamToggle = vi.fn();

vi.mock('@/hooks/simulation', () => ({
  useSimulationWebSocket: vi.fn(() => ({
    sendMessage: vi.fn(),
    sendJsonMessage: vi.fn(),
    sendPing: vi.fn(),
    lastMessage: null,
    lastJsonMessage: null,
    readyState: 1, // Open
    connect: mockConnect,
    disconnect: mockDisconnect,
  })),
  useAudioPlayback: vi.fn(() => ({
    isAiSpeaking: false,
    stopPlayback: vi.fn(),
    error: null,
  })),
  useAudioStreaming: vi.fn(() => ({
    isListening: false,
    isSpeaking: false,
    isRecording: false,
    packetsSent: 0,
    supportedMimeType: 'audio/webm',
    error: null,
  })),
  useInterviewSession: vi.fn(() => ({
    isCallActive: false,
    inputUrl: '',
    handleStreamToggle: mockHandleStreamToggle,
  })),
}));

vi.mock('@/components/organisms/simulation-video-area', () => ({
  default: ({
    onToggleRef,
    onStreamToggle,
  }: {
    onToggleRef?: (toggleFn: (() => void) | null) => void;
    onStreamToggle?: (streaming: boolean) => void;
  }) => {
    // Simulate providing the toggle function via ref
    if (onToggleRef) {
      onToggleRef(() => {
        // Mock toggle function
        if (onStreamToggle) {
          onStreamToggle(true);
        }
      });
    }
    return (
      <button
        onClick={() => onStreamToggle?.(true)}
        aria-label="Start new call"
      >
        Start Stream
      </button>
    );
  },
}));

const rootRoute = createRouter({
  routeTree: SimulationsRoute,
}).routeTree;

const router = createRouter({
  routeTree: rootRoute,
  history: createMemoryHistory(),
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{component}</AuthProvider>
    </QueryClientProvider>,
  );
};

/**
 * Test suite for the Simulations component.
 * Verifies that the WebSocket simulations interface renders correctly.
 */
describe('Simulations', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    router.history.push('/simulations');

    await act(async () => {
      await router.load();
    });
  });

  it('renders the main heading correctly', async () => {
    renderWithProviders(<RouterProvider router={router} />);
    expect(
      await screen.findByRole('heading', { name: /^Simulations$/i }),
    ).toBeInTheDocument();
  });

  it('renders the WebSocket connection panel', async () => {
    renderWithProviders(<RouterProvider router={router} />);
    expect(
      await screen.findByRole('heading', { name: /WebSocket Connection/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Socket URL/i)).toBeInTheDocument();
  });

  it('renders WebSocket control buttons', async () => {
    renderWithProviders(<RouterProvider router={router} />);
    expect(
      await screen.findByRole('button', { name: /Send Message/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Send JSON Message/i }),
    ).toBeInTheDocument();
  });

  it('renders info boxes in sidebar', async () => {
    renderWithProviders(<RouterProvider router={router} />);
    expect(await screen.findByText(/Statistics Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Real time advice/i)).toBeInTheDocument();
  });

  it('calls handleStreamToggle when stream is toggled on', async () => {
    renderWithProviders(<RouterProvider router={router} />);

    const toggleButton = screen.getByRole('button', { name: /start/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockHandleStreamToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('mic gating while AI speaks', () => {
    // Restore the factory defaults so the surrounding suite keeps observing
    // isAiSpeaking=false / isCallActive=false (vi.clearAllMocks resets call
    // history but not the implementations declared in the vi.mock factory).
    afterEach(() => {
      vi.mocked(useAudioPlayback).mockReturnValue({
        isAiSpeaking: false,
        stopPlayback: vi.fn(),
        error: null,
      });
      vi.mocked(useInterviewSession).mockReturnValue({
        isCallActive: false,
        inputUrl: '',
        interviewID: null,
        handleStreamToggle: mockHandleStreamToggle,
      });
    });

    // Force the call active + socket open so the mic would otherwise stream;
    // the AI speaking is then the only thing that can flip isActive to false.
    it('pauses mic streaming (isActive false) when AI is speaking', async () => {
      vi.mocked(useInterviewSession).mockReturnValue({
        isCallActive: true,
        inputUrl: '',
        interviewID: null,
        handleStreamToggle: mockHandleStreamToggle,
      });
      vi.mocked(useAudioPlayback).mockReturnValue({
        isAiSpeaking: true,
        stopPlayback: vi.fn(),
        error: null,
      });

      renderWithProviders(<RouterProvider router={router} />);

      await screen.findByRole('heading', { name: /^Simulations$/i });

      const lastCall = vi.mocked(useAudioStreaming).mock.calls.at(-1);
      expect(lastCall?.[0].isActive).toBe(false);
      // Sanity: with the call active + socket open, the only thing forcing the
      // mic off here is the AI speaking, so this asserts the gate, not the setup.
      expect(lastCall?.[0].isActive).not.toBe(true);
    });
  });
});

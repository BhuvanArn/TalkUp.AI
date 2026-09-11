import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SimulationWorkspace } from './index';

const mockHandleStreamToggle = vi.fn();
const interviewSession = {
  isCallActive: false,
  isQueued: false,
  queuePosition: 0,
  estimatedWaitSec: undefined as number | undefined,
  inputUrl: '',
  interviewID: null as string | null,
  handleStreamToggle: mockHandleStreamToggle,
};
const audioPlayback = {
  isAiSpeaking: false,
  transcript: null,
  speechTurn: null,
  simulationComplete: false,
};
const verbalAnalysis = {
  analysis: { latest: null, aggregate: null as unknown, history: [] },
};

vi.mock('@/hooks/simulation', () => ({
  useSimulationWebSocket: vi.fn(() => ({
    sendMessage: vi.fn(),
    sendJsonMessage: vi.fn(),
    sendPing: vi.fn(),
    sendSessionStart: vi.fn(),
    lastMessage: null,
    lastJsonMessage: null,
    readyState: 1,
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  useInterviewSession: vi.fn(() => interviewSession),
  useAudioPlayback: vi.fn(() => audioPlayback),
  useAudioStreaming: vi.fn(() => ({
    isListening: false,
    isSpeaking: false,
    isRecording: false,
    packetsSent: 0,
    supportedMimeType: 'audio/webm',
    error: null,
  })),
  useVerbalAnalysis: vi.fn(() => verbalAnalysis),
  useRecruiterAvatarCapability: vi.fn(() => ({
    mode: 'fallback',
    avatarUrl: '/avatars/recruiter-professional.glb',
    fallbackReason: null,
  })),
}));

vi.mock('@/hooks/streams/useMediaDevices', () => ({
  useMediaDevices: vi.fn(() => ({
    audioInputs: [{ deviceId: 'mic-1', label: 'Built-in Microphone' }],
    videoInputs: [{ deviceId: 'cam-1', label: 'FaceTime HD Camera' }],
    audioOutputs: [{ deviceId: 'out-1', label: 'Built-in Speakers' }],
    selectedAudioInput: 'mic-1',
    selectedVideoInput: 'cam-1',
    selectedAudioOutput: 'out-1',
    selectAudioInput: vi.fn(),
    selectVideoInput: vi.fn(),
    selectAudioOutput: vi.fn(),
    permission: 'granted',
    error: null,
    isOutputSelectionSupported: true,
    cameraEnabled: true,
    setCameraEnabled: vi.fn(),
    previewStream: null,
  })),
}));

vi.mock('@/hooks/streams/useAudioAnalyzer', () => ({
  useAudioAnalyzer: vi.fn(() => ({ isSpeaking: false, audioLevel: 0 })),
}));

const mockToggleStream = vi.fn();

vi.mock('@/components/organisms/simulation-video-area', () => ({
  default: ({
    onToggleRef,
    onEndCallRequest,
  }: {
    onToggleRef?: (toggleFn: (() => void) | null) => void;
    onEndCallRequest?: () => void;
  }) => {
    onToggleRef?.(mockToggleStream);
    return (
      <button onClick={() => onEndCallRequest?.()} aria-label="End call">
        End call
      </button>
    );
  },
}));

vi.mock('@/components/molecules/notes-editor/notes-editor', () => ({
  default: () => <div data-testid="notes-editor" />,
}));

vi.mock('@/components/organisms/verbal-analysis-panel', () => ({
  default: () => <div data-testid="verbal-analysis-panel" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  interviewSession.isCallActive = false;
  audioPlayback.simulationComplete = false;
  verbalAnalysis.analysis.aggregate = null;
});

describe('SimulationWorkspace', () => {
  it('opens the device setup step as soon as the page is shown', () => {
    render(<SimulationWorkspace />);

    expect(
      screen.getByRole('heading', { name: /préparez votre simulation/i }),
    ).toBeInTheDocument();
  });
  it('starts the interview straight from the setup step', async () => {
    render(<SimulationWorkspace />);

    fireEvent.click(
      screen.getByRole('button', { name: /démarrer la simulation/i }),
    );

    await waitFor(() => expect(mockToggleStream).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByRole('heading', { name: /préparez votre simulation/i }),
    ).not.toBeInTheDocument();
  });

  it('keeps the device setup closed when a session is restored', () => {
    interviewSession.isCallActive = true;

    render(<SimulationWorkspace />);

    expect(
      screen.queryByRole('heading', { name: /préparez votre simulation/i }),
    ).not.toBeInTheDocument();
  });

  it('confirms before hanging up, then stops the stream', async () => {
    render(<SimulationWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: /end call/i }));

    expect(screen.getByText(/terminer la simulation/i)).toBeInTheDocument();
    expect(mockToggleStream).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^terminer$/i }));

    await waitFor(() => expect(mockToggleStream).toHaveBeenCalledTimes(1));
  });

  it('leaves the interview running when the confirmation is dismissed', () => {
    render(<SimulationWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: /end call/i }));
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }));

    expect(
      screen.queryByText(/terminer la simulation/i),
    ).not.toBeInTheDocument();
    expect(mockToggleStream).not.toHaveBeenCalled();
  });

  it('acknowledges the end once the interview completes on its own', async () => {
    audioPlayback.simulationComplete = true;

    render(<SimulationWorkspace />);

    expect(await screen.findByText(/simulation terminée/i)).toBeInTheDocument();
    expect(mockHandleStreamToggle).toHaveBeenCalledWith(false);
  });

  it('tells the user their progression is kept once an analysis exists', () => {
    verbalAnalysis.analysis.aggregate = { turn_count: 2 };

    render(<SimulationWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: /end call/i }));

    expect(
      screen.getByText(/votre progression est enregistrée/i),
    ).toBeInTheDocument();
  });

  it('warns that nothing is kept while no analysis has been produced', () => {
    render(<SimulationWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: /end call/i }));

    expect(screen.getByText(/rien ne sera enregistré/i)).toBeInTheDocument();
  });
});

import { changeLanguage } from '@/i18n';
import { act, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import toast from 'react-hot-toast';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SimulationWorkspace } from './index';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockHandleStreamToggle = vi.fn();

// Stable objects: the effects under test only re-run when these change
// identity, so any extra run after a language switch would come from `t`.
const transcript = {
  transcription: 'I led the migration.',
  response: 'What was the hardest part?',
};
const errorPacket = { type: 'error', text: 'Transcription failed' };
const analysis = { latest: null, aggregate: null, history: [] };

vi.mock('@/hooks/simulation', () => ({
  useSimulationWebSocket: () => ({
    sendMessage: vi.fn(),
    sendJsonMessage: vi.fn(),
    sendPing: vi.fn(),
    sendSessionStart: vi.fn(),
    lastMessage: null,
    lastJsonMessage: errorPacket,
    readyState: 3,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  useAudioPlayback: () => ({
    isAiSpeaking: false,
    simulationComplete: true,
    transcript,
    speechTurn: null,
  }),
  useRecruiterAvatarCapability: () => ({
    mode: 'fallback',
    avatarUrl: '',
    fallbackReason: null,
  }),
  useAudioStreaming: () => ({
    isListening: false,
    isSpeaking: false,
    isRecording: false,
    packetsSent: 0,
    supportedMimeType: 'audio/webm',
    error: null,
  }),
  useInterviewSession: () => ({
    isCallActive: false,
    isQueued: false,
    queuePosition: 0,
    inputUrl: '',
    interviewID: null,
    handleStreamToggle: mockHandleStreamToggle,
  }),
  useVerbalAnalysis: () => ({ analysis }),
}));

vi.mock('@/components/organisms/simulation-video-area', () => ({
  default: () => null,
}));

vi.mock('@/components/molecules/notes-editor/notes-editor', () => ({
  default: () => null,
}));

describe('SimulationWorkspace', () => {
  afterEach(async () => {
    await act(() => i18next.changeLanguage('en'));
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('does not replay the last turn or the toasts on a language switch', async () => {
    render(<SimulationWorkspace />);

    expect(screen.getAllByText('I led the migration.')).toHaveLength(1);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(
      'Interview finished. Thank you for taking part!',
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Transcription failed');
    expect(mockHandleStreamToggle).toHaveBeenCalledTimes(1);

    await act(() => changeLanguage('fr'));

    // The UI follows the new language…
    expect(screen.getByText('Vous')).toBeInTheDocument();
    expect(screen.getByText('IA')).toBeInTheDocument();
    // …but the turn pair is not appended again and nothing fires twice.
    expect(screen.getAllByText('I led the migration.')).toHaveLength(1);
    expect(screen.getAllByText('What was the hardest part?')).toHaveLength(1);
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(mockHandleStreamToggle).toHaveBeenCalledTimes(1);
  });

  it('translates the end-of-interview toast in the active language', async () => {
    await act(() => changeLanguage('fr'));
    render(<SimulationWorkspace />);

    // The French value has a no-break space before "!", so compare with it.
    expect(toast.success).toHaveBeenCalledWith(
      i18next.t('app:simulations.toasts.interviewEnded'),
    );
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/^Entretien terminé\./),
    );
  });
});

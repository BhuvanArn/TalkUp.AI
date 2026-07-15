import { PERSONAS } from '@/config/personas';
import usePersonaStore from '@/stores/usePersonaStore';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SimulationWorkspace } from './index';

vi.mock('@/hooks/simulation', () => ({
  useInterviewSession: () => ({
    isCallActive: false,
    isQueued: false,
    queuePosition: 0,
    estimatedWaitSec: undefined,
    inputUrl: '',
    interviewID: null,
    handleStreamToggle: vi.fn(),
  }),
  useSimulationWebSocket: () => ({
    sendMessage: vi.fn(),
    sendJsonMessage: vi.fn(),
    sendPing: vi.fn(),
    sendSessionStart: vi.fn(),
    lastMessage: null,
    lastJsonMessage: null,
    readyState: 3,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  useAudioPlayback: () => ({ isAiSpeaking: false, speechTurn: 0 }),
  useAudioStreaming: () => ({
    isListening: false,
    isSpeaking: false,
    isRecording: false,
    packetsSent: 0,
    supportedMimeType: '',
    audioError: null,
  }),
  useVerbalAnalysis: () => ({
    analysis: { latest: null, aggregate: null, history: [] },
  }),
  useRecruiterAvatarCapability: () => ({
    avatarMode: 'fallback',
    capabilityFallbackReason: null,
  }),
}));

describe('SimulationWorkspace persona picker', () => {
  beforeEach(() => {
    act(() => usePersonaStore.getState().clearPersona());
  });

  it('shows the picker when no persona is chosen', () => {
    render(<SimulationWorkspace />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('hides the picker once a persona is chosen', () => {
    act(() => usePersonaStore.getState().setPersona('marc-bernard'));
    render(<SimulationWorkspace />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the chosen persona name and role in the info box', () => {
    act(() => usePersonaStore.getState().setPersona('marc-bernard'));
    render(<SimulationWorkspace />);
    const marc = PERSONAS.find((persona) => persona.id === 'marc-bernard')!;
    expect(screen.getByText(marc.name)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(marc.role))).toBeInTheDocument();
  });

  it('offers Change while idle', () => {
    act(() => usePersonaStore.getState().setPersona('marc-bernard'));
    render(<SimulationWorkspace />);
    expect(
      screen.getByRole('button', { name: /change recruiter/i }),
    ).toBeInTheDocument();
  });

  // Task 5's explicit highlight-on-reopen decision: reopening via "Change
  // recruiter" must highlight the currently selected persona, not a stale
  // highlight or an unconditional Sophie (the modal's own internal default).
  it('highlights the currently selected persona when reopened via Change', () => {
    act(() => usePersonaStore.getState().setPersona('marc-bernard'));
    render(<SimulationWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: /change recruiter/i }));

    const marc = PERSONAS.find((persona) => persona.id === 'marc-bernard')!;
    const radios = screen.getAllByRole('radio');
    const marcRadio = radios.find(
      (radio) => radio.getAttribute('aria-checked') === 'true',
    );
    expect(marcRadio).toHaveAccessibleName(new RegExp(marc.name));
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SimulationVideoArea from './index';

// The "Speaking…" badge only renders while the video stream is live, so mock
// the stream hooks to report an active stream and provide the refs/handlers the
// component expects.
vi.mock('../../../hooks/streams/useVideoStream', () => ({
  useVideoStream: vi.fn(() => ({
    videoRef: { current: null },
    isStreaming: true,
    elapsedTime: 0,
    toggleStream: vi.fn(),
  })),
}));

vi.mock('../../../hooks/streams/useStreamControls', () => ({
  useStreamControls: vi.fn(() => ({
    isMicActive: true,
    isSpeakerActive: true,
    isCameraActive: true,
    toggleMic: vi.fn(),
    toggleSpeaker: vi.fn(),
    toggleCamera: vi.fn(),
  })),
}));

vi.mock('../../../hooks/streams/useAudioAnalyzer', () => ({
  useAudioAnalyzer: vi.fn(() => ({
    isSpeaking: false,
  })),
}));

describe('SimulationVideoArea', () => {
  it('shows the Speaking… indicator while the AI is speaking', () => {
    render(<SimulationVideoArea isAiSpeaking={true} />);

    expect(screen.getByText('Speaking…')).toBeInTheDocument();
  });

  it('hides the Speaking… indicator when the AI is not speaking', () => {
    render(<SimulationVideoArea isAiSpeaking={false} />);

    expect(screen.queryByText('Speaking…')).not.toBeInTheDocument();
  });
});

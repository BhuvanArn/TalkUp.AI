import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAudioPlayback } from './useAudioPlayback';

// Shared mocks (re-used by later tests in this file).
class MockAudioBufferSourceNode {
  buffer: unknown = null;
  onended: (() => void) | null = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
  decodeAudioData = vi.fn().mockResolvedValue({ duration: 1 });
  createBufferSource = vi.fn(() => new MockAudioBufferSourceNode());
}

function buildPacket(audioChunks: string[]) {
  return {
    type: 'sts_result',
    key: 'k',
    stream_id: 's',
    format: 'audio',
    timestamp: 1,
    data: JSON.stringify({
      type: 'sts_result',
      transcription: 'hi',
      response: 'hello there',
      audio_chunks: audioChunks,
    }),
  };
}

describe('useAudioPlayback', () => {
  beforeEach(() => {
    global.AudioContext = vi.fn(
      () => new MockAudioContext(),
    ) as unknown as typeof AudioContext;
    global.atob = (b64: string) =>
      Buffer.from(b64, 'base64').toString('binary');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('ignores messages that are not sts_result', () => {
    const { result, rerender } = renderHook(
      ({ message }) => useAudioPlayback({ message }),
      { initialProps: { message: { type: 'pong' } as unknown } },
    );

    expect(result.current.isAiSpeaking).toBe(false);

    rerender({ message: { type: 'error', data: '{}' } as unknown });
    expect(result.current.isAiSpeaking).toBe(false);

    // A well-formed sts_result with no audio chunks is a text-only answer:
    // parsing succeeds but nothing should play.
    rerender({ message: buildPacket([]) as unknown });
    expect(result.current.isAiSpeaking).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

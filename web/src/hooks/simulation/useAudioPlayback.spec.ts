import { act, renderHook, waitFor } from '@testing-library/react';
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
  });

  it('does not speak on a valid sts_result with empty audio_chunks', () => {
    const { result } = renderHook(() =>
      useAudioPlayback({ message: buildPacket([]) as unknown }),
    );
    expect(result.current.isAiSpeaking).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('plays audio_chunks and sets isAiSpeaking true, then false on end', async () => {
    const sources: MockAudioBufferSourceNode[] = [];
    const ctx = new MockAudioContext();
    ctx.createBufferSource = vi.fn(() => {
      const s = new MockAudioBufferSourceNode();
      sources.push(s);
      return s;
    });
    global.AudioContext = vi.fn(() => ctx) as unknown as typeof AudioContext;

    const { result, rerender } = renderHook(
      ({ message }) => useAudioPlayback({ message }),
      { initialProps: { message: null as unknown } },
    );

    await act(async () => {
      rerender({ message: buildPacket(['QUFB', 'QkJC']) as unknown });
    });

    await waitFor(() => expect(result.current.isAiSpeaking).toBe(true));
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(2);
    expect(sources.length).toBe(2);
    expect(sources[0].start).toHaveBeenCalledWith(0);
    expect(sources[1].start).toHaveBeenCalledWith(1);

    await act(async () => {
      sources[sources.length - 1].onended?.();
    });
    expect(result.current.isAiSpeaking).toBe(false);
  });

  it('stopPlayback stops sources and clears isAiSpeaking', async () => {
    const sources: MockAudioBufferSourceNode[] = [];
    const ctx = new MockAudioContext();
    ctx.createBufferSource = vi.fn(() => {
      const s = new MockAudioBufferSourceNode();
      sources.push(s);
      return s;
    });
    global.AudioContext = vi.fn(() => ctx) as unknown as typeof AudioContext;

    const { result, rerender } = renderHook(
      ({ message }) => useAudioPlayback({ message }),
      { initialProps: { message: null as unknown } },
    );
    await act(async () => {
      rerender({ message: buildPacket(['QUFB']) as unknown });
    });
    await waitFor(() => expect(result.current.isAiSpeaking).toBe(true));

    act(() => result.current.stopPlayback());
    expect(result.current.isAiSpeaking).toBe(false);
    expect(sources[0].stop).toHaveBeenCalled();
  });

  it('sets error on malformed data', () => {
    const { result, rerender } = renderHook(
      ({ message }) => useAudioPlayback({ message }),
      { initialProps: { message: null as unknown } },
    );
    act(() => {
      rerender({
        message: { type: 'sts_result', data: 'not-json' } as unknown,
      });
    });
    expect(result.current.error).toBe('Malformed AI answer payload');
    expect(result.current.isAiSpeaking).toBe(false);
  });

  it('skips undecodable chunks but still plays the rest', async () => {
    const ctx = new MockAudioContext();
    ctx.decodeAudioData = vi
      .fn()
      .mockRejectedValueOnce(new Error('bad chunk'))
      .mockResolvedValueOnce({ duration: 1 });
    global.AudioContext = vi.fn(() => ctx) as unknown as typeof AudioContext;

    const { result, rerender } = renderHook(
      ({ message }) => useAudioPlayback({ message }),
      { initialProps: { message: null as unknown } },
    );
    await act(async () => {
      rerender({ message: buildPacket(['QUFB', 'QkJC']) as unknown });
    });
    await waitFor(() => expect(result.current.isAiSpeaking).toBe(true));
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(1);
  });
});

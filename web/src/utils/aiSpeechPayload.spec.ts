import { describe, expect, it } from 'vitest';

import { buildWordTimings, concatAudioBuffers } from './aiSpeechPayload';

describe('buildWordTimings', () => {
  it('returns empty arrays for blank text', () => {
    expect(buildWordTimings('   ', 1000)).toEqual({
      words: [],
      wtimes: [],
      wdurations: [],
    });
  });

  it('distributes duration proportionally by word length', () => {
    const { words, wtimes, wdurations } = buildWordTimings('je suis', 1000);
    expect(words).toEqual(['je', 'suis']);
    expect(wtimes[0]).toBe(0);
    expect(wtimes[1]).toBeCloseTo(333.33, 1);
    expect(wdurations[0]).toBeCloseTo(333.33, 1);
    expect(wdurations[1]).toBeCloseTo(666.67, 1);
  });
});

describe('concatAudioBuffers', () => {
  it('returns null for an empty list', () => {
    const ctx = {
      createBuffer: (channels: number, length: number, sampleRate: number) => ({
        numberOfChannels: channels,
        length,
        sampleRate,
        getChannelData: () => new Float32Array(length),
      }),
    } as unknown as AudioContext;

    expect(concatAudioBuffers(ctx, [])).toBeNull();
  });
});

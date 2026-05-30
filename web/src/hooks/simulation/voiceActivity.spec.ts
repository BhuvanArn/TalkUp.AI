import { describe, expect, it } from 'vitest';

import {
  computeRms,
  isSpeechLevel,
  updateNoiseFloor,
} from './voiceActivity';

describe('voiceActivity', () => {
  it('computeRms returns 0 for silence', () => {
    expect(computeRms(new Float32Array(128))).toBe(0);
  });

  it('computeRms increases with signal amplitude', () => {
    const quiet = new Float32Array(128).fill(0.01);
    const loud = new Float32Array(128).fill(0.2);
    expect(computeRms(loud)).toBeGreaterThan(computeRms(quiet));
  });

  it('isSpeechLevel respects adaptive noise floor', () => {
    expect(isSpeechLevel(0.005, 0.01)).toBe(false);
    expect(isSpeechLevel(0.08, 0.01)).toBe(true);
  });

  it('updateNoiseFloor tracks ambient level', () => {
    const next = updateNoiseFloor(0.01, 0.05);
    expect(next).toBeGreaterThan(0.01);
    expect(next).toBeLessThan(0.05);
  });
});

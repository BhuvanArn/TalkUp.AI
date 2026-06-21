/** Interval between VAD level checks (ms). */
export const VAD_TICK_MS = 50;

/**
 * Silence after the last speech frame before the utterance is finalized (ms).
 * ~900 ms matches common voice-assistant end-of-utterance timing.
 */
export const SILENCE_END_MS = 900;

/** Ignore bursts shorter than this (ms) to reduce click/noise false positives. */
export const MIN_SPEECH_MS = 300;

/** Safety cap for a single utterance (ms). */
export const MAX_UTTERANCE_MS = 30_000;

const NOISE_FLOOR_ALPHA = 0.04;
const SPEECH_THRESHOLD_MULTIPLIER = 4;
const MIN_RMS_THRESHOLD = 0.012;

export function computeRms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

export function updateNoiseFloor(current: number, sample: number): number {
  return current * (1 - NOISE_FLOOR_ALPHA) + sample * NOISE_FLOOR_ALPHA;
}

export function isSpeechLevel(rms: number, noiseFloor: number): boolean {
  const threshold = Math.max(
    MIN_RMS_THRESHOLD,
    noiseFloor * SPEECH_THRESHOLD_MULTIPLIER,
  );
  return rms >= threshold;
}

export interface WordTiming {
  words: string[];
  wtimes: number[];
  wdurations: number[];
}

/** Decode a base64 string into an ArrayBuffer (browser-safe). */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Split response text into words and distribute timing proportionally by
 * character weight across the actual audio duration (Piper has no phonemes).
 */
export function buildWordTimings(
  text: string,
  durationMs: number,
): WordTiming {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0 || durationMs <= 0) {
    return { words: [], wtimes: [], wdurations: [] };
  }

  const weights = words.map((word) => Math.max(word.length, 1));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  let cursor = 0;
  const wtimes: number[] = [];
  const wdurations: number[] = [];

  for (let i = 0; i < words.length; i++) {
    const duration = (weights[i] / totalWeight) * durationMs;
    wtimes.push(cursor);
    wdurations.push(duration);
    cursor += duration;
  }

  return { words, wtimes, wdurations };
}

/** Merge decoded PCM chunks into a single AudioBuffer. */
export function concatAudioBuffers(
  audioContext: AudioContext,
  buffers: AudioBuffer[],
): AudioBuffer | null {
  if (buffers.length === 0) return null;
  if (buffers.length === 1) return buffers[0];

  const sampleRate = buffers[0].sampleRate;
  const channels = buffers[0].numberOfChannels;
  const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const merged = audioContext.createBuffer(channels, totalLength, sampleRate);

  let offset = 0;
  for (const buffer of buffers) {
    for (let channel = 0; channel < channels; channel++) {
      merged.getChannelData(channel).set(buffer.getChannelData(channel), offset);
    }
    offset += buffer.length;
  }

  return merged;
}

/** Decode base64 WAV/PCM chunks; skips invalid chunks instead of failing entirely. */
export async function decodeAudioChunks(
  audioContext: AudioContext,
  chunks: string[],
): Promise<AudioBuffer | null> {
  const decoded: AudioBuffer[] = [];

  for (const chunk of chunks) {
    if (!chunk) continue;
    try {
      const copy = base64ToArrayBuffer(chunk).slice(0);
      const buffer = await audioContext.decodeAudioData(copy);
      decoded.push(buffer);
    } catch {
      // Skip undecodable chunk — same resilience as useAudioPlayback direct mode.
    }
  }

  return concatAudioBuffers(audioContext, decoded);
}

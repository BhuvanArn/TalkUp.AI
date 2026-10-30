import { buildWordTimings } from '@/utils/aiSpeechPayload';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  TimeoutError,
  toFallbackReasonKey,
  withTimeout,
} from './avatar-loader';

describe('buildWordTimings for avatar lip-sync', () => {
  it('produces timings for French responses', () => {
    const { words, wtimes } = buildWordTimings(
      'Bonjour, je suis développeur.',
      2000,
    );
    expect(words.length).toBeGreaterThan(2);
    expect(wtimes[0]).toBe(0);
  });
});

describe('toFallbackReasonKey', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('maps a timeout to its own reason key', async () => {
    vi.useFakeTimers();
    const pending = withTimeout(
      new Promise<never>(() => {}),
      1_000,
      'recruiter.fallback.parseTimeout',
    );
    const rejection = pending.catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(1_000);
    const error = await rejection;

    expect(error).toBeInstanceOf(TimeoutError);
    expect(toFallbackReasonKey(error)).toBe('recruiter.fallback.parseTimeout');
    expect(
      toFallbackReasonKey(
        new TimeoutError('recruiter.fallback.downloadTimeout', 1_000),
      ),
    ).toBe('recruiter.fallback.downloadTimeout');
  });

  it('maps any other error to the generic load failure', () => {
    expect(toFallbackReasonKey(new Error('HTTP 404'))).toBe(
      'recruiter.fallback.loadFailed',
    );
    // An error whose message happens to equal a key is not a timeout.
    expect(
      toFallbackReasonKey(new Error('recruiter.fallback.parseTimeout')),
    ).toBe('recruiter.fallback.loadFailed');
    expect(toFallbackReasonKey('boom')).toBe('recruiter.fallback.loadFailed');
  });
});

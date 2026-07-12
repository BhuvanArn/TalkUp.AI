import { describe, expect, it } from 'vitest';

import { buildWordTimings } from '@/utils/aiSpeechPayload';

describe('buildWordTimings for avatar lip-sync', () => {
  it('produces timings for French responses', () => {
    const { words, wtimes } = buildWordTimings('Bonjour, je suis développeur.', 2000);
    expect(words.length).toBeGreaterThan(2);
    expect(wtimes[0]).toBe(0);
  });
});

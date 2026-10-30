import { describe, expect, it } from 'vitest';

import { formatPercent } from './formatPercent';

describe('formatPercent', () => {
  it('keeps the English output as "72%"', () => {
    expect(formatPercent(72, 'en-US')).toBe('72%');
    expect(formatPercent(0, 'en-US')).toBe('0%');
    expect(formatPercent(100, 'en-US')).toBe('100%');
  });

  it('puts a no-break space before % in French', () => {
    // A no-break space: U+202F or U+00A0 depending on the ICU/CLDR version.
    expect(formatPercent(72, 'fr-FR')).toMatch(/^72[\u00A0\u202F]%$/);
  });

  it('rounds to whole percentages', () => {
    expect(formatPercent(72.4, 'en-US')).toBe('72%');
  });
});

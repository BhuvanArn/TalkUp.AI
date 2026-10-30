import { describe, expect, it } from 'vitest';

import { NAMESPACES, SUPPORTED_LANGUAGES } from './config';
import { resources } from './resources';

/** Flatten nested keys: `{ a: { b: 'x' } }` gives `[['a.b', 'x']]`. */
const leaves = (value: object, prefix = ''): [string, unknown][] =>
  Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === 'object' && child !== null
      ? leaves(child, path)
      : [[path, child] as [string, unknown]];
  });

const keysOf = (value: object) => leaves(value).map(([key]) => key);

describe('translation resources', () => {
  it.each(SUPPORTED_LANGUAGES)('registers every namespace in %s', (lng) => {
    expect(Object.keys(resources[lng]).sort()).toEqual([...NAMESPACES].sort());
  });

  // Guards the extraction PRs: a key added in one language must be added in
  // the other.
  describe.each(NAMESPACES)('%s namespace', (ns) => {
    const enKeys = keysOf(resources.en[ns]);
    const frKeys = keysOf(resources.fr[ns]);

    it('has every en key in fr', () => {
      expect(enKeys.filter((key) => !frKeys.includes(key))).toEqual([]);
    });

    it('has every fr key in en', () => {
      expect(frKeys.filter((key) => !enKeys.includes(key))).toEqual([]);
    });

    it.each(SUPPORTED_LANGUAGES)('has only non-empty strings in %s', (lng) => {
      const invalid = leaves(resources[lng][ns])
        .filter(([, value]) => typeof value !== 'string' || !value.trim())
        .map(([key]) => key);
      expect(invalid).toEqual([]);
    });
  });
});

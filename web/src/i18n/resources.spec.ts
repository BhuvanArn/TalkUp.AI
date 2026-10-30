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

/**
 * `<Trans>` tags (keeping the self-closing `/`) and `{{variables}}` of a
 * string, sorted: word order may differ between languages, the set may not.
 */
const placeholders = (value: unknown) =>
  typeof value === 'string'
    ? [
        ...[...value.matchAll(/<\/?[\w-]+\s*\/?>/g)].map(([tag]) =>
          tag.replace(/\s+/g, ''),
        ),
        ...[...value.matchAll(/{{\s*([\w.]+)[^}]*}}/g)].map(
          ([, name]) => `{{${name}}}`,
        ),
      ].sort()
    : [];

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

    // A missing `{{variable}}`, or `<tag/>` written as `<tag></tag>` (which
    // drops the child a component passes in), would otherwise fail silently.
    it('uses the same tags and variables in en and fr', () => {
      const fr = Object.fromEntries(leaves(resources.fr[ns]));
      const mismatched = leaves(resources.en[ns])
        .filter(([key]) => key in fr)
        .filter(
          ([key, value]) =>
            placeholders(value).join() !== placeholders(fr[key]).join(),
        )
        .map(([key]) => key);
      expect(mismatched).toEqual([]);
    });

    it.each(SUPPORTED_LANGUAGES)('has only non-empty strings in %s', (lng) => {
      const invalid = leaves(resources[lng][ns])
        .filter(([, value]) => typeof value !== 'string' || !value.trim())
        .map(([key]) => key);
      expect(invalid).toEqual([]);
    });
  });
});

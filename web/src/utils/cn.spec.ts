import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it.each([
    'text-h3',
    'text-h6',
    'text-body-l-strong',
    'text-body-s-strong',
    'text-button-l',
  ])('keeps the %s type utility next to a text colour', (typeClass) => {
    expect(cn(typeClass, 'text-text')).toBe(`${typeClass} text-text`);
  });

  it('lets a later type utility replace an earlier one', () => {
    expect(cn('text-body-m', 'text-button-l')).toBe('text-button-l');
  });

  it('treats the radius role tokens as radii', () => {
    expect(cn('rounded-md', 'rounded-button')).toBe('rounded-button');
    expect(cn('rounded-button', 'rounded-card')).toBe('rounded-card');
  });
});

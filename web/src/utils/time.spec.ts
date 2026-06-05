import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatDurationISO, formatRelativeDate, formatTime } from './time';

describe('formatTime', () => {
  it('formats seconds to HH:MM:SS', () => {
    expect(formatTime(0)).toBe('00:00:00');
    expect(formatTime(5)).toBe('00:00:05');
    expect(formatTime(65)).toBe('00:01:05');
    expect(formatTime(600 + 9)).toBe('00:10:09');
    expect(formatTime(3600 + 120 + 3)).toBe('01:02:03');
  });
});

describe('formatDurationISO', () => {
  it('builds ISO duration from seconds', () => {
    expect(formatDurationISO(0)).toMatch(/^PT0S$/);
    expect(formatDurationISO(45)).toBe('PT45S');
    expect(formatDurationISO(90)).toBe('PT1M30S');
    expect(formatDurationISO(3600)).toBe('PT1H0S');
    expect(formatDurationISO(3661)).toBe('PT1H1M1S');
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns Just now for under one hour', () => {
    const d = new Date('2025-06-15T11:30:00.000Z');
    expect(formatRelativeDate(d)).toBe('Just now');
  });

  it('returns hours ago within 24 hours', () => {
    const d = new Date('2025-06-15T07:00:00.000Z');
    expect(formatRelativeDate(d)).toBe('5h ago');
  });

  it('returns days ago within a week', () => {
    const d = new Date('2025-06-12T12:00:00.000Z');
    expect(formatRelativeDate(d)).toBe('3d ago');
  });

  it('returns locale date for older than a week', () => {
    const d = new Date('2025-05-01T12:00:00.000Z');
    expect(formatRelativeDate(d)).toMatch(/May/);
  });

  it('includes year when date is from another calendar year', () => {
    const d = new Date('2024-03-10T12:00:00.000Z');
    const s = formatRelativeDate(d);
    expect(s).toMatch(/2024/);
  });
});

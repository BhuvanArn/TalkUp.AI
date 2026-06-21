import { useCalendarStore } from '@/stores/useCalendarStore';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMiniCalendar } from './useMiniCalendar';

vi.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: vi.fn(),
}));

describe('useMiniCalendar', () => {
  const mockSetCurrentDate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCalendarStore as any).mockReturnValue({
      currentDate: new Date('2025-11-17'),
      setCurrentDate: mockSetCurrentDate,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize correctly', () => {
    const { result } = renderHook(() => useMiniCalendar());

    expect(result.current.days).toHaveLength(42);
    expect(result.current.daysOfWeek).toHaveLength(7);
  });

  it('should navigate months', () => {
    const { result } = renderHook(() => useMiniCalendar());
    const initialMonth = result.current.monthYear;

    act(() => {
      result.current.handleNextMonth();
    });
    expect(result.current.monthYear).not.toBe(initialMonth);

    act(() => {
      result.current.handlePrevMonth();
    });
    expect(result.current.monthYear).toBe(initialMonth);
  });

  it('returns to the starting month when navigating from a month-end date', () => {
    // May 31: Date.setMonth(+1) overflows past the 30-day June and lands in
    // July, so a naive prev-month would not return to May.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-31T12:00:00'));

    const { result } = renderHook(() => useMiniCalendar());
    expect(result.current.monthYear).toBe('May 2026');

    act(() => {
      result.current.handleNextMonth();
    });
    expect(result.current.monthYear).toBe('June 2026');

    act(() => {
      result.current.handlePrevMonth();
    });
    expect(result.current.monthYear).toBe('May 2026');
  });

  it('should handle day click', () => {
    const { result } = renderHook(() => useMiniCalendar());
    const day = result.current.days[10]; // Pick a day

    act(() => {
      result.current.handleDayClick(day);
    });

    expect(mockSetCurrentDate).toHaveBeenCalledWith(day.fullDate);
  });
});

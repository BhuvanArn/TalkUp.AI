import { useCalendarStore } from '@/stores/useCalendarStore';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAgenda } from './useAgenda';

// Mock useCalendarStore
vi.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: vi.fn(),
}));

describe('useAgenda', () => {
  const mockSetCurrentDate = vi.fn();
  const mockGetNextUpcomingEvent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCalendarStore as any).mockReturnValue({
      events: [],
      getNextUpcomingEvent: mockGetNextUpcomingEvent,
      setCurrentDate: mockSetCurrentDate,
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAgenda());

    expect(result.current.activeView).toBe('table');
    expect(result.current.monthYearLabel).toBeDefined(); // e.g. "November 2025"
  });

  it('should toggle active view', () => {
    const { result } = renderHook(() => useAgenda());

    act(() => {
      result.current.setActiveView('list');
    });

    expect(result.current.activeView).toBe('list');
  });

  it('should handle month navigation', () => {
    const { result } = renderHook(() => useAgenda());
    const initialLabel = result.current.monthYearLabel;

    act(() => {
      result.current.handleNextMonth();
    });

    expect(result.current.monthYearLabel).not.toBe(initialLabel);

    act(() => {
      result.current.handlePrevMonth();
    });

    expect(result.current.monthYearLabel).toBe(initialLabel);
  });

  it('should handle mini calendar date selection', () => {
    const { result } = renderHook(() => useAgenda());
    const date = new Date('2025-12-25');

    act(() => {
      result.current.handleMiniCalendarSelectDate(date);
    });

    expect(mockSetCurrentDate).toHaveBeenCalledWith(date);
  });
});

import { changeLanguage } from '@/i18n';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { act, renderHook } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCalendarList } from './useCalendarList';

vi.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: vi.fn(),
}));

describe('useCalendarList', () => {
  const mockOpenModalForCreation = vi.fn();
  const mockOpenModalForEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCalendarStore as any).mockReturnValue({
      currentDate: new Date('2025-11-17'), // Monday
      weekStart: new Date('2025-11-17'),
      events: [],
      openModalForCreation: mockOpenModalForCreation,
      openModalForEdit: mockOpenModalForEdit,
    });
  });

  it('should return week days data', () => {
    const { result } = renderHook(() => useCalendarList());

    expect(result.current.filteredDaysData).toHaveLength(7);
    expect(result.current.filteredDaysData[0].dayName).toBe('Monday');
  });

  describe('in French', () => {
    afterEach(async () => {
      await act(() => i18next.changeLanguage('en'));
      localStorage.clear();
    });

    it('names the days in French', async () => {
      await act(() => changeLanguage('fr'));
      const { result } = renderHook(() => useCalendarList());

      expect(result.current.filteredDaysData[0].dayName).toBe('lundi');
    });
  });

  it('should handle add event click', () => {
    const { result } = renderHook(() => useCalendarList());
    const date = new Date('2025-11-17');

    act(() => {
      result.current.handleCreateEvent(date);
    });

    const expectedStart = new Date(date);
    expectedStart.setHours(9, 0, 0, 0);
    const expectedEnd = new Date(expectedStart);
    expectedEnd.setHours(10, 0, 0, 0);

    expect(mockOpenModalForCreation).toHaveBeenCalledWith(
      expectedStart,
      expectedEnd,
    );
  });

  it('should handle edit event click', () => {
    const { result } = renderHook(() => useCalendarList());
    const event = {
      originalEvent: { id: '1', title: 'Test', user_id: 'user1' },
    } as any;

    act(() => {
      result.current.handleEventClick(event);
    });

    expect(mockOpenModalForEdit).toHaveBeenCalledWith(event.originalEvent);
  });
});

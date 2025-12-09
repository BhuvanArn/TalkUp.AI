import { useCalendarStore } from '@/stores/useCalendarStore';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCalendarTable } from './useCalendarTable';

vi.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: vi.fn(),
}));

describe('useCalendarTable', () => {
  const mockUpdateEvent = vi.fn();
  const mockOpenModalForCreation = vi.fn();
  const mockOpenModalForEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCalendarStore as any).mockReturnValue({
      events: [],
      currentDate: new Date('2025-11-17'),
      calendarViewMode: 'week',
      updateEvent: mockUpdateEvent,
      openModalForCreation: mockOpenModalForCreation,
      openModalForEdit: mockOpenModalForEdit,
      setCalendarViewMode: vi.fn(),
      setCurrentDate: vi.fn(),
      fetchEvents: vi.fn(),
    });
  });

  it('should handle event drop (move)', async () => {
    const { result } = renderHook(() => useCalendarTable());
    const event = { id: '1', title: 'Test' } as any;
    const start = new Date('2025-11-17T10:00:00');
    const end = new Date('2025-11-17T11:00:00');

    await act(async () => {
      await result.current.onEventDrop({ event, start, end, isAllDay: false });
    });

    expect(mockUpdateEvent).toHaveBeenCalledWith('1', {
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      all_day: false,
    });
  });

  it('should prevent drop across multiple days', async () => {
    const { result } = renderHook(() => useCalendarTable());
    const event = { id: '1', title: 'Test' } as any;
    const start = new Date('2025-11-17T10:00:00');
    const end = new Date('2025-11-18T11:00:00'); // Next day

    await act(async () => {
      await result.current.onEventDrop({ event, start, end, isAllDay: false });
    });

    expect(mockUpdateEvent).not.toHaveBeenCalled();
  });

  it('should handle slot selection', () => {
    const { result } = renderHook(() => useCalendarTable());
    const start = new Date('2025-11-17T10:00:00');
    const end = new Date('2025-11-17T11:00:00');

    act(() => {
      result.current.handleSelectSlot({ start, end } as any);
    });

    expect(mockOpenModalForCreation).toHaveBeenCalledWith(start, end);
  });
});

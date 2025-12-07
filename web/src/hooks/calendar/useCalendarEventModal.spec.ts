import { useCalendarStore } from '@/stores/useCalendarStore';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCalendarEventModal } from './useCalendarEventModal';

vi.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: vi.fn(),
}));

describe('useCalendarEventModal', () => {
  const mockAddEvent = vi.fn();
  const mockUpdateEvent = vi.fn();
  const mockDeleteEvent = vi.fn();
  const mockCloseModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCalendarStore as any).mockReturnValue({
      isModalOpen: true,
      modalInitialDate: new Date('2025-11-17T10:00:00'),
      modalInitialEndDate: new Date('2025-11-17T11:00:00'),
      modalEventToEdit: null,
      addEvent: mockAddEvent,
      updateEvent: mockUpdateEvent,
      deleteEvent: mockDeleteEvent,
      closeModal: mockCloseModal,
    });
  });

  it('should initialize form with default values', () => {
    const { result } = renderHook(() => useCalendarEventModal());

    expect(result.current.formData.title).toBe('');
    expect(result.current.formData.startTime).toBe('10:00');
    expect(result.current.formData.endTime).toBe('11:00');
  });

  it('should handle input changes', () => {
    const { result } = renderHook(() => useCalendarEventModal());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'title', value: 'New Title' },
      } as any);
    });

    expect(result.current.formData.title).toBe('New Title');
  });

  it('should submit new event', async () => {
    const { result } = renderHook(() => useCalendarEventModal());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'title', value: 'New Event' },
      } as any);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockAddEvent).toHaveBeenCalled();
  });

  it('should validate multi-day events', async () => {
    const { result } = renderHook(() => useCalendarEventModal());

    // Set end date to next day
    act(() => {
      result.current.setFormData((prev) => ({
        ...prev,
        title: 'Multi-day Event',
        endDate: '2025-11-18',
      }));
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errorMessage).toBe(
      'Events cannot span multiple days.',
    );
    expect(mockAddEvent).not.toHaveBeenCalled();
  });
});

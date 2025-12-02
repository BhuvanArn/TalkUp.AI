import * as api from '@/services/agenda/http';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCalendarStore } from './useCalendarStore';

// Mock the API module
vi.mock('@/services/agenda/http', () => ({
  getEvents: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
}));

describe('useCalendarStore', () => {
  beforeEach(() => {
    useCalendarStore.setState({
      events: [],
      isLoading: false,
      error: null,
      isModalOpen: false,
      currentDate: new Date(),
    });
    vi.clearAllMocks();
  });

  it('should fetch events successfully', async () => {
    const mockEvents = [
      {
        event_id: '1',
        title: 'Test Event',
        start_at: '2023-10-01T10:00:00Z',
        end_at: '2023-10-01T11:00:00Z',
      },
    ];
    (api.getEvents as any).mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useCalendarStore());

    await act(async () => {
      await result.current.fetchEvents();
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].title).toBe('Test Event');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle fetch events error', async () => {
    (api.getEvents as any).mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useCalendarStore());

    await act(async () => {
      await result.current.fetchEvents();
    });

    expect(result.current.error).toBe('Failed to fetch events');
    expect(result.current.isLoading).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch events:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it('should add an event optimistically and then confirm', async () => {
    const newEventDto = {
      title: 'New Event',
      start_at: '2023-10-02T10:00:00Z',
      end_at: '2023-10-02T11:00:00Z',
    };
    const createdEvent = {
      ...newEventDto,
      event_id: 'server-id',
      user_id: 'user1',
      created_at: '2023-10-02T10:00:00Z',
      updated_at: '2023-10-02T10:00:00Z',
    };

    (api.createEvent as any).mockResolvedValue(createdEvent);

    const { result } = renderHook(() => useCalendarStore());

    await act(async () => {
      await result.current.addEvent(newEventDto);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].id).toBe('server-id');
    expect(result.current.isModalOpen).toBe(false);
  });

  it('should delete an event', async () => {
    const initialEvent = {
      id: '1',
      event_id: '1',
      title: 'Event to delete',
      start: new Date(),
      end: new Date(),
    } as any;

    useCalendarStore.setState({ events: [initialEvent] });
    (api.deleteEvent as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCalendarStore());

    await act(async () => {
      await result.current.deleteEvent('1');
    });

    expect(result.current.events).toHaveLength(0);
  });

  it('should get next upcoming event', () => {
    const pastEvent = {
      id: '1',
      start: new Date(Date.now() - 10000),
      end: new Date(Date.now() - 5000),
    } as any;
    const futureEvent1 = {
      id: '2',
      start: new Date(Date.now() + 10000),
      end: new Date(Date.now() + 20000),
    } as any;
    const futureEvent2 = {
      id: '3',
      start: new Date(Date.now() + 50000),
      end: new Date(Date.now() + 60000),
    } as any;

    useCalendarStore.setState({
      events: [pastEvent, futureEvent2, futureEvent1],
    });

    const { result } = renderHook(() => useCalendarStore());
    const next = result.current.getNextUpcomingEvent();

    expect(next?.id).toBe('2');
  });
});

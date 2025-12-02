import {
  createEvent,
  deleteEvent,
  getEvents,
  updateEvent,
} from '@/services/agenda/http';
import {
  AgendaEvent,
  CreateEventDto,
  UpdateEventDto,
} from '@/services/agenda/types';
import { addWeeks, startOfWeek, subWeeks } from 'date-fns';
import { create } from 'zustand';

/**
 * Extended event interface for the frontend (react-big-calendar).
 * We convert ISO strings to Date objects.
 */
export interface CalendarEvent
  extends Omit<AgendaEvent, 'start_at' | 'end_at'> {
  id: string;
  start: Date;
  end: Date;
}

interface CalendarState {
  currentDate: Date;
  weekStart: Date;
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;

  calendarViewMode: 'week' | 'day';
  calendarLayoutMode: 'list' | 'table';

  // Modal State
  isModalOpen: boolean;
  modalInitialDate: Date | null;
  modalInitialEndDate: Date | null;
  modalEventToEdit: CalendarEvent | null;

  // Actions
  setCurrentDate: (date: Date) => void;
  setCalendarViewMode: (mode: 'week' | 'day') => void;
  setCalendarLayoutMode: (mode: 'list' | 'table') => void;
  fetchEvents: () => Promise<void>;
  addEvent: (eventData: CreateEventDto) => Promise<void>;
  updateEvent: (id: string, eventData: UpdateEventDto) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Modal Actions
  openModalForCreation: (start: Date, end?: Date) => void;
  openModalForEdit: (event: CalendarEvent) => void;
  closeModal: () => void;

  /**
   * Retrieves the single event that is closest to the current time, and is still in the future.
   * @returns {CalendarEvent | undefined} The next upcoming event or undefined if none exists.
   */
  getNextUpcomingEvent: () => CalendarEvent | undefined;
}

const mapAgendaEventToCalendarEvent = (event: AgendaEvent): CalendarEvent => ({
  ...event,
  id: event.event_id,
  start: new Date(event.start_at),
  end: event.end_at ? new Date(event.end_at) : new Date(event.start_at), // Fallback if end is missing
});

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentDate: new Date(),
  weekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
  events: [],
  isLoading: false,
  error: null,
  calendarViewMode: 'week',
  calendarLayoutMode: 'table',

  isModalOpen: false,
  modalInitialDate: null,
  modalInitialEndDate: null,
  modalEventToEdit: null,

  setCurrentDate: (date: Date) => {
    set({
      currentDate: date,
      weekStart: startOfWeek(date, { weekStartsOn: 1 }),
    });
    get().fetchEvents();
  },

  setCalendarViewMode: (mode: 'week' | 'day') => {
    set({ calendarViewMode: mode });
  },

  setCalendarLayoutMode: (mode: 'list' | 'table') => {
    set({ calendarLayoutMode: mode });
  },

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const start = subWeeks(get().currentDate, 4).toISOString();
      const end = addWeeks(get().currentDate, 4).toISOString();

      const agendaEvents = await getEvents({ start_at: start, end_at: end });
      const calendarEvents = agendaEvents.map(mapAgendaEventToCalendarEvent);

      set({ events: calendarEvents, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch events:', error);
      set({ error: 'Failed to fetch events', isLoading: false });
    }
  },

  addEvent: async (eventData: CreateEventDto) => {
    const tempId = crypto.randomUUID();
    const tempEvent: CalendarEvent = {
      id: tempId,
      event_id: tempId,
      ...eventData,
      start: new Date(eventData.start_at),
      end: eventData.end_at
        ? new Date(eventData.end_at)
        : new Date(eventData.start_at),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'temp-user', // This will be overwritten by the backend
    };

    const previousEvents = get().events;

    // Optimistic update
    set((state) => ({
      events: [...state.events, tempEvent],
      isLoading: true,
      isModalOpen: false,
      error: null,
    }));

    try {
      const newEvent = await createEvent(eventData);
      const calendarEvent = mapAgendaEventToCalendarEvent(newEvent);

      set((state) => ({
        events: state.events.map((e) => (e.id === tempId ? calendarEvent : e)),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to create event:', error);
      // Revert on failure
      set({
        events: previousEvents,
        error: 'Failed to create event',
        isLoading: false,
      });
    }
  },

  updateEvent: async (id: string, eventData: UpdateEventDto) => {
    const previousEvents = get().events;

    // Optimistic update
    set((state) => ({
      events: state.events.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            ...eventData,
            start: eventData.start_at ? new Date(eventData.start_at) : e.start,
            end: eventData.end_at ? new Date(eventData.end_at) : e.end,
          };
        }
        return e;
      }),
      isLoading: true, // Keep loading state true while request is in flight
      error: null,
    }));

    try {
      const updatedEvent = await updateEvent(id, eventData);
      const calendarEvent = mapAgendaEventToCalendarEvent(updatedEvent);

      // Confirm update with server data
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? calendarEvent : e)),
        isLoading: false,
        isModalOpen: false,
        modalEventToEdit: null,
      }));
    } catch (error) {
      console.error('Failed to update event:', error);
      // Revert to previous state on failure
      set({
        events: previousEvents,
        error: 'Failed to update event',
        isLoading: false,
      });
    }
  },

  deleteEvent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteEvent(id);
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        isLoading: false,
        isModalOpen: false,
        modalEventToEdit: null,
      }));
    } catch (error) {
      console.error('Failed to delete event:', error);
      set({ error: 'Failed to delete event', isLoading: false });
    }
  },

  openModalForCreation: (start: Date, end?: Date) => {
    set({
      isModalOpen: true,
      modalInitialDate: start,
      modalInitialEndDate: end || null,
      modalEventToEdit: null,
    });
  },

  openModalForEdit: (event: CalendarEvent) => {
    set({
      isModalOpen: true,
      modalInitialDate: null,
      modalInitialEndDate: null,
      modalEventToEdit: event,
    });
  },

  closeModal: () => {
    set({
      isModalOpen: false,
      modalInitialDate: null,
      modalInitialEndDate: null,
      modalEventToEdit: null,
    });
  },

  getNextUpcomingEvent: () => {
    const allEvents = get().events;
    const now = new Date();

    const futureEvents = allEvents.filter((event) => event.start > now);
    if (futureEvents.length === 0) {
      return undefined;
    }
    futureEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    return futureEvents[0];
  },
}));

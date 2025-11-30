import { isFuture, startOfWeek } from 'date-fns';
import { create } from 'zustand';

// --- Mock Dates (Example for me, November 17, 2025) ---
const NOV_10_PAST = new Date('2025-11-10T10:30:00');
const NOV_13_PAST = new Date('2025-11-13T16:00:00');

const NOV_18_FUTURE = new Date('2025-11-18T09:00:00');
const NOV_20_FUTURE = new Date('2025-11-20T14:30:00');

const MOCK_TODAY = new Date('2025-11-17T12:00:00');
// ------------------------------------------------------

/**
 * Defines the structure for a single calendar event.
 * @interface CalendarEvent
 */
export interface CalendarEvent {
  id: string;
  title: string;
  subtitle: string;
  color: 'blue' | 'green' | 'red' | 'purple';
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  fullDate: Date;
}

/**
 * Defines the state and actions for the calendar store.
 * @interface CalendarState
 */
interface CalendarState {
  currentDate: Date;
  weekStart: Date;
  isModalOpen: boolean;
  modalInitialDate: Date | null;
  modalEventToEdit: CalendarEvent | null;
  events: CalendarEvent[];

  /** Sets the current date and updates the week's start date. */
  setCurrentDate: (date: Date | string) => void;

  /** Opens the modal for creating a new event at the given date. */
  openModalForCreation: (date: Date) => void;

  /** Opens the modal for editing an existing event. */
  openModalForEdit: (event: CalendarEvent) => void;

  /** Closes the modal and resets modal state. */
  closeModal: () => void;

  /** Adds a new event to the store. */
  addEvent: (eventData: Omit<CalendarEvent, 'id' | 'fullDate'>) => void;

  /** Updates an existing event and closes the modal. */
  updateEvent: (event: CalendarEvent) => void;

  /**
   * Retrieves the single event that is closest to the current time, and is still in the future.
   * @returns {CalendarEvent | undefined} The next upcoming event or undefined if none exists.
   */
  getNextUpcomingEvent: () => CalendarEvent | undefined;
}

/**
 * Constructs the detailed event object from a base date and time data.
 * @param {Date} date - The base date for the event.
 * @param {Omit<CalendarEvent, 'id' | 'fullDate'>} eventData - The time and content details.
 * @returns {Omit<CalendarEvent, 'id'>} The event data including the calculated fullDate.
 */
const buildNewEventDetails = (
  date: Date,
  eventData: Omit<CalendarEvent, 'id' | 'fullDate'>,
) => {
  const fullDate = new Date(date);

  fullDate.setHours(eventData.startHour, eventData.startMinute, 0, 0);

  return {
    ...eventData,
    fullDate: fullDate,
  };
};

/**
 * Custom hook for the calendar state management (Zustand store).
 * @function useCalendarStore
 */
export const useCalendarStore = create<CalendarState>((set, get) => {
  const initialMonday = startOfWeek(MOCK_TODAY, { weekStartsOn: 1 });

  return {
    currentDate: MOCK_TODAY,
    weekStart: initialMonday,
    isModalOpen: false,
    modalInitialDate: null,
    modalEventToEdit: null,

    events: [
      {
        id: 'e1',
        title: 'Past Interview',
        subtitle: 'Amazon Web',
        color: 'blue',
        startHour: 10,
        startMinute: 30,
        endHour: 11,
        endMinute: 30,
        fullDate: NOV_10_PAST,
      },
      {
        id: 'e4',
        title: 'Past Practice',
        subtitle: 'Google Cloud France',
        color: 'red',
        startHour: 16,
        startMinute: 0,
        endHour: 17,
        endMinute: 30,
        fullDate: NOV_13_PAST,
      },
      {
        id: 'e5',
        title: 'Next Upcoming Event',
        subtitle: 'Team Meeting',
        color: 'green',
        startHour: 9,
        startMinute: 0,
        endHour: 10,
        endMinute: 0,
        fullDate: NOV_18_FUTURE,
      },
      {
        id: 'e6',
        title: 'Following Event',
        subtitle: 'Client Presentation',
        color: 'purple',
        startHour: 14,
        startMinute: 39,
        endHour: 16,
        endMinute: 0,
        fullDate: NOV_20_FUTURE,
      },
    ],

    /**
     * Retrieves the single event that is closest to the current time, and is still in the future.
     * @returns {CalendarEvent | undefined} The next upcoming event or undefined if none exists.
     */
    getNextUpcomingEvent: () => {
      const allEvents = get().events;

      const futureEvents = allEvents.filter((event) =>
        isFuture(event.fullDate),
      );
      if (futureEvents.length === 0) {
        return undefined;
      }
      futureEvents.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
      return futureEvents[0];
    },

    /**
     * Sets the current date and updates the week's start date based on the new date.
     * @param {Date | string} date - The new date to set.
     */
    setCurrentDate: (date: Date | string) => {
      const validDate = date instanceof Date ? date : new Date(date);

      if (isNaN(validDate.getTime())) {
        console.error('[STORE] Invalid date:', date);
        return;
      }

      const newMonday = startOfWeek(validDate, { weekStartsOn: 1 });

      set({
        currentDate: validDate,
        weekStart: newMonday,
      });

      console.log('[STORE] Updated currentDate & weekStart to:', validDate);
    },

    /**
     * Opens the modal for creating a new event.
     * @param {Date} date - The date to pre-populate the new event with.
     */
    openModalForCreation: (date: Date) =>
      set({
        isModalOpen: true,
        modalInitialDate: date,
        modalEventToEdit: null,
      }),

    /**
     * Opens the modal for editing an existing event.
     * @param {CalendarEvent} event - The event object to load for editing.
     */
    openModalForEdit: (event: CalendarEvent) =>
      set({
        isModalOpen: true,
        modalInitialDate: null,
        modalEventToEdit: event,
      }),

    /**
     * Closes the modal and resets modal state.
     */
    closeModal: () =>
      set({
        isModalOpen: false,
        modalInitialDate: null,
        modalEventToEdit: null,
      }),

    /**
     * Adds a new event to the store using the initial modal date.
     * @param {Omit<CalendarEvent, 'id' | 'fullDate'>} eventData - The event content and time details.
     */
    addEvent: (eventData) => {
      const date = get().modalInitialDate;
      if (!date) return;

      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        ...buildNewEventDetails(date, eventData),
      };

      set((state) => ({
        events: [...state.events, newEvent],
      }));

      get().closeModal();
    },

    /**
     * Updates an existing event in the store.
     * @param {CalendarEvent} updatedEvent - The updated event object.
     */
    updateEvent: (updatedEvent) => {
      set((state) => ({
        events: state.events.map((e) =>
          e.id === updatedEvent.id ? updatedEvent : e,
        ),
      }));

      get().closeModal();
    },
  };
});

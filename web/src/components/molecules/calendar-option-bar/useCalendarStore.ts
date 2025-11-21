import { isFuture, startOfWeek } from 'date-fns';
import { create } from 'zustand';

// --- Mock Dates (exemple for me ,  17 novembre 2025) ---
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
   * Retrieves the single event that is closest to the current time, but est toujours dans le futur.
   * @returns {CalendarEvent | undefined} The next upcoming event or undefined if none exists.
   */
  getNextUpcomingEvent: () => CalendarEvent | undefined;
}

const buildNewEventDetails = (
  date: Date,
  eventData: Omit<CalendarEvent, 'id' | 'fullDate'>,
) => {
  const made = new Date(date);
  made.setSeconds(0);
  made.setMilliseconds(0);

  return {
    ...eventData,
    fullDate: made,
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
        title: 'Interview Passée',
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
        title: 'Practice Passée',
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
        title: 'Prochain Événement',
        subtitle: "Réunion d'équipe",
        color: 'green',
        startHour: 9,
        startMinute: 0,
        endHour: 10,
        endMinute: 0,
        fullDate: NOV_18_FUTURE,
      },
      {
        id: 'e6',
        title: 'Événement Suivant',
        subtitle: 'Présentation Client',
        color: 'purple',
        startHour: 14,
        startMinute: 30,
        endHour: 16,
        endMinute: 0,
        fullDate: NOV_20_FUTURE,
      },
    ],

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

    openModalForCreation: (date: Date) =>
      set({
        isModalOpen: true,
        modalInitialDate: date,
        modalEventToEdit: null,
      }),

    openModalForEdit: (event: CalendarEvent) =>
      set({
        isModalOpen: true,
        modalInitialDate: null,
        modalEventToEdit: event,
      }),

    closeModal: () =>
      set({
        isModalOpen: false,
        modalInitialDate: null,
        modalEventToEdit: null,
      }),

    addEvent: (eventData) => {
      const date = get().modalInitialDate;
      if (!date) return;

      const newEvent = {
        id: Date.now().toString(),
        ...buildNewEventDetails(date, eventData),
      };

      set((state) => ({
        events: [...state.events, newEvent],
      }));

      get().closeModal();
    },

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

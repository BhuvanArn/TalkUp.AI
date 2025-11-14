// src/components/molecules/calendar-option-bar/useCalendarStore.ts
import { startOfWeek } from 'date-fns';
import { create } from 'zustand';

export interface EventData {
  id: string;
  dayName: string;
  date: number;
  isToday: boolean;
  title: string;
  subtitle: string;
  color: 'blue' | 'green' | 'red' | 'purple';
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

interface CalendarState {
  currentDate: Date;
  weekStart: Date;
  isModalOpen: boolean;
  modalInitialDate: Date | null;
  events: EventData[];
  setCurrentDate: (date: Date) => void;
  openModal: (date: Date) => void;
  closeModal: () => void;
  addEvent: (event: Omit<EventData, 'id'>) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  monday.setHours(0, 0, 0, 0);

  return {
    currentDate: monday,
    weekStart: monday,
    isModalOpen: false,
    modalInitialDate: null,
    events: [],
    setCurrentDate: (date: Date) => {
      const newMonday = startOfWeek(date, { weekStartsOn: 1 });
      newMonday.setHours(0, 0, 0, 0);
      set({ currentDate: newMonday, weekStart: newMonday });
    },
    openModal: (date: Date) =>
      set({ isModalOpen: true, modalInitialDate: date }),
    closeModal: () => set({ isModalOpen: false, modalInitialDate: null }),
    addEvent: (eventData) => {
      const newEvent: EventData = { ...eventData, id: Date.now().toString() };
      set((state) => ({ events: [...state.events, newEvent] }));
      get().closeModal();
    },
  };
});

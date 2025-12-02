import { CalendarEvent } from '@/stores/useCalendarStore';

import {
  getListWeekDaysData,
  getMiniCalendarDays,
  getMiniCalendarDaysData,
} from './calendarUtils';

describe('calendarUtils', () => {
  describe('getMiniCalendarDays', () => {
    it('should return 42 days for the grid', () => {
      const date = new Date('2023-10-15'); // October 2023
      const days = getMiniCalendarDays(date);
      expect(days).toHaveLength(42);
    });

    it('should correctly mark days from previous and next months', () => {
      const date = new Date('2023-10-15');
      const days = getMiniCalendarDays(date);

      // October 1st 2023 is a Sunday.
      // If week starts on Monday (index 1), then:
      // Mon 25 Sep - Sun 1 Oct.
      // Wait, getMiniCalendarDays implementation:
      // firstDayOfMonth = Oct 1.
      // firstDayIndex = (0 + 6) % 7 = 6. (Sunday is 0, so 6 means 6 days before).
      // So it should start from Mon Sep 25.

      const firstDay = days[0];
      expect(firstDay.date).toBe(25); // Sep 25
      expect(firstDay.isNotCurrentMonth).toBe(true);

      const lastDay = days[41];
      // 42 days total.
      // Oct has 31 days.
      // 6 days from Sep. 31 days from Oct. Total 37.
      // Remaining 5 days from Nov.
      expect(lastDay.isNotCurrentMonth).toBe(true);
    });
  });

  describe('getListWeekDaysData', () => {
    it('should return 7 days starting from the given date', () => {
      const startDate = new Date('2023-10-02'); // Monday
      const events: CalendarEvent[] = [];
      const days = getListWeekDaysData(startDate, events);

      expect(days).toHaveLength(7);
      expect(days[0].date).toBe(2);
      expect(days[6].date).toBe(8);
    });

    it('should correctly map events to days', () => {
      const startDate = new Date('2023-10-02');
      const eventDate = new Date('2023-10-03T10:00:00');
      const events: CalendarEvent[] = [
        {
          id: '1',
          event_id: '1',
          title: 'Test Event',
          start: eventDate,
          end: new Date('2023-10-03T11:00:00'),
          user_id: 'user1',
          created_at: '',
          updated_at: '',
          start_at: '', // Mocked as these are Omit in CalendarEvent but needed for type satisfaction if strict
        } as any,
      ];

      const days = getListWeekDaysData(startDate, events);
      const tuesday = days[1]; // Oct 3

      expect(tuesday.events).toHaveLength(1);
      expect(tuesday.events[0].title).toBe('Test Event');
    });
  });

  describe('getMiniCalendarDaysData', () => {
    it('should return 42 days with event markers', () => {
      const date = new Date('2023-10-15');
      const eventDate = new Date('2023-10-05T10:00:00');
      const events: CalendarEvent[] = [
        {
          id: '1',
          start: eventDate,
          end: eventDate,
        } as any,
      ];

      const days = getMiniCalendarDaysData(date, events);
      expect(days).toHaveLength(42);

      // Find Oct 5th
      // Start index was 6 (Sep 25).
      // Sep 25, 26, 27, 28, 29, 30. (6 days)
      // Oct 1, 2, 3, 4, 5.
      // Index for Oct 5 should be 6 + 4 = 10.
      const dayWithEvent = days.find((d) => d.date === 5 && !d.isGray);
      expect(dayWithEvent).toBeDefined();
      expect(dayWithEvent?.hasEvent).toBe(true);
    });
  });
});

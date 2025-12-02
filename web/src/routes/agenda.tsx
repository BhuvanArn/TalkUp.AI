import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import CalendarControlBar from '@/components/molecules/calendar-control-bar';
import MiniCalendar from '@/components/molecules/mini-calendar';
import NextEventCard from '@/components/molecules/next-event-card';
import CalendarContainer from '@/components/organisms/calendar-container';

import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/agenda')({
  beforeLoad: createAuthGuard('/agenda'),
  component: Agenda,
});

/**
 * Main component for the Agenda page.
 * Displays the main calendar view, a mini-calendar, and the next upcoming event.
 * @returns {JSX.Element} The Agenda page component.
 */
function Agenda() {
  return (
    <div className="grid grid-rows-[96px_minmax(0,1fr)] px-4 sm:px-8 md:px-16 pt-11 pb-12 gap-11 h-screen w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-center w-full min-w-0 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-h1 text-idle">Agenda TalkUp</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="text" color="black" title="Share my agenda">
              <Icon icon="share" />
              <span className="hidden sm:inline text-idle text-button-s">
                Share my agenda
              </span>
            </Button>
          </div>
        </div>
        <p className="text-idle mt-2 text-h6">Plan and Organize your journey</p>
      </div>

      <div className="bg-surface-raised p-8 rounded-[20px] grid grid-cols-[1fr_300px] gap-6 h-full">
        <div className="bg-white rounded-[10px] px-6 py-3 h-full flex flex-col gap-3 overflow-hidden">
          <CalendarControlBar />

          <div className="flex-1 min-h-0">
            <CalendarContainer />
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <MiniCalendar />

          <NextEventCard />
        </div>
      </div>
    </div>
  );
}

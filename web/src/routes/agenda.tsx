import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import CalendarControlBar from '@/components/molecules/calendar-control-bar';
import MiniCalendar from '@/components/molecules/mini-calendar';
import NextEventCard from '@/components/molecules/next-event-card';
import CalendarContainer from '@/components/organisms/calendar-container';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/agenda')({
  // beforeLoad: createAuthGuard('/agenda'),
  component: Agenda,
});

/**
 * Component to handle OAuth connections for external agendas.
 * UI states are ready for backend integration.
 */
interface ExternalAppConnectorProps {
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
  isAppleConnected: boolean;
  onConnectApple: () => void;
}

const ExternalAppConnector = ({
  isGoogleConnected,
  onConnectGoogle,
  isAppleConnected,
  onConnectApple,
}: ExternalAppConnectorProps) => (
  <div className="bg-white p-4 rounded-[10px] border border-gray-100 space-y-4 shadow-sm">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
      Connections
    </h3>
    <div className="space-y-2">
      {/* Google Connector */}
      <Button
        variant={isGoogleConnected ? 'text' : 'outlined'}
        className={`w-full flex justify-start items-center transition-all ${
          isGoogleConnected ? 'bg-green-50 border-green-200' : 'border-gray-200'
        }`}
        onClick={onConnectGoogle}
      >
        <Icon icon="google" className="mr-3" />
        <span className="text-button-s text-idle">
          {isGoogleConnected ? 'Google Connected' : 'Connect Google'}
        </span>
        {isGoogleConnected && (
          <Icon icon="check" className="ml-auto text-green-600 w-4 h-4" />
        )}
      </Button>

      {/* Apple Connector */}
      <Button
        variant={isAppleConnected ? 'text' : 'outlined'}
        className={`w-full flex justify-start items-center transition-all ${
          isAppleConnected ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
        }`}
        onClick={onConnectApple}
      >
        <Icon icon="apple" className="mr-3" />
        <span className="text-button-s text-idle">
          {isAppleConnected ? 'iOS Connected' : 'Connect Apple'}
        </span>
        {isAppleConnected && (
          <Icon icon="check" className="ml-auto text-blue-600 w-4 h-4" />
        )}
      </Button>
    </div>
  </div>
);

/**
 * Main component for the Agenda page.
 * Displays the main calendar view, a mini-calendar, and the next upcoming event.
 * @returns {JSX.Element} The Agenda page component.
 */
function Agenda() {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isAppleConnected, setIsAppleConnected] = useState(false);

  /**
   * TODO: Replace with real backend OAuth flow
   * Currently simulates the toggle for UI/UX validation
   */
  const handleConnectGoogle = () => {
    if (isGoogleConnected) {
      setIsGoogleConnected(false);
    } else {
      // Simulate API call delay
      setTimeout(() => setIsGoogleConnected(true), 500);
    }
  };

  const handleConnectApple = () => {
    if (isAppleConnected) {
      setIsAppleConnected(false);
    } else {
      // Simulate API call delay
      setTimeout(() => setIsAppleConnected(true), 500);
    }
  };

  return (
    <div className="grid grid-rows-[96px_minmax(0,1fr)] px-4 sm:px-8 md:px-16 pt-11 pb-12 gap-11 h-screen w-full min-w-0">
      {/* Header Section */}
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

      {/* Main Content Grid */}
      <div className="bg-surface-raised p-8 rounded-[20px] grid grid-cols-[1fr_300px] gap-6 h-full">
        {/* Calendar Column */}
        <div className="bg-white rounded-[10px] px-6 py-3 h-full flex flex-col gap-3 overflow-hidden">
          <CalendarControlBar />
          <div className="flex-1 min-h-0">
            {/* CalendarContainer will eventually receive isGoogleConnected to fetch external events */}
            <CalendarContainer />
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="flex flex-col space-y-6 overflow-y-auto pr-1">
          <MiniCalendar />

          <ExternalAppConnector
            isGoogleConnected={isGoogleConnected}
            onConnectGoogle={handleConnectGoogle}
            isAppleConnected={isAppleConnected}
            onConnectApple={handleConnectApple}
          />

          <NextEventCard />
        </div>
      </div>
    </div>
  );
}

export default Agenda;

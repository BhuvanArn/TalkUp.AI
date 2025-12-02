import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/agenda')({
  beforeLoad: createAuthGuard('/agenda'),
  component: Agenda,
});

/**
 * Agenda page
 *
 * Allows users to manage their schedule and appointments.
 */
function Agenda() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle">Agenda</h2>
      </div>
    </div>
  );
}

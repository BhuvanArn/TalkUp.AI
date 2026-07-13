import { iconMap } from '@/components/atoms/icon/icon-map';
import { SimulationWorkspace } from '@/components/organisms/simulation-workspace';
import { useApplications } from '@/services/applications/hooks';
import { createAuthGuard } from '@/utils/auth.guards';
import { Link, createFileRoute } from '@tanstack/react-router';

const BackIcon = iconMap['arrow-left'];

export const Route = createFileRoute(
  '/applications/$applicationId/simulations',
)({
  beforeLoad: createAuthGuard('/applications/$applicationId/simulations'),
  component: ApplicationSimulations,
});

/**
 * In-app return to this application's roadmap. Without it the only way back
 * from a simulation is the browser back arrow (#195). Kept in the route (not
 * the shared SimulationWorkspace, which the standalone /simulations page also
 * uses and has no dashboard to return to).
 */
function BackToRoadmap({ applicationId }: { applicationId: string }) {
  // Sits above the workspace, which carries its own `p-6`; only add the matching
  // left/top padding here so the link aligns with the workspace edge without
  // doubling the horizontal padding.
  return (
    <Link
      to="/applications/$applicationId/dashboard"
      params={{ applicationId }}
      className="text-button-m text-text-weak hover:text-text inline-flex items-center gap-2 px-6 pt-6 transition-colors"
    >
      <BackIcon size={18} aria-hidden="true" />
      Back to roadmap
    </Link>
  );
}

function ApplicationSimulations() {
  const { applicationId } = Route.useParams();
  const { data: applications, isLoading } = useApplications();
  const application = applications?.find(
    (item) => item.applicationId === applicationId,
  );

  const contextLabel = application
    ? [application.jobTitle, application.companyName]
        .filter(Boolean)
        .join(' at ')
    : undefined;

  if (isLoading) {
    return (
      <div>
        <BackToRoadmap applicationId={applicationId} />
        <p className="text-text-weak px-6 pt-4">Loading application context…</p>
      </div>
    );
  }

  // The workspace only needs applicationId (from the route params), and the
  // backend resolves the CV and offer server-side. Render it even when the
  // application row is not in the cached list yet (stale cache after a fresh
  // creation, or a direct deep-link); contextLabel is cosmetic and simply
  // omitted until the list catches up. The workspace carries its own `p-6`, so
  // the wrapper stays padding-free and only the back link adds the top strip.
  return (
    <div>
      <BackToRoadmap applicationId={applicationId} />
      <SimulationWorkspace
        applicationId={applicationId}
        title="Simulations"
        description="Practice with the AI recruiter for this job offer."
        contextLabel={contextLabel}
      />
    </div>
  );
}

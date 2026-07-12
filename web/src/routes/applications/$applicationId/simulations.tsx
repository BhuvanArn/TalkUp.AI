import { SimulationWorkspace } from '@/components/organisms/simulation-workspace';
import { useApplications } from '@/services/applications/hooks';
import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/applications/$applicationId/simulations',
)({
  beforeLoad: createAuthGuard('/applications/$applicationId/simulations'),
  component: ApplicationSimulations,
});

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
      <div className="p-6">
        <p className="text-text-weak">Loading application context…</p>
      </div>
    );
  }

  // The workspace only needs applicationId (from the route params), and the
  // backend resolves the CV and offer server-side. Render it even when the
  // application row is not in the cached list yet (stale cache after a fresh
  // creation, or a direct deep-link); contextLabel is cosmetic and simply
  // omitted until the list catches up.
  return (
    <SimulationWorkspace
      applicationId={applicationId}
      title="Simulations"
      description="Practice with the AI recruiter for this job offer."
      contextLabel={contextLabel}
    />
  );
}

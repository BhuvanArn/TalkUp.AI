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
        .join(' chez ')
    : undefined;

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-text-weak">Chargement du contexte de candidature…</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6">
        <h2 className="text-h4 text-idle">Simulations</h2>
        <p className="mt-2 text-text-weak">
          Candidature introuvable. Retournez à la liste des applications.
        </p>
      </div>
    );
  }

  return (
    <SimulationWorkspace
      applicationId={applicationId}
      title="Simulations"
      description="Entraînez-vous avec le recruteur IA sur cette offre d'emploi."
      contextLabel={contextLabel}
    />
  );
}

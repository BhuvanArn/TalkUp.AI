import { ApplicationsKanban } from '@/components/organisms/applications-kanban';
import {
  useApplications,
  useDeleteApplication,
  useUpdateApplicationStatus,
} from '@/services/applications/hooks';
import { createAuthGuard } from '@/utils/auth.guards';
import { Link, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/applications/')({
  beforeLoad: createAuthGuard('/applications'),
  component: ApplicationsPage,
});

/**
 * Applications page: kanban of the user's real job applications, one column
 * per tracking status. Applications are created by the CV + offer analysis
 * flow (/cv-analysis).
 */
function ApplicationsPage() {
  const navigate = Route.useNavigate();
  const { data: applications, isLoading, isError } = useApplications();
  const updateStatus = useUpdateApplicationStatus();
  const deleteApplication = useDeleteApplication();

  const pendingIds = new Set<string>();
  if (updateStatus.isPending && updateStatus.variables) {
    pendingIds.add(updateStatus.variables.applicationId);
  }
  if (deleteApplication.isPending && deleteApplication.variables) {
    pendingIds.add(deleteApplication.variables);
  }

  const openTraining = (applicationId: string) => {
    navigate({
      to: '/applications/$applicationId/dashboard',
      params: { applicationId },
    });
  };

  const interviewCount =
    applications?.filter((app) => app.status === 'interview').length ?? 0;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-h4 text-text">Applications</h2>
          {applications && applications.length > 0 && (
            <p className="text-body-s text-text-weaker mt-1">
              {applications.length} candidature
              {applications.length > 1 ? 's' : ''}
              {interviewCount > 0
                ? ` · ${interviewCount} entretien${interviewCount > 1 ? 's' : ''} à venir`
                : ''}
            </p>
          )}
        </div>
        <Link
          to="/cv-analysis"
          className="text-button-m bg-accent hover:bg-accent-hover rounded-lg px-4 py-2 text-white transition-colors"
        >
          + Nouvelle candidature
        </Link>
      </div>

      {isLoading && <p className="text-body-m text-text-weaker">Chargement…</p>}

      {isError && (
        <p className="text-body-m text-error">
          Impossible de charger les candidatures. Réessaie dans un instant.
        </p>
      )}

      {applications && applications.length === 0 && (
        <div className="flex flex-col items-center px-4 py-16 text-center">
          <span
            aria-hidden="true"
            className="bg-surface-raised mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
          >
            🎯
          </span>
          <p className="text-body-l-strong text-text">
            Aucune candidature pour l'instant
          </p>
          <p className="text-body-m text-text-weaker mt-2 max-w-[360px]">
            Importez votre CV et l'offre qui vous intéresse : TalkUp crée votre
            candidature et génère un parcours d'entraînement sur mesure.
          </p>
          <Link
            to="/cv-analysis"
            className="text-button-m bg-accent hover:bg-accent-hover mt-5 rounded-lg px-5 py-2.5 text-white transition-colors"
          >
            Commencer une analyse CV + offre
          </Link>
        </div>
      )}

      {applications && applications.length > 0 && (
        <ApplicationsKanban
          applications={applications}
          pendingIds={pendingIds}
          onStatusChange={(applicationId, status) =>
            updateStatus.mutate({ applicationId, status })
          }
          onDelete={(applicationId) => deleteApplication.mutate(applicationId)}
          onOpenTraining={openTraining}
        />
      )}
    </div>
  );
}

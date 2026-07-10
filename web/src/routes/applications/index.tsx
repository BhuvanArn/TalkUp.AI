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

  const hasApplications = Boolean(applications && applications.length > 0);
  const isEmpty = Boolean(applications && applications.length === 0);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-h4 text-text">Applications</h2>
          {hasApplications && (
            <p className="text-body-s text-text-weaker mt-1">
              {applications!.length} application
              {applications!.length > 1 ? 's' : ''}
              {interviewCount > 0
                ? ` · ${interviewCount} interview${interviewCount > 1 ? 's' : ''} coming up`
                : ''}
            </p>
          )}
        </div>
        {/* The add button only shows once at least one application exists — the
            empty state carries its own single call to action instead. */}
        {hasApplications && (
          <Link
            to="/cv-analysis"
            className="text-button-m bg-accent hover:bg-accent-hover rounded-lg px-4 py-2 text-white transition-colors"
          >
            + New application
          </Link>
        )}
      </div>

      {isLoading && <p className="text-body-m text-text-weaker">Loading…</p>}

      {isError && (
        <p className="text-body-m text-error">
          Couldn&apos;t load your applications. Please try again in a moment.
        </p>
      )}

      {isEmpty && (
        <div className="relative">
          {/* The real board is rendered behind a forcefield: dimmed and made
              inert so it reads as "this is where your applications will live",
              while the overlay owns the only interaction. */}
          <div
            aria-hidden="true"
            className="pointer-events-none opacity-40 blur-[1px] select-none"
          >
            <ApplicationsKanban
              applications={[]}
              pendingIds={pendingIds}
              onStatusChange={() => {}}
              onDelete={() => {}}
              onOpenTraining={() => {}}
            />
          </div>

          {/* Forcefield: darkening wash + stippling, with the create CTA. */}
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[1px]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl opacity-60 [background-image:radial-gradient(var(--color-border-strong)_1px,transparent_1px)] [background-size:10px_10px]"
            />
            <div className="relative flex max-w-[380px] flex-col items-center px-4 text-center">
              <span
                aria-hidden="true"
                className="bg-surface-raised mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
              >
                🎯
              </span>
              <p className="text-body-l-strong text-text">
                No applications yet
              </p>
              <p className="text-body-m text-text-weaker mt-2">
                Import your CV and a job offer that interests you, and TalkUp
                creates your application with a tailored training path.
              </p>
              <Link
                to="/cv-analysis"
                className="text-button-m bg-accent hover:bg-accent-hover mt-5 rounded-lg px-5 py-2.5 text-white transition-colors"
              >
                Start a CV + offer analysis
              </Link>
            </div>
          </div>
        </div>
      )}

      {hasApplications && (
        <ApplicationsKanban
          applications={applications!}
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

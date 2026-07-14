import { iconMap } from '@/components/atoms/icon/icon-map';
import { ApplicationsKanban } from '@/components/organisms/applications-kanban';
import {
  useApplications,
  useDeleteApplication,
  useUpdateApplicationInterviewAt,
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
  const updateInterviewAt = useUpdateApplicationInterviewAt();
  const deleteApplication = useDeleteApplication();
  const ApplicationsIcon = iconMap.applications;
  const PlusIcon = iconMap.plus;

  const pendingIds = new Set<string>();
  if (updateStatus.isPending && updateStatus.variables) {
    pendingIds.add(updateStatus.variables.applicationId);
  }
  if (updateInterviewAt.isPending && updateInterviewAt.variables) {
    pendingIds.add(updateInterviewAt.variables.applicationId);
  }
  if (deleteApplication.isPending && deleteApplication.variables) {
    pendingIds.add(deleteApplication.variables);
  }

  const openTraining = (applicationId: string) => {
    navigate({
      to: '/applications/$applicationId/roadmap',
      params: { applicationId },
    });
  };

  const interviewCount =
    applications?.filter((app) => app.status === 'interview').length ?? 0;

  const hasApplications = Boolean(applications && applications.length > 0);
  const isEmpty = Boolean(applications && applications.length === 0);

  return (
    <div className="flex min-h-full flex-col p-6">
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
            className="text-button-m bg-accent hover:bg-accent-hover flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors"
          >
            <PlusIcon size={18} aria-hidden="true" />
            New application
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
        <div className="relative flex flex-1">
          {/* The real board is rendered behind a forcefield: dimmed and made
              inert so it reads as "this is where your applications will live",
              while the overlay owns the only interaction. It stretches to fill
              the page so the empty state doesn't leave a blank lower half. */}
          <div
            aria-hidden="true"
            className="pointer-events-none flex-1 opacity-70 select-none [&>div]:h-full [&_[data-testid^=kanban-column]]:h-full"
          >
            <ApplicationsKanban
              applications={[]}
              pendingIds={pendingIds}
              onStatusChange={() => {}}
              onDelete={() => {}}
              onInterviewAtChange={() => {}}
              onOpenTraining={() => {}}
            />
          </div>

          {/* Forcefield: a light wash lets the board glow through. The dotted
              frame is inset into the page padding so it wraps the whole board
              without doubling up on the column edges. */}
          <div
            className="absolute inset-0 bg-background/25"
            aria-hidden="true"
          />
          <div
            aria-hidden="true"
            className="border-border-strong pointer-events-none absolute -inset-3 rounded-2xl border-2 border-dotted"
          />

          {/* The CTA sits on its own frosted card so it stays crisp and
              inviting over the columns behind it. */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-border bg-background/85 flex max-w-[400px] flex-col items-center rounded-2xl border px-8 py-9 text-center shadow-xl backdrop-blur-md">
              <span
                aria-hidden="true"
                className="bg-surface-raised text-accent mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              >
                <ApplicationsIcon size={28} />
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
          onInterviewAtChange={(applicationId, interviewAt) =>
            updateInterviewAt.mutate({ applicationId, interviewAt })
          }
          onOpenTraining={openTraining}
        />
      )}
    </div>
  );
}

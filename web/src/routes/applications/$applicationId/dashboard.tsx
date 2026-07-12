import { InterviewDatePill } from '@/components/molecules/interview-date-pill';
import { RoadmapTimeline } from '@/components/organisms/roadmap-timeline';
import {
  useApplications,
  useRegenerateRoadmap,
  useRoadmap,
} from '@/services/applications/hooks';
import { createAuthGuard } from '@/utils/auth.guards';
import { Link, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/applications/$applicationId/dashboard')({
  beforeLoad: createAuthGuard('/applications/$applicationId/dashboard'),
  component: ApplicationDashboard,
});

function ApplicationDashboard() {
  const { applicationId } = Route.useParams();
  return <RoadmapPage applicationId={applicationId} />;
}

/**
 * F6 preparation path: LLM-generated, cached roadmap for one application.
 * Exported for tests; orchestrates loading / error / empty / ready states.
 */
export function RoadmapPage({ applicationId }: { applicationId: string }) {
  // Sim-route pattern: read the application from the cached list (renders on
  // stale cache and on deep links; header/date are cosmetic until it lands).
  const { data: applications } = useApplications();
  const application = applications?.find(
    (item) => item.applicationId === applicationId,
  );
  const { data: roadmap, isLoading, isError } = useRoadmap(applicationId);
  const regenerate = useRegenerateRoadmap(applicationId);

  const heading = application
    ? [application.jobTitle, application.companyName]
        .filter(Boolean)
        .join(' at ') || 'Preparation path'
    : 'Preparation path';

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-text-weak">Building your preparation path…</p>
      </div>
    );
  }

  if (isError || !roadmap) {
    return (
      <div className="flex flex-col items-start gap-4 p-6">
        <p className="text-error">Could not load your preparation path.</p>
        <button
          type="button"
          onClick={() => regenerate.mutate()}
          disabled={regenerate.isPending}
          className="text-button-m bg-accent hover:bg-accent-hover cursor-pointer rounded-2xl px-6 py-3 text-white disabled:cursor-not-allowed disabled:bg-disabled"
        >
          {regenerate.isPending ? 'Retrying…' : 'Retry'}
        </button>
        {regenerate.isError && (
          <p className="text-body-s text-error">
            Couldn't regenerate — try again in a minute.
          </p>
        )}
      </div>
    );
  }

  const isEmpty = roadmap.topics.length === 0 && !roadmap.summary;
  const hasOfferButEmpty = isEmpty && Boolean(application?.offerDetails);

  return (
    <div className="bg-surface flex min-h-full flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-h4 text-text">{heading}</h1>
          {roadmap.summary && (
            <p className="text-body-m text-text-weak mt-1">{roadmap.summary}</p>
          )}
        </div>
        <InterviewDatePill
          applicationId={applicationId}
          interviewAt={application?.interviewAt ?? null}
          topicsCount={roadmap.topics.length}
        />
      </header>

      {isEmpty ? (
        <div className="border-border flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
          {hasOfferButEmpty ? (
            <>
              <p className="text-body-l text-text-weak">
                Couldn't build a path from this offer yet — try Regenerate.
              </p>
              <button
                type="button"
                onClick={() => regenerate.mutate()}
                disabled={regenerate.isPending}
                className="text-button-m bg-accent hover:bg-accent-hover cursor-pointer rounded-2xl px-6 py-3 text-white disabled:cursor-not-allowed disabled:bg-disabled"
              >
                {regenerate.isPending ? 'Regenerating…' : 'Regenerate'}
              </button>
            </>
          ) : (
            <>
              <p className="text-body-l text-text-weak">
                No preparation path yet. Analyze an offer first.
              </p>
              <Link to="/cv-analysis" className="text-button-m text-accent">
                Go to CV analysis
              </Link>
            </>
          )}
        </div>
      ) : (
        <RoadmapTimeline
          roadmap={roadmap}
          interviewAt={application?.interviewAt ?? null}
        />
      )}

      <footer className="flex flex-wrap items-center gap-4">
        <Link
          to="/applications/$applicationId/simulations"
          params={{ applicationId }}
          className="text-button-m bg-accent hover:bg-accent-hover rounded-2xl px-8 py-3 text-white"
        >
          Start simulation
        </Link>
        <Link
          to="/notes"
          className="text-button-m border-accent text-accent rounded-2xl border px-8 py-3"
        >
          My notes
        </Link>
        <div className="ml-auto flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
            className="text-body-s text-text-weak hover:text-accent cursor-pointer underline disabled:cursor-not-allowed"
          >
            {regenerate.isPending ? 'Regenerating…' : 'Regenerate'}
          </button>
          {regenerate.isError && (
            <p className="text-body-s text-error">
              Couldn't regenerate — try again in a minute.
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

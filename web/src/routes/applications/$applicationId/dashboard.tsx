import { iconMap } from '@/components/atoms/icon/icon-map';
import { InterviewDatePill } from '@/components/molecules/interview-date-pill';
import { RoadmapTimeline } from '@/components/organisms/roadmap-timeline';
import {
  useApplications,
  useRegenerateRoadmap,
  useRoadmap,
} from '@/services/applications/hooks';
import { createAuthGuard } from '@/utils/auth.guards';
import { Link, createFileRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';

const RegenerateIcon = iconMap.redo;
const NotesIcon = iconMap.notes;
const StartIcon = iconMap['arrow-right'];

/** Shared page frame: centered, width-capped so content never floats in a
 * top-left void on wide screens. Every state renders inside it. */
function RoadmapShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface min-h-full w-full">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        {children}
      </div>
    </div>
  );
}

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
    // Skeleton of the rail (gauge dot + step cards) so the loading state has
    // the same shape and centering as the finished page, instead of a bare
    // line of text pinned to the corner.
    return (
      <RoadmapShell>
        <div className="flex flex-col gap-2">
          <div className="bg-surface-raised h-7 w-72 animate-pulse rounded-lg" />
          <div className="bg-surface-raised h-4 w-96 max-w-full animate-pulse rounded" />
        </div>
        <div className="flex gap-6 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-raised h-40 w-64 shrink-0 animate-pulse rounded-2xl"
            />
          ))}
        </div>
        <p className="text-body-s text-text-weak">
          Building your preparation path…
        </p>
      </RoadmapShell>
    );
  }

  if (isError || !roadmap) {
    return (
      <RoadmapShell>
        <div className="border-border flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
          <p className="text-body-l text-error">
            Could not load your preparation path.
          </p>
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
      </RoadmapShell>
    );
  }

  const isEmpty = roadmap.topics.length === 0 && !roadmap.summary;
  const hasOfferButEmpty = isEmpty && Boolean(application?.offerDetails);

  return (
    <RoadmapShell>
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

      <footer className="border-border mt-2 flex flex-wrap items-center gap-4 border-t pt-6">
        <Link
          to="/applications/$applicationId/simulations"
          params={{ applicationId }}
          className="text-button-m bg-accent hover:bg-accent-hover flex items-center gap-2 rounded-2xl px-8 py-3 text-white"
        >
          Start simulation
          <StartIcon size={16} aria-hidden="true" />
        </Link>
        <Link
          to="/notes"
          className="text-button-m border-accent text-accent hover:bg-accent-weak flex items-center gap-2 rounded-2xl border px-8 py-3 transition-colors"
        >
          <NotesIcon size={16} aria-hidden="true" />
          My notes
        </Link>
        <div className="ml-auto flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
            className="text-button-m border-border text-text-weak hover:border-accent hover:text-accent flex cursor-pointer items-center gap-2 rounded-2xl border px-5 py-3 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RegenerateIcon
              size={16}
              aria-hidden="true"
              className={regenerate.isPending ? 'animate-spin' : ''}
            />
            {regenerate.isPending ? 'Regenerating…' : 'Regenerate'}
          </button>
          {regenerate.isError && (
            <p className="text-body-s text-error">
              Couldn't regenerate — try again in a minute.
            </p>
          )}
        </div>
      </footer>
    </RoadmapShell>
  );
}

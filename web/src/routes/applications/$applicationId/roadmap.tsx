import { iconMap } from '@/components/atoms/icon/icon-map';
import { InterviewDatePill } from '@/components/molecules/interview-date-pill';
import { RoadmapTalkingPoints } from '@/components/organisms/roadmap-talking-points';
import { RoadmapTimeline } from '@/components/organisms/roadmap-timeline';
import {
  useApplications,
  useRegenerateRoadmap,
  useRoadmap,
} from '@/services/applications/hooks';
import { createAuthGuard } from '@/utils/auth.guards';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

const RegenerateIcon = iconMap.redo;
const NotesIcon = iconMap.notes;
const StartIcon = iconMap['arrow-right'];

/**
 * Standard TalkUp window frame — matches Notes/Agenda: full-width with
 * responsive side padding (no max-width centering), a fixed-height title band,
 * then a content row that fills the rest of the viewport. `header` is the title
 * band; `children` is the content row (which manages its own scroll).
 */
function RoadmapShell({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid h-screen w-full min-w-0 grid-rows-[auto_1fr] gap-6 px-4 pt-11 pb-8 sm:px-8 md:px-16">
      <div className="flex w-full min-w-0 flex-col justify-center">
        {header}
      </div>
      <div className="flex min-h-0 w-full min-w-0 flex-col gap-6">
        {children}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/applications/$applicationId/roadmap')({
  beforeLoad: createAuthGuard('/applications/$applicationId/roadmap'),
  component: ApplicationRoadmap,
});

function ApplicationRoadmap() {
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
  // Which view is showing. The "talking" tab only appears when there are points
  // (see below), so this only ever reaches 'talking' while that tab exists.
  const [activeTab, setActiveTab] = useState<'path' | 'talking'>('path');

  const heading = application
    ? [application.jobTitle, application.companyName]
        .filter(Boolean)
        .join(' at ') || 'Preparation path'
    : 'Preparation path';

  if (isLoading) {
    // Skeleton of the rail (title + step cards) so the loading state shares the
    // shape and framing of the finished page, not a bare line of corner text.
    return (
      <RoadmapShell
        header={
          <div className="flex flex-col gap-2">
            <div className="bg-surface-raised h-9 w-80 max-w-full animate-pulse rounded-lg" />
            <div className="bg-surface-raised h-4 w-96 max-w-full animate-pulse rounded" />
          </div>
        }
      >
        <div className="flex gap-6 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-raised h-40 w-60 shrink-0 animate-pulse rounded-2xl"
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
      <RoadmapShell
        header={<h1 className="text-h1 text-text-idle">{heading}</h1>}
      >
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
  // `?? []` guards roadmaps cached before talking_points existed (field absent
  // on the wire). Drives whether the second tab shows at all.
  const talkingPoints = roadmap.talking_points ?? [];

  // Action bar — shared by the ready state (pinned inside the timeline's scroll
  // frame) and the empty state (plain footer). Never scrolls horizontally.
  const actions = (
    <div className="flex flex-wrap items-center gap-4">
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
    </div>
  );

  return (
    <RoadmapShell
      header={
        <div className="flex w-full min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-h1 text-text-idle">{heading}</h1>
            {roadmap.summary && (
              <p className="text-body-m text-text-weak mt-1">
                {roadmap.summary}
              </p>
            )}
          </div>
          <InterviewDatePill
            applicationId={applicationId}
            interviewAt={application?.interviewAt ?? null}
            topicsCount={roadmap.topics.length}
          />
        </div>
      }
    >
      {isEmpty ? (
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="border-border flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-10 text-center">
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
          <footer className="border-border shrink-0 border-t pt-6">
            {actions}
          </footer>
        </div>
      ) : talkingPoints.length > 0 ? (
        <RoadmapTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          timeline={
            <RoadmapTimeline
              roadmap={roadmap}
              interviewAt={application?.interviewAt ?? null}
              actions={actions}
            />
          }
          talkingPoints={<RoadmapTalkingPoints points={talkingPoints} />}
        />
      ) : (
        <div className="min-h-0 flex-1">
          <RoadmapTimeline
            roadmap={roadmap}
            interviewAt={application?.interviewAt ?? null}
            actions={actions}
          />
        </div>
      )}
    </RoadmapShell>
  );
}

const TABS = [
  { key: 'path', label: 'Preparation path' },
  { key: 'talking', label: 'Interview talking points' },
] as const;

/**
 * Two-view switcher implementing the full ARIA tabs pattern: a `tablist` of
 * `tab`s wired to their `tabpanel`s via `aria-controls`/`aria-labelledby`, with
 * roving tabindex + Left/Right/Home/End arrow-key navigation (only the active
 * tab is in the tab order; arrows move between them).
 */
function RoadmapTabs({
  activeTab,
  onTabChange,
  timeline,
  talkingPoints,
}: {
  activeTab: 'path' | 'talking';
  onTabChange: (tab: 'path' | 'talking') => void;
  timeline: ReactNode;
  talkingPoints: ReactNode;
}) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (index: number) => {
    const bounded = (index + TABS.length) % TABS.length;
    onTabChange(TABS[bounded].key);
    tabRefs.current[bounded]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusTab(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusTab(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusTab(TABS.length - 1);
    }
  };

  return (
    <>
      <div
        role="tablist"
        aria-label="Roadmap views"
        className="border-border flex shrink-0 gap-1 border-b"
      >
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`roadmap-tab-${tab.key}`}
              aria-selected={isActive}
              aria-controls={`roadmap-panel-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.key)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`text-button-m cursor-pointer rounded-none border-b-[2.5px] px-5 py-3 transition-colors ${
                isActive
                  ? 'border-accent text-text'
                  : 'text-text-weaker hover:text-text border-transparent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="roadmap-panel-path"
        aria-labelledby="roadmap-tab-path"
        hidden={activeTab !== 'path'}
        className="min-h-0 flex-1"
      >
        {activeTab === 'path' && timeline}
      </div>
      <div
        role="tabpanel"
        id="roadmap-panel-talking"
        aria-labelledby="roadmap-tab-talking"
        hidden={activeTab !== 'talking'}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {activeTab === 'talking' && talkingPoints}
      </div>
    </>
  );
}

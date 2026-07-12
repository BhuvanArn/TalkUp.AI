import { useUpdateApplicationInterviewAt } from '@/services/applications/hooks';
import { format } from 'date-fns';
import { useState } from 'react';

interface InterviewDatePillProps {
  applicationId: string;
  /** ISO string, null until scheduled (application.interviewAt). */
  interviewAt: string | null;
  /** Number of roadmap topics — used to suggest a preparation pace. */
  topicsCount: number;
}

const MS_PER_DAY = 86_400_000;

/**
 * The date input yields a bare `YYYY-MM-DD`. `new Date(str)` would parse that
 * as UTC midnight, which renders one day earlier west of UTC. Build a LOCAL
 * date instead so the stored ISO round-trips to the same calendar day the
 * user picked (same rationale as the application-card date input).
 */
const dateInputToIso = (value: string): string => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toISOString();
};

/**
 * Interview-date pill, two states:
 * - set: date + countdown + suggested pace (all computed client-side).
 * - unset: dashed "Add interview date +" -> date picker -> writes
 *   interview_at via the existing useUpdateApplicationInterviewAt mutation.
 */
export const InterviewDatePill = ({
  applicationId,
  interviewAt,
  topicsCount,
}: InterviewDatePillProps) => {
  const [isPicking, setIsPicking] = useState(false);
  const updateInterviewAt = useUpdateApplicationInterviewAt();

  if (interviewAt) {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(interviewAt).getTime() - Date.now()) / MS_PER_DAY),
    );
    const weeks = Math.max(1, daysLeft / 7);
    const pace =
      topicsCount > 0 ? Math.max(1, Math.ceil(topicsCount / weeks)) : 0;
    return (
      <div className="bg-accent-weak text-accent flex flex-wrap items-center gap-2 rounded-full px-4 py-2">
        <span className="text-label-m">
          Interview {format(new Date(interviewAt), 'd MMM yyyy')}
        </span>
        <span className="text-body-s">• {daysLeft} days left</span>
        {pace > 0 && <span className="text-body-s">• ≈{pace} topics/week</span>}
      </div>
    );
  }

  if (isPicking) {
    // The whole pill is the hit target: the label sits over a full-bleed date
    // input (opacity-0, inset-0) so a click anywhere opens the native picker —
    // no hunting for the tiny calendar glyph. `showPicker()` (where supported)
    // pops the calendar immediately on mount; the visible text stays as our
    // own label so we never show the raw `dd/mm/yyyy` placeholder.
    return (
      <label className="border-accent text-accent bg-accent-weak relative flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2">
        <span className="text-label-m">Pick a date</span>
        <input
          ref={(node) => {
            node?.showPicker?.();
          }}
          type="date"
          aria-label="Interview date"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(event) => {
            if (!event.target.value) return;
            updateInterviewAt.mutate({
              applicationId,
              interviewAt: dateInputToIso(event.target.value),
            });
            setIsPicking(false);
          }}
        />
      </label>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsPicking(true)}
      className="border-border text-text-weak hover:border-accent hover:text-accent hover:bg-accent-weak cursor-pointer rounded-full border border-dashed px-4 py-2 transition-colors"
    >
      <span className="text-label-m">Add interview date +</span>
    </button>
  );
};

export default InterviewDatePill;

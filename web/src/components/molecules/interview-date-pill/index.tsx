import { iconMap } from '@/components/atoms/icon/icon-map';
import { useUpdateApplicationInterviewAt } from '@/services/applications/hooks';
import { format } from 'date-fns';
import { useRef } from 'react';

const PlusIcon = iconMap.plus;

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

/** ISO string -> the `YYYY-MM-DD` a `<input type="date">` expects, in LOCAL
 * time so the value shown matches the stored calendar day (see above). */
const isoToDateInput = (iso: string): string =>
  format(new Date(iso), 'yyyy-MM-dd');

/**
 * Interview-date pill. One clickable control in both states:
 * - unset: dashed "Add interview date" with a leading + icon.
 * - set: date + countdown + suggested pace (all computed client-side).
 *
 * Either way the whole pill is a `<label>` over a full-bleed, transparent date
 * input, so a click anywhere opens the native picker — to SET a date when unset
 * or to EDIT it when already set (the input is seeded with the current date).
 * Writes `interview_at` via the existing mutation.
 */
export const InterviewDatePill = ({
  applicationId,
  interviewAt,
  topicsCount,
}: InterviewDatePillProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const updateInterviewAt = useUpdateApplicationInterviewAt();

  // `showPicker()` must run INSIDE the click gesture — never from a ref/effect,
  // where the browser rejects it ("requires a user gesture"). Best-effort: on
  // browsers without it, clicking the input still opens the picker, and we
  // swallow a stale-gesture error defensively.
  const openPicker = () => {
    try {
      inputRef.current?.showPicker?.();
    } catch {
      // Native input is focused anyway, so the user can still open the picker.
    }
  };

  const pillClass = interviewAt
    ? 'bg-accent-weak text-accent border-transparent hover:border-accent'
    : 'border-border border-dashed text-text-weak hover:border-accent hover:text-accent hover:bg-accent-weak';

  let content;
  if (interviewAt) {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(interviewAt).getTime() - Date.now()) / MS_PER_DAY),
    );
    const weeks = Math.max(1, daysLeft / 7);
    const pace =
      topicsCount > 0 ? Math.max(1, Math.ceil(topicsCount / weeks)) : 0;
    content = (
      <>
        <span className="text-label-m">
          Interview {format(new Date(interviewAt), 'd MMM yyyy')}
        </span>
        <span className="text-body-s">• {daysLeft} days left</span>
        {pace > 0 && <span className="text-body-s">• ≈{pace} topics/week</span>}
        <span className="text-body-s underline">• Edit</span>
      </>
    );
  } else {
    content = (
      <span className="text-label-m flex items-center gap-1.5">
        <PlusIcon size={14} aria-hidden="true" />
        Add interview date
      </span>
    );
  }

  return (
    <label
      onClick={openPicker}
      className={`relative flex cursor-pointer flex-wrap items-center gap-2 rounded-full border px-4 py-2 transition-colors ${pillClass}`}
    >
      {content}
      <input
        ref={inputRef}
        type="date"
        aria-label="Interview date"
        // Seed with the current value so editing opens on the set date; keyed so
        // a fresh value from a successful write re-seeds the input.
        defaultValue={interviewAt ? isoToDateInput(interviewAt) : undefined}
        key={interviewAt ?? 'unset'}
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(event) => {
          if (!event.target.value) return;
          updateInterviewAt.mutate({
            applicationId,
            interviewAt: dateInputToIso(event.target.value),
          });
        }}
      />
    </label>
  );
};

export default InterviewDatePill;

import { iconMap } from '@/components/atoms/icon/icon-map';
import type {
  Application,
  CvEducation,
  CvExperience,
  CvLanguage,
} from '@/services/applications/types';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const CloseIcon = iconMap.times;
const ExternalIcon = iconMap['arrow-right-up'];
const SourcesIcon = iconMap.cv;

function expLabel(e: CvExperience): string {
  return [e.title, e.company].filter(Boolean).join(' · ');
}

function eduLabel(e: CvEducation): string {
  return [e.degree, e.school_name].filter(Boolean).join(' · ');
}

function langLabel(l: CvLanguage): string {
  if (l.language && l.level) return `${l.language} (${l.level})`;
  return l.language ?? l.level ?? '';
}

/**
 * "Sources used" modal for the roadmap page: the job-offer URL that seeded the
 * application plus the parsed CV snapshot captured at analysis time. All data
 * comes from the already-loaded `application` — no fetch. Rendered only while
 * open (caller mounts/unmounts).
 *
 * Visually the two sources are two "document" cards on a plain sheet: the
 * offer card carries the modal's only outbound action, the CV card carries
 * the frozen-snapshot caption. Accent is reserved for the header badge, the
 * offer link, and the skill chips (matched signal); languages get neutral
 * outlined chips (attributes).
 */
export function RoadmapSourcesModal({
  application,
  onClose,
}: {
  application: Application;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const heading =
    [application.jobTitle, application.companyName]
      .filter(Boolean)
      .join(' at ') || 'Job offer';
  const cv = application.cvDetails;

  const experiences = (cv?.experiences ?? []).filter((e) => expLabel(e) !== '');
  const education = (cv?.education ?? []).filter((e) => eduLabel(e) !== '');
  const languages = (cv?.languages ?? []).filter((l) => langLabel(l) !== '');

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Dismiss sources"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-scrim/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="roadmap-sources-title"
        className="bg-background border-border animate-fadeIn relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col gap-5 overflow-y-auto rounded-2xl border p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="roadmap-sources-title"
            className="text-h5 text-text flex items-center gap-3"
          >
            <span
              aria-hidden="true"
              className="bg-accent-weak text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            >
              <SourcesIcon size={18} />
            </span>
            Sources used
          </h2>
          <button
            type="button"
            aria-label="Close sources"
            onClick={onClose}
            className="text-text-weaker hover:text-text hover:bg-surface focus-visible:ring-accent -m-1.5 rounded-lg p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <CloseIcon size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Job offer */}
        <section className="bg-surface border-border flex flex-col gap-2 rounded-xl border p-4">
          <h3 className="text-label-s text-text-weaker uppercase tracking-wider">
            Job offer
          </h3>
          <p className="text-body-l-strong text-text">{heading}</p>
          {application.offerUrl ? (
            <a
              href={application.offerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover text-body-m focus-visible:ring-accent inline-flex w-fit items-center gap-1 rounded-sm underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              Open job offer
              <ExternalIcon size={14} aria-hidden="true" />
            </a>
          ) : (
            <p className="text-body-s text-text-weaker">URL not available</p>
          )}
        </section>

        {/* CV used */}
        <section className="bg-surface border-border flex flex-col gap-3 rounded-xl border p-4">
          <h3 className="text-label-s text-text-weaker uppercase tracking-wider">
            CV used
          </h3>
          {cv ? (
            <>
              <p className="text-body-s text-text-weaker">
                Parsed from your CV at analysis time — the original file isn't
                stored.
              </p>
              {cv.desired_job && (
                <p className="text-body-l-strong text-text">{cv.desired_job}</p>
              )}
              {cv.resume && (
                <p className="text-body-m text-text-weak">{cv.resume}</p>
              )}
              {cv.technical_skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {cv.technical_skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-accent-weak text-accent text-body-s rounded-full px-3 py-1"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              {languages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {languages.map((l, i) => (
                    <span
                      key={`${langLabel(l)}-${i}`}
                      className="border-border bg-background text-text-weak text-body-s rounded-full border px-3 py-1"
                    >
                      {langLabel(l)}
                    </span>
                  ))}
                </div>
              )}
              {experiences.length > 0 && (
                <details className="text-text">
                  <summary className="text-body-s-strong text-text-weak hover:text-text marker:text-text-weakest w-fit transition-colors">
                    Experiences ({experiences.length})
                  </summary>
                  <ul className="mt-2 flex flex-col gap-2">
                    {experiences.map((e, i) => (
                      <li
                        key={`${expLabel(e)}-${i}`}
                        className="text-body-s text-text-weaker"
                      >
                        <span className="text-text">{expLabel(e)}</span>
                        {e.duration ? ` · ${e.duration}` : ''}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {education.length > 0 && (
                <details className="text-text">
                  <summary className="text-body-s-strong text-text-weak hover:text-text marker:text-text-weakest w-fit transition-colors">
                    Education ({education.length})
                  </summary>
                  <ul className="mt-2 flex flex-col gap-2">
                    {education.map((e, i) => (
                      <li
                        key={`${eduLabel(e)}-${i}`}
                        className="text-body-s text-text-weaker"
                      >
                        <span className="text-text">{eduLabel(e)}</span>
                        {e.duration ? ` · ${e.duration}` : ''}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          ) : (
            <p className="text-body-s text-text-weaker">
              No CV snapshot stored for this application.
            </p>
          )}
        </section>
      </div>
    </div>,
    document.body,
  );
}

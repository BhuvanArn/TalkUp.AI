import type { Application } from '@/services/applications/types';

import { iconMap } from '../../atoms/icon/icon-map';

/**
 * Props for the AnalysisResultCard component.
 */
interface AnalysisResultProps {
  /** The created application, with real offer/CV extraction data. */
  application: Application;
  /** Callback function triggered when the user wants to perform a new analysis. */
  onRetry: () => void;
  /** Callback function to navigate the user to their generated course. */
  onStartCourse: () => void;
}

/**
 * AnalysisResultCard Component
 *
 * @description
 * An organism component displayed after the AI has finished processing a user profile.
 * It features a success state badge, a summary of validated highlights (Skills, Path, AI),
 * and clear Call-to-Action (CTA) buttons to either start the training or restart the process.
 *
 * @param {AnalysisResultProps} props - The component props.
 * @returns {JSX.Element} A centered card containing the analysis results and actions.
 */
export const AnalysisResultCard = ({
  application,
  onRetry,
  onStartCourse,
}: AnalysisResultProps) => {
  const SuccessIcon = iconMap['check-circle'];
  const SkillsIcon = iconMap['tasks'];
  const PathIcon = iconMap['progression'];
  const AiIcon = iconMap['cog'];
  const RetryIcon = iconMap['undo'];

  const details = application.offerDetails;
  const highlights = [
    details?.sector && { Icon: SkillsIcon, label: details.sector },
    details?.location && { Icon: PathIcon, label: details.location },
    details?.contract_type && { Icon: AiIcon, label: details.contract_type },
  ].filter(Boolean) as { Icon: typeof SkillsIcon; label: string }[];

  return (
    <div className="border-border bg-background mx-auto max-w-[520px] rounded-3xl border px-12 py-14 text-center">
      {/* Main Success Badge */}
      <div className="bg-success-weaker mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl">
        <div className="bg-background flex h-11 w-11 items-center justify-center rounded-full">
          <SuccessIcon size={24} className="text-success" />
        </div>
      </div>

      <h2 className="text-h4 text-text mb-3">Analysis Complete!</h2>
      <p className="text-body-l-strong text-text mb-1">
        {application.jobTitle ?? 'Your target role'}
        {application.companyName ? ` · ${application.companyName}` : ''}
      </p>
      <p className="text-body-l text-text-weaker mb-8 leading-relaxed">
        Your profile has been fully processed. TalkUp has generated a
        personalized action plan based on your strengths and recruiter
        expectations.
      </p>

      {/* Highlights Grid */}
      {highlights.length > 0 && (
        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {highlights.map(({ Icon, label }, index) => (
            <div
              key={`${label}-${index}`}
              className="border-border bg-surface flex items-center gap-2 rounded-full border px-4 py-2"
            >
              <span className="text-accent flex">
                <Icon />
              </span>
              <span className="text-body-s-strong text-text-weak">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Primary Action Zone */}
      <div className="bg-accent-weaker mb-6 rounded-3xl p-8">
        <p className="text-body-l-strong text-accent mb-5">
          Your custom training is ready.
        </p>
        <button
          type="button"
          onClick={onStartCourse}
          className="text-button-m bg-accent hover:bg-accent-hover focus-visible:ring-accent w-full cursor-pointer rounded-xl px-8 py-4 text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Start My Training
        </button>
      </div>

      {/* Secondary Action Link */}
      <button
        type="button"
        onClick={onRetry}
        className="text-body-s text-text-weakest hover:text-text-weak cursor-pointer underline"
      >
        <span className="flex items-center justify-center gap-1.5">
          <RetryIcon size={14} />
          Analyze another profile
        </span>
      </button>
    </div>
  );
};

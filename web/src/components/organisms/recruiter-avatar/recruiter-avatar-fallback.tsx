import {
  RECRUITER_DISPLAY_NAME,
  RECRUITER_DISPLAY_ROLE,
} from '@/config/recruiter-avatar';
import { cn } from '@/utils/cn';

interface RecruiterAvatarFallbackProps {
  isAiSpeaking: boolean;
  isAwaitingAiResponse: boolean;
  fallbackReason?: string | null;
  className?: string;
}

/**
 * Static fallback when WebGL or the 3D avatar fails to load.
 * Uses the existing interviewer photo asset.
 */
export function RecruiterAvatarFallback({
  isAiSpeaking,
  isAwaitingAiResponse,
  fallbackReason,
  className,
}: RecruiterAvatarFallbackProps) {
  return (
    <div className={cn('relative h-full w-full', className)}>
      <img
        src="/interviewer.jpg"
        alt={`${RECRUITER_DISPLAY_NAME}, ${RECRUITER_DISPLAY_ROLE}`}
        className="h-full w-full object-cover"
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10">
        <p className="text-sm font-semibold text-white">
          {RECRUITER_DISPLAY_NAME}
        </p>
        <p className="text-xs text-white/80">{RECRUITER_DISPLAY_ROLE}</p>
      </div>

      {isAiSpeaking ? (
        <StatusBadge label="Speaking…" variant="speaking" />
      ) : null}

      {isAwaitingAiResponse && !isAiSpeaking ? (
        <StatusBadge label="Thinking…" variant="thinking" />
      ) : null}

      {fallbackReason ? (
        <p className="absolute top-3 right-3 max-w-[12rem] rounded bg-surface/90 px-2 py-1 text-[10px] text-text-weak">
          {fallbackReason}
        </p>
      ) : null}
    </div>
  );
}

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: 'speaking' | 'thinking';
}) {
  return (
    <div
      className={cn(
        'absolute bottom-4 left-4 flex items-center gap-2 rounded px-3 py-1 text-sm font-semibold',
        variant === 'speaking'
          ? 'bg-surface/70 text-text'
          : 'bg-surface/60 text-text-weak',
      )}
    >
      <span className="flex gap-0.5" aria-hidden="true">
        <span
          className={cn(
            'h-3 w-1 animate-pulse rounded-full',
            variant === 'speaking' ? 'bg-accent' : 'bg-idle',
          )}
        />
        <span
          className={cn(
            'h-3 w-1 animate-pulse rounded-full [animation-delay:150ms]',
            variant === 'speaking' ? 'bg-accent' : 'bg-idle',
          )}
        />
        <span
          className={cn(
            'h-3 w-1 animate-pulse rounded-full [animation-delay:300ms]',
            variant === 'speaking' ? 'bg-accent' : 'bg-idle',
          )}
        />
      </span>
      {label}
    </div>
  );
}

export default RecruiterAvatarFallback;

import { resolveRecruiterOfficeBackgroundUrl } from '@/config/recruiter-avatar';
import { cn } from '@/utils/cn';

interface RecruiterAvatarBackdropProps {
  className?: string;
}

/**
 * Modern office room backdrop for the recruiter avatar panel.
 * Sits behind the WebGL canvas (transparent) or fallback content.
 */
export function RecruiterAvatarBackdrop({
  className,
}: RecruiterAvatarBackdropProps) {
  const backgroundUrl = resolveRecruiterOfficeBackgroundUrl();

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
      aria-hidden="true"
    >
      <img
        src={backgroundUrl}
        alt=""
        className="h-full w-full scale-105 object-cover object-[center_35%]"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
      <div className="absolute inset-0 bg-black/5" />
    </div>
  );
}

export default RecruiterAvatarBackdrop;

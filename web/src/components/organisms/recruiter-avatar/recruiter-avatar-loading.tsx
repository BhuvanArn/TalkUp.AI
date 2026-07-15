import { DEFAULT_PERSONA, type RecruiterPersona } from '@/config/personas';

import RecruiterAvatarBackdrop from './recruiter-avatar-backdrop';

/** Loading placeholder while WebGL capability or the 3D engine initializes. */
export function RecruiterAvatarLoading({
  persona = DEFAULT_PERSONA,
}: {
  persona?: RecruiterPersona;
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <RecruiterAvatarBackdrop />
      <div className="relative z-10 text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm font-semibold text-white drop-shadow-sm">
          {persona.name}
        </p>
        <p className="text-xs text-white/90 drop-shadow-sm">{persona.role}</p>
        <p className="mt-2 text-xs text-white/80 drop-shadow-sm">
          Loading 3D avatar…
        </p>
      </div>
    </div>
  );
}

export default RecruiterAvatarLoading;

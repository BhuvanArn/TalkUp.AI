import {
  RECRUITER_DISPLAY_NAME,
  RECRUITER_DISPLAY_ROLE_KEY,
} from '@/config/recruiter-avatar';
import { useTranslation } from 'react-i18next';

import RecruiterAvatarBackdrop from './recruiter-avatar-backdrop';

/** Loading placeholder while WebGL capability or the 3D engine initializes. */
export function RecruiterAvatarLoading() {
  const { t } = useTranslation('app');

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <RecruiterAvatarBackdrop />
      <div className="relative z-10 text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm font-semibold text-white drop-shadow-sm">
          {RECRUITER_DISPLAY_NAME}
        </p>
        <p className="text-xs text-white/90 drop-shadow-sm">
          {t(RECRUITER_DISPLAY_ROLE_KEY)}
        </p>
        <p className="mt-2 text-xs text-white/80 drop-shadow-sm">
          {t('recruiter.loading3d')}
        </p>
      </div>
    </div>
  );
}

export default RecruiterAvatarLoading;

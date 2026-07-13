import {
  clearAvatarFallbackForced,
  isAvatarFallbackForced,
  resolveRecruiterAvatarUrl,
} from '@/config/recruiter-avatar';
import { detectWebGLSupport } from '@/utils/webgl';
import { useEffect, useState } from 'react';

export type RecruiterAvatarMode = 'loading' | '3d' | 'fallback';

export interface UseRecruiterAvatarCapabilityReturn {
  mode: RecruiterAvatarMode;
  avatarUrl: string;
  fallbackReason: string | null;
  retry3d: () => void;
}

/**
 * Determines whether the 3D recruiter avatar can run in this browser session.
 * Falls back to the static image when WebGL is unavailable or the user forces it.
 */
export function useRecruiterAvatarCapability(): UseRecruiterAvatarCapabilityReturn {
  const [mode, setMode] = useState<RecruiterAvatarMode>('loading');
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    // Drop stale fallback locks from earlier failed 3D loads in this tab.
    clearAvatarFallbackForced();

    const forced = isAvatarFallbackForced();
    const support = detectWebGLSupport(forced);

    if (support.supported) {
      setMode('3d');
      setFallbackReason(null);
      return;
    }

    setMode('fallback');
    switch (support.reason) {
      case 'forced-fallback':
        setFallbackReason('3D avatar disabled for this session.');
        break;
      case 'webgl-unavailable':
      case 'webgl-context-failed':
        setFallbackReason('WebGL is not available in this browser.');
        break;
      default:
        setFallbackReason('3D avatar unavailable.');
        break;
    }
  }, [retryToken]);

  return {
    mode,
    avatarUrl: resolveRecruiterAvatarUrl(),
    fallbackReason,
    retry3d: () => setRetryToken((value) => value + 1),
  };
}

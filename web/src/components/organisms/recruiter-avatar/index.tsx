import { Suspense, lazy, useCallback, useState } from 'react';

import RecruiterAvatarFallback from './recruiter-avatar-fallback';
import RecruiterAvatarLoading from './recruiter-avatar-loading';
import type { RecruiterAvatarPanelProps } from './types';

const RecruiterAvatar3D = lazy(() =>
  import('./recruiter-avatar-3d').then((module) => ({
    default: module.RecruiterAvatar3D,
  })),
);

/**
 * Chooses between the interactive 3D avatar and a static fallback image.
 */
export function RecruiterAvatarPanel({
  active,
  isAiSpeaking,
  isAwaitingAiResponse,
  speechTurn,
  avatarUrl,
  avatarMode,
  capabilityFallbackReason,
  onFallbackRequest,
}: RecruiterAvatarPanelProps) {
  const [runtimeFallback, setRuntimeFallback] = useState<string | null>(null);

  const handleRuntimeFallback = useCallback(
    (reason: string) => {
      setRuntimeFallback(reason);
      onFallbackRequest(reason);
    },
    [onFallbackRequest],
  );

  const wants3d = avatarMode === '3d' || avatarMode === 'loading';
  const use3d = wants3d && !runtimeFallback;

  if (avatarMode === 'loading' && !runtimeFallback) {
    return <RecruiterAvatarLoading />;
  }

  if (!use3d) {
    return (
      <RecruiterAvatarFallback
        isAiSpeaking={isAiSpeaking}
        isAwaitingAiResponse={isAwaitingAiResponse}
        fallbackReason={runtimeFallback ?? capabilityFallbackReason}
      />
    );
  }

  return (
    <Suspense fallback={<RecruiterAvatarLoading />}>
      <RecruiterAvatar3D
        active={active}
        avatarUrl={avatarUrl}
        isAiSpeaking={isAiSpeaking}
        isAwaitingAiResponse={isAwaitingAiResponse}
        speechTurn={speechTurn}
        onLoadError={handleRuntimeFallback}
        onContextLost={() =>
          handleRuntimeFallback('WebGL context lost — using static avatar.')
        }
      />
    </Suspense>
  );
}

export default RecruiterAvatarPanel;

import type { AiSpeechTurn } from '@/hooks/simulation/useAudioPlayback';
import type { RecruiterAvatarMode } from '@/hooks/simulation/useRecruiterAvatarCapability';
import type { ParseKeys } from 'i18next';

/** `app` translation key of why the 3D avatar fell back to the static image. */
export type RecruiterFallbackReasonKey = Extract<
  ParseKeys<'app'>,
  `recruiter.fallback.${string}`
>;

export interface RecruiterAvatarPanelProps {
  /** Whether the simulation stream is active (user started the call). */
  active: boolean;
  isAiSpeaking: boolean;
  isAwaitingAiResponse: boolean;
  speechTurn: AiSpeechTurn | null;
  avatarUrl: string;
  avatarMode: RecruiterAvatarMode;
  capabilityFallbackReason: string | null;
  onFallbackRequest: (reasonKey: RecruiterFallbackReasonKey) => void;
}

export interface RecruiterAvatar3DProps {
  active: boolean;
  avatarUrl: string;
  isAiSpeaking: boolean;
  isAwaitingAiResponse: boolean;
  speechTurn: AiSpeechTurn | null;
  onLoadError: (reasonKey: RecruiterFallbackReasonKey) => void;
  onContextLost: () => void;
}

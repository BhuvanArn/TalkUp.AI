import type { RecruiterPersona } from '@/config/personas';
import type { AiSpeechTurn } from '@/hooks/simulation/useAudioPlayback';
import type { RecruiterAvatarMode } from '@/hooks/simulation/useRecruiterAvatarCapability';

export interface RecruiterAvatarPanelProps {
  /** Whether the simulation stream is active (user started the call). */
  active: boolean;
  persona: RecruiterPersona;
  isAiSpeaking: boolean;
  isAwaitingAiResponse: boolean;
  speechTurn: AiSpeechTurn | null;
  avatarUrl: string;
  avatarMode: RecruiterAvatarMode;
  capabilityFallbackReason: string | null;
  onFallbackRequest: (reason: string) => void;
}

export interface RecruiterAvatar3DProps {
  active: boolean;
  persona: RecruiterPersona;
  avatarUrl: string;
  isAiSpeaking: boolean;
  isAwaitingAiResponse: boolean;
  speechTurn: AiSpeechTurn | null;
  onLoadError: (reason: string) => void;
  onContextLost: () => void;
}

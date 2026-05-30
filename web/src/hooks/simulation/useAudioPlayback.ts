import { useCallback, useEffect, useRef, useState } from 'react';

import type { WebSocketPacket } from './useSimulationWebSocket';

export interface AiAnswer {
  type: string;
  transcription?: string;
  response?: string;
  audio_chunks?: string[];
}

export interface UseAudioPlaybackProps {
  /** The reactive lastJsonMessage from useSimulationWebSocket. */
  message: unknown;
}

export interface UseAudioPlaybackReturn {
  /** True while the AI's voice answer is playing. */
  isAiSpeaking: boolean;
  /** Stop any in-progress playback immediately. */
  stopPlayback: () => void;
  error: string | null;
}

function asOuterPacket(
  message: unknown,
): Pick<WebSocketPacket, 'type' | 'data'> | null {
  if (!message || typeof message !== 'object') return null;
  const m = message as Record<string, unknown>;
  if (m.type !== 'sts_result' || typeof m.data !== 'string') return null;
  return m as Pick<WebSocketPacket, 'type' | 'data'>;
}

export function useAudioPlayback({
  message,
}: UseAudioPlaybackProps): UseAudioPlaybackReturn {
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastHandledRef = useRef<unknown>(null);

  const stopPlayback = useCallback(() => {
    setIsAiSpeaking(false);
  }, []);

  useEffect(() => {
    if (!message || message === lastHandledRef.current) return;
    lastHandledRef.current = message;

    const packet = asOuterPacket(message);
    if (!packet) return;
    setError(null);

    let answer: AiAnswer;
    try {
      answer = JSON.parse(packet.data) as AiAnswer;
    } catch {
      setError('Malformed AI answer payload');
      return;
    }

    const chunks = answer.audio_chunks ?? [];
    if (chunks.length === 0) return; // text-only answer, nothing to play
    // playback wired in Task 2
  }, [message]);

  return { isAiSpeaking, stopPlayback, error };
}

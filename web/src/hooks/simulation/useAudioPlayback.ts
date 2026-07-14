import { useCallback, useEffect, useRef, useState } from 'react';

import type { WebSocketPacket } from './useSimulationWebSocket';

export interface AiAnswer {
  type: string;
  transcription?: string;
  response?: string;
  audio_chunks?: string[];
}

export interface AiTranscript {
  /** What the user said, as transcribed by speech-to-text. */
  transcription: string;
  /** The AI's textual reply for this turn. */
  response: string;
}

/** A single AI speech turn ready for avatar playback or direct audio output. */
export interface AiSpeechTurn {
  id: number;
  response: string;
  audioChunks: string[];
}

export type AudioPlaybackMode = 'direct' | 'avatar';

export interface UseAudioPlaybackProps {
  message: unknown;
  /** When `avatar`, audio is exposed via `speechTurn` for the 3D avatar to play. */
  playbackMode?: AudioPlaybackMode;
}

export interface UseAudioPlaybackReturn {
  isAiSpeaking: boolean;
  stopPlayback: () => void;
  error: string | null;
  /** Transcript text from the latest sts_result message, or null. */
  transcript: AiTranscript | null;
  /** Latest decoded AI speech turn for avatar playback (avatar mode only). */
  speechTurn: AiSpeechTurn | null;
  /** Called by the avatar when it starts or stops speaking (avatar mode only). */
  setAvatarSpeaking: (speaking: boolean) => void;
  /** Replays a speech turn through direct Web Audio (fallback recovery). */
  replaySpeechTurnDirect: (turn: AiSpeechTurn) => void;
}

function asOuterPacket(
  message: unknown,
): Pick<WebSocketPacket, 'type' | 'data'> | null {
  if (!message || typeof message !== 'object') return null;
  const m = message as Record<string, unknown>;
  if (m.type !== 'sts_result' || typeof m.data !== 'string') return null;
  return m as Pick<WebSocketPacket, 'type' | 'data'>;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function useAudioPlayback({
  message,
  playbackMode = 'direct',
}: UseAudioPlaybackProps): UseAudioPlaybackReturn {
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<AiTranscript | null>(null);
  const [speechTurn, setSpeechTurn] = useState<AiSpeechTurn | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const lastHandledRef = useRef<unknown>(null);
  const playGenRef = useRef(0);
  const speechTurnIdRef = useRef(0);
  const playbackModeRef = useRef(playbackMode);

  useEffect(() => {
    playbackModeRef.current = playbackMode;
  }, [playbackMode]);

  const setAvatarSpeaking = useCallback((speaking: boolean) => {
    if (playbackModeRef.current === 'avatar') {
      setIsAiSpeaking(speaking);
    }
  }, []);

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current) {
      const ctx = new AudioContext();
      ctx.onstatechange = () => {
        if (playbackModeRef.current === 'direct' && ctx.state !== 'running') {
          setIsAiSpeaking(false);
        }
      };
      audioContextRef.current = ctx;
    }
    return audioContextRef.current;
  }, []);

  const stopPlayback = useCallback(() => {
    for (const source of activeSourcesRef.current) {
      try {
        source.onended = null;
        source.stop();
      } catch {
        // already stopped
      }
    }
    activeSourcesRef.current = [];

    if (playbackModeRef.current === 'avatar') {
      setAvatarSpeaking(false);
    } else {
      setIsAiSpeaking(false);
    }
  }, [setAvatarSpeaking]);

  const playAnswer = useCallback(
    async (chunks: string[]) => {
      const generation = ++playGenRef.current;
      const audioContext = getAudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const buffers: AudioBuffer[] = [];
      for (const chunk of chunks) {
        try {
          const arrayBuffer = base64ToArrayBuffer(chunk);
          const buffer = await audioContext.decodeAudioData(arrayBuffer);
          buffers.push(buffer);
        } catch {
          // skip undecodable chunk, keep the rest of the answer playing
        }
        if (generation !== playGenRef.current) return;
      }

      if (buffers.length === 0) {
        stopPlayback();
        return;
      }

      if (generation !== playGenRef.current) return;

      stopPlayback();
      setIsAiSpeaking(true);

      let startTime = audioContext.currentTime;
      const scheduled: AudioBufferSourceNode[] = [];
      buffers.forEach((buffer, index) => {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(startTime);
        startTime += buffer.duration;
        if (index === buffers.length - 1) {
          source.onended = () => {
            activeSourcesRef.current = [];
            setIsAiSpeaking(false);
          };
        }
        scheduled.push(source);
      });
      activeSourcesRef.current = scheduled;
    },
    [getAudioContext, stopPlayback],
  );

  const publishSpeechTurn = useCallback(
    (response: string, chunks: string[]) => {
      if (chunks.length === 0) return;
      speechTurnIdRef.current += 1;
      setSpeechTurn({
        id: speechTurnIdRef.current,
        response,
        audioChunks: chunks,
      });
    },
    [],
  );

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

    if (answer.transcription || answer.response) {
      const next: AiTranscript = {
        transcription: answer.transcription ?? '',
        response: answer.response ?? '',
      };
      setTranscript((prev) =>
        prev &&
        prev.transcription === next.transcription &&
        prev.response === next.response
          ? prev
          : next,
      );
    }

    const chunks = answer.audio_chunks ?? [];
    if (chunks.length === 0) return;

    publishSpeechTurn(answer.response ?? '', chunks);

    // Always play Piper audio directly — the 3D avatar handles visuals only.
    void playAnswer(chunks);
  }, [message, playAnswer, publishSpeechTurn]);

  const replaySpeechTurnDirect = useCallback(
    (turn: AiSpeechTurn) => {
      if (turn.audioChunks.length === 0) return;
      void playAnswer(turn.audioChunks);
    },
    [playAnswer],
  );

  useEffect(() => {
    if (playbackMode === 'avatar') {
      ++playGenRef.current;
      for (const source of activeSourcesRef.current) {
        try {
          source.onended = null;
          source.stop();
        } catch {
          // already stopped
        }
      }
      activeSourcesRef.current = [];
    }
  }, [playbackMode]);

  useEffect(() => {
    return () => {
      for (const source of activeSourcesRef.current) {
        try {
          source.onended = null;
          source.stop();
        } catch {
          // already stopped
        }
      }
      activeSourcesRef.current = [];
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    isAiSpeaking,
    stopPlayback,
    error,
    transcript,
    speechTurn,
    setAvatarSpeaking,
    replaySpeechTurnDirect,
  };
}

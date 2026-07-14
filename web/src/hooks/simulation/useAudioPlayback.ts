import { useCallback, useEffect, useRef, useState } from 'react';

import type { WebSocketPacket } from './useSimulationWebSocket';

export interface AiAnswer {
  type: string;
  transcription?: string;
  response?: string;
  audio_chunks?: string[];
  simulation_complete?: boolean;
}

export interface AiTranscript {
  /** What the user said, as transcribed by speech-to-text. */
  transcription: string;
  /** The AI's textual reply for this turn. */
  response: string;
}

export interface UseAudioPlaybackProps {
  message: unknown;
  interviewID?: string | null;
}

export interface UseAudioPlaybackReturn {
  isAiSpeaking: boolean;
  stopPlayback: () => void;
  error: string | null;
  /** Transcript text from the latest sts_result message, or null. */
  transcript: AiTranscript | null;
  /** True when the AI has signaled the interview is complete. */
  simulationComplete: boolean;
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
  interviewID = null,
}: UseAudioPlaybackProps): UseAudioPlaybackReturn {
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<AiTranscript | null>(null);
  const [simulationComplete, setSimulationComplete] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const lastHandledRef = useRef<unknown>(null);
  const playGenRef = useRef(0);

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current) {
      const ctx = new AudioContext();
      ctx.onstatechange = () => {
        if (ctx.state !== 'running') {
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
    setIsAiSpeaking(false);
  }, []);

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

  useEffect(() => {
    setSimulationComplete(false);
    setTranscript(null);
    lastHandledRef.current = null;
  }, [interviewID]);

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

    if (answer.simulation_complete) {
      setSimulationComplete(true);
    }

    const chunks = answer.audio_chunks ?? [];
    if (chunks.length === 0) {
      if (answer.simulation_complete) {
        setIsAiSpeaking(false);
      }
      return;
    }

    void playAnswer(chunks);
  }, [message, playAnswer]);

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

  return { isAiSpeaking, stopPlayback, error, transcript, simulationComplete };
}

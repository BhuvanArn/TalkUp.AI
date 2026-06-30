import { useCallback, useEffect, useRef, useState } from 'react';

import type { WebSocketPacket } from './useSimulationWebSocket';
import {
  MAX_UTTERANCE_MS,
  MIN_SPEECH_MS,
  SILENCE_END_MS,
  VAD_TICK_MS,
  computeRms,
  isSpeechLevel,
  updateNoiseFloor,
} from './voiceActivity';

export interface UseAudioStreamingProps {
  stream: MediaStream | null;
  interviewID?: string | null;
  onAudioPacket: (packet: WebSocketPacket) => void;
  isActive: boolean;
  mimeType?: string;
}

export interface UseAudioStreamingReturn {
  /** VAD is armed and waiting for speech. */
  isListening: boolean;
  /** User is currently speaking (above VAD threshold). */
  isSpeaking: boolean;
  /** MediaRecorder is capturing an utterance. */
  isRecording: boolean;
  startStreaming: () => void;
  stopStreaming: () => void;
  packetsSent: number;
  supportedMimeType: string | null;
  error: string | null;
}

/**
 * Records complete utterances using voice-activity detection, then sends one
 * WebSocket packet per phrase when the user stops speaking (Siri-style).
 */
export function useAudioStreaming({
  stream,
  interviewID,
  onAudioPacket,
  isActive,
  mimeType,
}: UseAudioStreamingProps): UseAudioStreamingReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [packetsSent, setPacketsSent] = useState(0);
  const [supportedMimeType, setSupportedMimeType] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const onAudioPacketRef = useRef(onAudioPacket);
  const interviewIDRef = useRef(interviewID);
  interviewIDRef.current = interviewID;
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timeDomainBufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const selectedMimeTypeRef = useRef<string | null>(null);

  const noiseFloorRef = useRef(0.01);
  const speechStartedAtRef = useRef<number | null>(null);
  const lastSpeechAtRef = useRef<number | null>(null);
  const silenceStartedAtRef = useRef<number | null>(null);
  const isCapturingUtteranceRef = useRef(false);
  const MIN_UTTERANCE_BYTES = 2048;

  useEffect(() => {
    onAudioPacketRef.current = onAudioPacket;
  }, [onAudioPacket]);

  const getSupportedMimeType = useCallback((): string | null => {
    if (mimeType && MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }

    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
    ];

    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return null;
  }, [mimeType]);

  const arrayBufferToBase64 = useCallback((buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  const emitAudioPacket = useCallback(
    async (blob: Blob) => {
      if (!blob.size || blob.size < MIN_UTTERANCE_BYTES) return;

      try {
        const arrayBuffer = await blob.arrayBuffer();
        const base64Data = arrayBufferToBase64(arrayBuffer);

        const packet: WebSocketPacket = {
          type: 'stream_chunk',
          data: base64Data,
          stream_id: interviewIDRef.current || 'unknown',
          key: import.meta.env.VITE_WEBSOCKET_KEY,
          timestamp: Date.now(),
          format: 'audio',
        };

        onAudioPacketRef.current(packet);
        setPacketsSent((prev) => prev + 1);
      } catch {
        setError('Error processing audio chunk');
      }
    },
    [arrayBufferToBase64],
  );

  const finalizeUtterance = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      isCapturingUtteranceRef.current = false;
      setIsRecording(false);
      return;
    }

    try {
      recorder.requestData();
      recorder.stop();
    } catch {
      setError('Error stopping recording');
      isCapturingUtteranceRef.current = false;
      setIsRecording(false);
    }
  }, []);

  const resetUtteranceTimers = useCallback(() => {
    speechStartedAtRef.current = null;
    lastSpeechAtRef.current = null;
    silenceStartedAtRef.current = null;
  }, []);

  const startUtteranceCapture = useCallback(
    (audioStream: MediaStream, selectedMimeType: string) => {
      if (isCapturingUtteranceRef.current) return;

      try {
        const mediaRecorder = new MediaRecorder(audioStream, {
          mimeType: selectedMimeType,
        });

        mediaRecorder.ondataavailable = async (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            await emitAudioPacket(event.data);
          }
        };

        mediaRecorder.onerror = () => {
          setError('MediaRecorder error occurred');
          isCapturingUtteranceRef.current = false;
          setIsRecording(false);
          resetUtteranceTimers();
        };

        mediaRecorder.onstop = () => {
          isCapturingUtteranceRef.current = false;
          setIsRecording(false);
          mediaRecorderRef.current = null;
          resetUtteranceTimers();
        };

        const now = Date.now();
        speechStartedAtRef.current = now;
        lastSpeechAtRef.current = now;
        silenceStartedAtRef.current = null;
        isCapturingUtteranceRef.current = true;
        setIsRecording(true);

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
      } catch (err) {
        setError(`Failed to start recording: ${err}`);
        isCapturingUtteranceRef.current = false;
        setIsRecording(false);
        resetUtteranceTimers();
      }
    },
    [emitAudioPacket, resetUtteranceTimers],
  );

  const stopVad = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onerror = null;
      recorder.onstop = null;
      if (recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch {
          // recorder already torn down; nothing to release
        }
      }
      mediaRecorderRef.current = null;
    }
    isCapturingUtteranceRef.current = false;

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    timeDomainBufferRef.current = null;
    noiseFloorRef.current = 0.01;
    resetUtteranceTimers();
    setIsListening(false);
    setIsSpeaking(false);
    setIsRecording(false);
  }, [resetUtteranceTimers]);

  const startVad = useCallback(
    async (mediaStream: MediaStream) => {
      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks.length === 0) {
        setError('No audio tracks in stream');
        return;
      }

      const selectedMimeType = getSupportedMimeType();
      if (!selectedMimeType) {
        setError('No supported audio MIME type found');
        return;
      }

      selectedMimeTypeRef.current = selectedMimeType;
      setSupportedMimeType(selectedMimeType);
      setError(null);
      noiseFloorRef.current = 0.01;
      resetUtteranceTimers();

      let audioStream: MediaStream;
      try {
        audioStream = new MediaStream(audioTracks);
      } catch (err) {
        setError(`Failed to start voice detection: ${err}`);
        return;
      }

      try {
        const audioContext = new AudioContext();
        await audioContext.resume();

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.4;

        const source = audioContext.createMediaStreamSource(audioStream);
        source.connect(analyser);

        sourceRef.current = source;
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        timeDomainBufferRef.current = new Float32Array(analyser.fftSize);

        setIsListening(true);

        vadIntervalRef.current = setInterval(() => {
          const analyserNode = analyserRef.current;
          const buffer = timeDomainBufferRef.current;
          const mime = selectedMimeTypeRef.current;
          if (!analyserNode || !buffer || !mime) return;

          analyserNode.getFloatTimeDomainData(buffer);
          const rms = computeRms(buffer);
          const now = Date.now();
          const speaking = isSpeechLevel(rms, noiseFloorRef.current);

          setIsSpeaking(speaking);

          if (!isCapturingUtteranceRef.current) {
            if (!speaking) {
              noiseFloorRef.current = updateNoiseFloor(
                noiseFloorRef.current,
                rms,
              );
              return;
            }

            startUtteranceCapture(audioStream, mime);
            return;
          }

          if (speaking) {
            lastSpeechAtRef.current = now;
            silenceStartedAtRef.current = null;
            return;
          }

          const speechStartedAt = speechStartedAtRef.current;
          if (!speechStartedAt || now - speechStartedAt < MIN_SPEECH_MS) {
            return;
          }

          if (!silenceStartedAtRef.current) {
            silenceStartedAtRef.current = now;
            return;
          }

          if (now - silenceStartedAtRef.current >= SILENCE_END_MS) {
            finalizeUtterance();
            return;
          }

          if (now - speechStartedAt >= MAX_UTTERANCE_MS) {
            finalizeUtterance();
          }
        }, VAD_TICK_MS);
      } catch (err) {
        setError(`Failed to start voice detection: ${err}`);
        stopVad();
      }
    },
    [
      finalizeUtterance,
      getSupportedMimeType,
      resetUtteranceTimers,
      startUtteranceCapture,
      stopVad,
    ],
  );

  const startStreaming = useCallback(() => {
    if (!stream) {
      setError('No media stream available');
      return;
    }
    void startVad(stream);
  }, [stream, startVad]);

  const stopStreaming = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      } catch {
        setError('Error stopping recording');
      }
    }
    stopVad();
  }, [stopVad]);

  useEffect(() => {
    if (isActive && stream) {
      void startVad(stream);
    } else {
      stopStreaming();
    }

    return () => {
      stopStreaming();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, stream]);

  return {
    isListening,
    isSpeaking,
    isRecording,
    startStreaming,
    stopStreaming,
    packetsSent,
    supportedMimeType,
    error,
  };
}

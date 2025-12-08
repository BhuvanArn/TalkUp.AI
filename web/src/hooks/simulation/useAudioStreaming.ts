import { useCallback, useEffect, useRef, useState } from 'react';

import type { WebSocketPacket } from './useSimulationWebSocket';

export interface UseAudioStreamingProps {
  stream: MediaStream | null;
  interviewID?: string | null;
  onAudioPacket: (packet: WebSocketPacket) => void;
  isActive: boolean;
  timeSlice?: number;
  mimeType?: string;
}

export interface UseAudioStreamingReturn {
  isRecording: boolean;
  startStreaming: () => void;
  stopStreaming: () => void;
  packetsSent: number;
  supportedMimeType: string | null;
  error: string | null;
}

/**
 * Hook for recording audio from a provided MediaStream and emitting complete audio file packets.
 *
 * This hook uses MediaRecorder to capture audio chunks that are complete, valid audio containers
 * (WebM/Opus) that can be decoded by ffmpeg. Uses a longer timeSlice (1000ms default) to ensure
 * each chunk is a self-contained audio file.
 *
 * @param props.stream - The MediaStream to capture audio from.
 * @param props.interviewID - The interview ID to include in the WebSocket packets.
 * @param props.onAudioPacket - Callback invoked for each recorded audio chunk.
 * @param props.isActive - When true streaming starts; when false it stops.
 * @param props.timeSlice - (Optional) Interval in milliseconds for chunks. Defaults to 1000ms.
 *                          Higher values = more complete files but higher latency.
 * @param props.mimeType - (Optional) Preferred MIME type for recording.
 *
 * @returns An object with recording status and controls.
 */
export function useAudioStreaming({
  stream,
  interviewID,
  onAudioPacket,
  isActive,
  timeSlice = 1000,
  mimeType,
}: UseAudioStreamingProps): UseAudioStreamingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [packetsSent, setPacketsSent] = useState(0);
  const [supportedMimeType, setSupportedMimeType] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const onAudioPacketRef = useRef(onAudioPacket);

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

  const startStreaming = useCallback(() => {
    if (!stream) {
      setError('No media stream available');
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setError('No audio tracks in stream');
      return;
    }

    const selectedMimeType = getSupportedMimeType();
    if (!selectedMimeType) {
      setError('No supported audio MIME type found');
      return;
    }

    try {
      setSupportedMimeType(selectedMimeType);
      setError(null);
      setPacketsSent(0);

      const audioStream = new MediaStream(audioTracks);
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: selectedMimeType,
      });

      mediaRecorder.ondataavailable = async (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          try {
            const arrayBuffer = await event.data.arrayBuffer();
            const base64Data = arrayBufferToBase64(arrayBuffer);

            const packet: WebSocketPacket = {
              type: 'stream_chunk',
              data: base64Data,
              stream_id: interviewID || 'unknown',
              key: import.meta.env.VITE_WEBSOCKET_KEY,
              timestamp: Date.now(),
              format: 'audio',
            };

            onAudioPacketRef.current(packet);
            setPacketsSent((prev) => prev + 1);
          } catch {
            setError('Error processing audio chunk');
          }
        }
      };

      mediaRecorder.onerror = () => {
        setError('MediaRecorder error occurred');
        setIsRecording(false);
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
        mediaRecorderRef.current = null;
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
      };

      mediaRecorder.start(timeSlice);
      mediaRecorderRef.current = mediaRecorder;
    } catch (err) {
      setError(`Failed to start recording: ${err}`);
      setIsRecording(false);
    }
  }, [
    stream,
    getSupportedMimeType,
    arrayBufferToBase64,
    timeSlice,
    interviewID,
  ]);

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
    setIsRecording(false);
  }, []);

  useEffect(() => {
    if (isActive && stream) {
      startStreaming();
    } else {
      stopStreaming();
    }

    return () => {
      stopStreaming();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, stream]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
    };
  }, []);

  return {
    isRecording,
    startStreaming,
    stopStreaming,
    packetsSent,
    supportedMimeType,
    error,
  };
}

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
 * Hook for recording audio from a provided MediaStream and emitting encoded audio packets.
 *
 * This hook manages a MediaRecorder instance that captures audio from the supplied stream,
 * splits the recording into periodic chunks (timeSlice), converts each chunk to a base64 string,
 * and forwards those chunks via the provided onAudioPacket callback as an AudioPacket object.
 * It also exposes controls for starting/stopping the recording and exposes status and error info.
 *
 * @param props.stream - The MediaStream to capture audio from. If null or if the stream has no audio tracks,
 *                       the hook will set an appropriate error and will not start recording.
 * @param props.onAudioPacket - Callback invoked for each recorded audio chunk. The callback receives a
 *                              WebSocketPacket with the following shape:
 *                                {
 *                                  type: 'stream_chunk',
 *                                  data: string,          // base64-encoded chunk
 *                                  timestamp: number,     // Date.now() when the chunk was processed
 *                                  key: string,           // websocket key from env
 *                                  stream_id: string,     // interview ID
 *                                  format: 'audio'        // format type
 *                                }
 *                              The hook captures the latest callback via a ref, so updates to the callback
 *                              are safe without restarting the recorder.
 * @param props.isActive - When true the hook will attempt to start streaming (if a valid stream is present);
 *                         when false it will stop streaming.
 * @param props.timeSlice - (Optional) Interval in milliseconds passed to MediaRecorder.start(timeSlice) to
 *                           determine how often ondataavailable events are emitted. Defaults to 100 ms.
 * @param props.mimeType - (Optional) Preferred MIME type for recording. If provided and supported by
 *                          MediaRecorder.isTypeSupported it will be used; otherwise the hook probes a
 *                          prioritized list of common audio MIME types and selects the first supported one.
 *
 * @returns An object with:
 *  - isRecording: boolean         // whether recording is currently active
 *  - startStreaming: () => void   // imperative function to start recording
 *  - stopStreaming: () => void    // imperative function to stop recording
 *  - packetsSent: number          // count of audio packets emitted via onAudioPacket
 *  - supportedMimeType: string | null // selected MIME type in use, or null if none found
 *  - error: string | null         // human-readable error message if an operation failed
 *
 * @remarks
 * - The MediaRecorder instance is created using only the audio tracks from the provided stream.
 * - Each Blob chunk emitted by MediaRecorder is converted to an ArrayBuffer and then to a base64 string.
 *   This conversion is performed on the main thread and may have memory/performance implications for
 *   very large chunks or high-frequency chunks; tune timeSlice accordingly.
 * - The hook calls mediaRecorder.requestData() before stopping to ensure the last chunk is emitted.
 * - Errors arising from missing stream/audio tracks, unsupported MIME types, MediaRecorder runtime errors,
 *   or chunk-processing failures are surfaced via the returned `error` string and cause recording to stop
 *   where appropriate.
 * - The startStreaming and stopStreaming functions are stable (wrapped in useCallback) and safe to call
 *   from components. The hook also automatically starts/stops recording when isActive or stream change,
 *   and performs cleanup on unmount.
 *
 * @example
 * const {
 *   isRecording, startStreaming, stopStreaming, packetsSent, supportedMimeType, error
 * } = useAudioStreaming({ stream, onAudioPacket, isActive });
 */
export function useAudioStreaming({
  stream,
  interviewID,
  onAudioPacket,
  isActive,
  timeSlice = 100,
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

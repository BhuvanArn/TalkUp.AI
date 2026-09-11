import { useEffect, useRef, useState } from 'react';

interface UseVideoStreamOptions {
  shouldStartWithMic?: boolean;
  shouldStartWithCamera?: boolean;
  /** Microphone picked in the setup step; empty means the system default. */
  audioInputId?: string;
  /** Camera picked in the setup step; empty means the system default. */
  videoInputId?: string;
}

/**
 * Custom hook to manage video stream and call timer.
 *
 * @param options - Configuration options for the video stream
 * @returns {{
 *   videoRef: React.RefObject<HTMLVideoElement>,
 *   isStreaming: boolean,
 *   elapsedTime: number,
 *   toggleStream: () => void
 * }}
 */
export const useVideoStream = (options?: UseVideoStreamOptions) => {
  const {
    shouldStartWithMic = true,
    shouldStartWithCamera = true,
    audioInputId = '',
    videoInputId = '',
  } = options || {};
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const toggleStream = async () => {
    if (isStreaming) {
      // Stop the stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsStreaming(false);
      setElapsedTime(0);
    } else {
      // Start the stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoInputId ? { deviceId: { exact: videoInputId } } : true,
          audio: {
            ...(audioInputId ? { deviceId: { exact: audioInputId } } : {}),
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        // Apply initial mic and camera states
        stream.getAudioTracks().forEach((track) => {
          track.enabled = shouldStartWithMic;
        });

        if (!shouldStartWithCamera) {
          // If camera should start off, stop and remove video tracks
          stream.getVideoTracks().forEach((track) => {
            track.stop();
            stream.removeTrack(track);
          });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsStreaming(true);
      } catch (error) {
        console.error('Error accessing the camera:', error);
      }
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isStreaming) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    isStreaming,
    elapsedTime,
    toggleStream,
  };
};

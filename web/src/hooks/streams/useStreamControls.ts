import { useEffect, useState } from 'react';

interface UseStreamControlsOptions {
  initialMicActive?: boolean;
  initialSpeakerActive?: boolean;
  initialCameraActive?: boolean;
  onMicChange?: (active: boolean) => void;
  onSpeakerChange?: (active: boolean) => void;
  onCameraChange?: (active: boolean) => void;
  /** Camera picked in the setup step, reused when the camera is switched back on. */
  videoInputId?: string;
}

/**
 * Hook to manage microphone, speaker and camera toggles for a media stream.
 *
 * @param videoRef - Ref to the HTMLVideoElement containing the MediaStream
 * @param audioElementRef - Optional ref to an HTMLAudioElement used for playback (speaker mute)
 * @param options - Configuration options
 */
export const useStreamControls = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  audioElementRef?: React.RefObject<HTMLAudioElement | null>,
  options?: UseStreamControlsOptions,
) => {
  const {
    initialMicActive = true,
    initialSpeakerActive = true,
    initialCameraActive = true,
    onMicChange,
    onSpeakerChange,
    onCameraChange,
    videoInputId = '',
  } = options || {};

  const [isMicActive, setIsMicActive] = useState(initialMicActive);
  const [isSpeakerActive, setIsSpeakerActive] = useState(initialSpeakerActive);
  const [isCameraActive, setIsCameraActive] = useState(initialCameraActive);

  // The device picker resolves after this hook first runs, so the camera choice
  // it produces arrives as a changed `initialCameraActive` rather than on mount.
  useEffect(() => {
    setIsCameraActive(initialCameraActive);
  }, [initialCameraActive]);

  const toggleMic = () => {
    setIsMicActive((prev) => {
      const newState = !prev;
      const src = videoRef.current?.srcObject;
      if (typeof MediaStream !== 'undefined' && src instanceof MediaStream) {
        const stream = src as MediaStream;
        stream.getAudioTracks().forEach((track) => {
          track.enabled = newState;
        });
      }
      if (onMicChange) {
        onMicChange(newState);
      }
      return newState;
    });
  };

  const toggleSpeaker = () => {
    setIsSpeakerActive((prev) => {
      const newState = !prev;
      if (audioElementRef?.current) {
        audioElementRef.current.muted = !newState;
      }
      if (onSpeakerChange) {
        onSpeakerChange(newState);
      }
      return newState;
    });
  };

  const toggleCamera = async () => {
    const newState = !isCameraActive;
    const src = videoRef.current?.srcObject;

    if (typeof MediaStream !== 'undefined' && src instanceof MediaStream) {
      const stream = src as MediaStream;

      if (newState) {
        // Turn camera ON - request video stream
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: videoInputId ? { deviceId: { exact: videoInputId } } : true,
          });
          const videoTrack = videoStream.getVideoTracks()[0];

          // Remove old video tracks and add new one
          stream.getVideoTracks().forEach((track) => track.stop());
          stream.getVideoTracks().forEach((track) => stream.removeTrack(track));
          stream.addTrack(videoTrack);

          setIsCameraActive(true);
          if (onCameraChange) {
            onCameraChange(true);
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setIsCameraActive(false);
          if (onCameraChange) {
            onCameraChange(false);
          }
        }
      } else {
        // Turn camera OFF - stop all video tracks
        stream.getVideoTracks().forEach((track) => {
          track.stop();
          stream.removeTrack(track);
        });
        setIsCameraActive(false);
        if (onCameraChange) {
          onCameraChange(false);
        }
      }
    }
  };

  return {
    isMicActive,
    isSpeakerActive,
    isCameraActive,
    toggleMic,
    toggleSpeaker,
    toggleCamera,
  } as const;
};

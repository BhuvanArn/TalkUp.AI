import { Icon } from '@/components/atoms/icon';
import VideoAreaControlsBar from '@/components/molecules/video-area-controls-bar';
import RecruiterAvatarPanel from '@/components/organisms/recruiter-avatar';
import type { AiSpeechTurn } from '@/hooks/simulation/useAudioPlayback';
import type { RecruiterAvatarMode } from '@/hooks/simulation/useRecruiterAvatarCapability';
import { cn } from '@/utils/cn';
import { formatDurationISO, formatTime } from '@/utils/time';
import { useEffect, useRef, useState } from 'react';

import { useAudioAnalyzer } from '../../../hooks/streams/useAudioAnalyzer';
import { useStreamControls } from '../../../hooks/streams/useStreamControls';
import { useVideoStream } from '../../../hooks/streams/useVideoStream';

/** Devices picked in the setup step, applied to the live interview. */
export interface SimulationDeviceSettings {
  audioInputId: string;
  videoInputId: string;
  audioOutputId: string;
  cameraEnabled: boolean;
}

interface SimulationVideoAreaProps {
  devices?: SimulationDeviceSettings;
  /**
   * Called instead of hanging up straight away, so the page can confirm first.
   * Without it the hang-up button keeps its direct behaviour.
   */
  onEndCallRequest?: () => void;
  isAiSpeaking?: boolean;
  isAwaitingAiResponse?: boolean;
  speechTurn?: AiSpeechTurn | null;
  avatarUrl?: string;
  avatarMode?: RecruiterAvatarMode;
  avatarFallbackReason?: string | null;
  onAvatarFallbackRequest?: (reason: string) => void;
  onStreamToggle?: (streaming: boolean) => void;
  /** Raised when the picked devices cannot be opened for the live interview. */
  onStreamError?: () => void;
  onStreamChange?: (stream: MediaStream | null) => void;
  onToggleRef?: (toggleFn: (() => void) | null) => void;
}

/**
 * SimulationVideoArea component.
 * @returns The SimulationVideoArea component.
 */
const SimulationVideoArea = ({
  devices,
  onEndCallRequest,
  isAiSpeaking = false,
  isAwaitingAiResponse = false,
  speechTurn = null,
  avatarUrl = '/avatars/recruiter-professional.glb',
  avatarMode = 'fallback',
  avatarFallbackReason = null,
  onAvatarFallbackRequest,
  onStreamToggle,
  onStreamError,
  onStreamChange,
  onToggleRef,
}: SimulationVideoAreaProps = {}): React.ReactElement => {
  const onStreamErrorRef = useRef(onStreamError);
  onStreamErrorRef.current = onStreamError;
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const [shouldStartWithMic, setShouldStartWithMic] = useState(true);
  const cameraRequested = devices?.cameraEnabled ?? true;
  const [shouldStartWithCamera, setShouldStartWithCamera] =
    useState(cameraRequested);

  // `devices` is undefined until the setup modal resolves, so the picker's
  // camera choice only ever arrives as a prop change, never as initial state.
  useEffect(() => {
    setShouldStartWithCamera(cameraRequested);
  }, [cameraRequested]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const { videoRef, isStreaming, elapsedTime, toggleStream } = useVideoStream({
    shouldStartWithMic,
    shouldStartWithCamera,
    audioInputId: devices?.audioInputId,
    videoInputId: devices?.videoInputId,
    onError: () => onStreamErrorRef.current?.(),
  });

  useEffect(() => {
    if (onToggleRef) {
      onToggleRef(toggleStream);
      return () => onToggleRef(null);
    }
  }, [toggleStream, onToggleRef]);

  const {
    isMicActive,
    isSpeakerActive,
    isCameraActive,
    toggleMic,
    toggleSpeaker,
    toggleCamera,
  } = useStreamControls(videoRef, audioElementRef, {
    initialCameraActive: cameraRequested,
    videoInputId: devices?.videoInputId,
    onMicChange: setShouldStartWithMic,
    onCameraChange: setShouldStartWithCamera,
  });

  const { isSpeaking } = useAudioAnalyzer(stream);

  useEffect(() => {
    const currentStream =
      typeof MediaStream !== 'undefined' &&
      videoRef.current?.srcObject instanceof MediaStream
        ? (videoRef.current.srcObject as MediaStream)
        : null;

    setStream(currentStream);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  const onStreamToggleRef = useRef(onStreamToggle);
  const onStreamChangeRef = useRef(onStreamChange);

  useEffect(() => {
    onStreamToggleRef.current = onStreamToggle;
    onStreamChangeRef.current = onStreamChange;
  }, [onStreamToggle, onStreamChange]);

  useEffect(() => {
    if (onStreamToggleRef.current) {
      onStreamToggleRef.current(isStreaming);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (onStreamChangeRef.current) {
      onStreamChangeRef.current(stream);
    }
  }, [stream]);

  useEffect(() => {
    if (!audioElementRef.current || !videoRef.current) return;

    const audioElement = audioElementRef.current;

    if (isStreaming) {
      const src = videoRef.current.srcObject;
      if (typeof MediaStream !== 'undefined' && src instanceof MediaStream) {
        const stream = src as MediaStream;
        if (stream.getAudioTracks().length > 0) {
          audioElement.srcObject = stream;
          audioElement.muted = !isSpeakerActive;
          audioElement.play().catch(() => {});
        }
      }
    } else {
      if (audioElement.srcObject) {
        audioElement.pause();
        audioElement.srcObject = null;
      }
    }
  }, [isStreaming, isSpeakerActive, videoRef]);

  const audioOutputId = devices?.audioOutputId;

  useEffect(() => {
    const element = audioElementRef.current as
      | (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> })
      | null;

    if (!element?.setSinkId || !audioOutputId) return;

    // Chrome and Edge only; elsewhere the browser keeps the system output.
    element.setSinkId(audioOutputId).catch((error) => {
      console.warn(
        'Failed to route interview audio to the chosen output',
        error,
      );
    });
  }, [audioOutputId]);

  const handleEndCallRequest = () => {
    if (isStreaming && onEndCallRequest) {
      onEndCallRequest();
      return;
    }
    void toggleStream();
  };

  const handleAvatarFallbackRequest = (reason: string) => {
    onAvatarFallbackRequest?.(reason);
  };

  return (
    <div className="relative w-full aspect-video bg-video-off rounded-lg overflow-hidden">
      {isStreaming && (
        <div
          className={cn(
            'absolute inset-0 z-0 h-full w-full rounded-lg transition-all',
            isAiSpeaking ? 'ring-4 ring-inset ring-accent' : '',
          )}
        >
          <RecruiterAvatarPanel
            active={isStreaming}
            isAiSpeaking={isAiSpeaking}
            isAwaitingAiResponse={isAwaitingAiResponse}
            speechTurn={speechTurn}
            avatarUrl={avatarUrl}
            avatarMode={avatarMode}
            capabilityFallbackReason={avatarFallbackReason}
            onFallbackRequest={handleAvatarFallbackRequest}
          />
        </div>
      )}

      <div
        className={cn(
          'absolute top-4 right-4 z-20 w-1/4 aspect-video rounded-lg overflow-hidden ring-2 ring-white',
          isSpeaking ? 'ring-4 ring-blue-500' : '',
        )}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover transition-all bg-video-off"
          muted
        />
        <div className="flex absolute top-2 right-2 space-x-2">
          {!isMicActive && (
            <div className="bg-error rounded-full p-1.5">
              <Icon icon="mic-off" size="sm" color="white" />
            </div>
          )}
          {!isSpeakerActive && (
            <div className="bg-error rounded-full p-1.5">
              <Icon icon="speaker-off" size="sm" color="white" />
            </div>
          )}
          {!isCameraActive && (
            <div className="bg-error rounded-full p-1.5">
              <Icon icon="video-off" size="sm" color="white" />
            </div>
          )}
        </div>
      </div>

      {isStreaming && (
        <time
          className="absolute top-4 left-4 z-20 rounded bg-gray-800/50 px-3 py-1 text-sm font-semibold text-white"
          dateTime={formatDurationISO(elapsedTime)}
        >
          {formatTime(elapsedTime)}
        </time>
      )}

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioElementRef} style={{ display: 'none' }} />

      <VideoAreaControlsBar
        toggleStream={handleEndCallRequest}
        isStreaming={isStreaming}
        isMicActive={isMicActive}
        isCameraActive={isCameraActive}
        isSpeakerActive={isSpeakerActive}
        toggleMic={toggleMic}
        toggleSpeaker={toggleSpeaker}
        toggleCamera={toggleCamera}
      />
    </div>
  );
};

export default SimulationVideoArea;

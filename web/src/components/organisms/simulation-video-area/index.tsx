import { Icon } from '@/components/atoms/icon';
import VideoAreaControlsBar from '@/components/molecules/video-area-controls-bar';
import { cn } from '@/utils/cn';
import { formatDurationISO, formatTime } from '@/utils/time';
import { useEffect, useRef, useState } from 'react';

import { useAudioAnalyzer } from '../../../hooks/streams/useAudioAnalyzer';
import { useStreamControls } from '../../../hooks/streams/useStreamControls';
import { useVideoStream } from '../../../hooks/streams/useVideoStream';

interface SimulationVideoAreaProps {
  isAiSpeaking?: boolean;
  onStreamToggle?: (streaming: boolean) => void;
  onStreamChange?: (stream: MediaStream | null) => void;
  onToggleRef?: (toggleFn: (() => void) | null) => void;
}

/**
 * SimulationVideoArea component.
 * @returns The SimulationVideoArea component.
 */
const SimulationVideoArea = ({
  isAiSpeaking = false,
  onStreamToggle,
  onStreamChange,
  onToggleRef,
}: SimulationVideoAreaProps = {}): React.ReactElement => {
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const [shouldStartWithMic, setShouldStartWithMic] = useState(true);
  const [shouldStartWithCamera, setShouldStartWithCamera] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const { videoRef, isStreaming, elapsedTime, toggleStream } = useVideoStream({
    shouldStartWithMic,
    shouldStartWithCamera,
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

  return (
    <div className="relative w-full aspect-video bg-video-off rounded-lg overflow-hidden">
      {isStreaming && (
        <div
          className={cn(
            'absolute inset-0 rounded-lg transition-all',
            isAiSpeaking ? 'ring-4 ring-inset ring-accent' : '',
          )}
        >
          <img
            src="/interviewer.jpg"
            alt="Interviewer"
            className="w-full h-full object-cover"
          />
          {isAiSpeaking && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded bg-surface/70 px-3 py-1 text-sm font-semibold text-text">
              <span className="flex gap-0.5" aria-hidden="true">
                <span className="h-3 w-1 animate-pulse rounded-full bg-accent" />
                <span className="h-3 w-1 animate-pulse rounded-full bg-accent [animation-delay:150ms]" />
                <span className="h-3 w-1 animate-pulse rounded-full bg-accent [animation-delay:300ms]" />
              </span>
              Speaking…
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          'absolute top-4 right-4 w-1/4 aspect-video rounded-lg overflow-hidden ring-2 ring-white',
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
          className="absolute top-4 left-4 text-white text-sm font-semibold bg-gray-800/50 px-3 py-1 rounded"
          dateTime={formatDurationISO(elapsedTime)}
        >
          {formatTime(elapsedTime)}
        </time>
      )}

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioElementRef} style={{ display: 'none' }} />

      <VideoAreaControlsBar
        toggleStream={toggleStream}
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

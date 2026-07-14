import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';

interface VideoAreaControlsBarProps {
  toggleStream: () => void | Promise<void>;
  isStreaming: boolean;
  isMicActive: boolean;
  isSpeakerActive: boolean;
  isCameraActive?: boolean;
  toggleMic: () => void;
  toggleSpeaker: () => void;
  toggleCamera?: () => void | Promise<void>;
}

/**
 * Video Area Controls Bar Component
 * @returns {React.ReactElement} The Video Area Controls Bar component.
 */
function VideoAreaControlsBar({
  toggleStream,
  isStreaming,
  isMicActive,
  isSpeakerActive,
  isCameraActive,
  toggleMic,
  toggleSpeaker,
  toggleCamera,
}: VideoAreaControlsBarProps): React.ReactElement {
  return (
    <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 transform items-center space-x-6">
      <Button
        size="md"
        onClick={toggleSpeaker}
        variant="text"
        className={`rounded-full h-12 w-12 ${
          isSpeakerActive
            ? 'bg-neutral hover:bg-neutral-hover'
            : 'bg-error hover:bg-error-hover'
        }`}
        aria-label={isSpeakerActive ? 'Mute speaker' : 'Unmute speaker'}
      >
        <Icon
          icon={isSpeakerActive ? 'speaker' : 'speaker-off'}
          size="lg"
          color="white"
        />
      </Button>

      <Button
        size="md"
        onClick={toggleStream}
        className={`rounded-full h-14 w-14 ${
          !isStreaming
            ? 'bg-success hover:bg-success-hover'
            : 'bg-error hover:bg-error-hover'
        }`}
        aria-label={!isStreaming ? 'Start new call' : 'End call'}
      >
        <Icon
          icon={!isStreaming ? 'call' : 'hang-up'}
          size="xl"
          color="white"
        />
      </Button>

      <Button
        size="md"
        onClick={toggleCamera}
        variant="text"
        className={`rounded-full h-12 w-12 ${
          isCameraActive
            ? 'bg-neutral hover:bg-neutral-hover'
            : 'bg-error hover:bg-error-hover'
        }`}
        aria-label={isCameraActive ? 'Turn off camera' : 'Turn on camera'}
      >
        <Icon
          icon={isCameraActive ? 'video' : 'video-off'}
          size="lg"
          color="white"
        />
      </Button>

      <Button
        size="md"
        onClick={toggleMic}
        variant="text"
        className={`rounded-full h-12 w-12 ${
          isMicActive
            ? 'bg-neutral hover:bg-neutral-hover'
            : 'bg-error hover:bg-error-hover'
        }`}
        aria-label={isMicActive ? 'Mute microphone' : 'Unmute microphone'}
      >
        <Icon
          icon={isMicActive ? 'mic-on' : 'mic-off'}
          size="lg"
          color="white"
        />
      </Button>
    </div>
  );
}

export default VideoAreaControlsBar;

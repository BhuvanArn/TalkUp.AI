import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { SelectorInput } from '@/components/atoms/selector-input';
import { useAudioAnalyzer } from '@/hooks/streams/useAudioAnalyzer';
import {
  MediaDeviceOption,
  useMediaDevices,
} from '@/hooks/streams/useMediaDevices';
import { useEffect, useRef } from 'react';

import { SimulationDeviceSetupModalProps } from './types';

export type {
  SimulationDeviceSelection,
  SimulationDeviceSetupModalProps,
} from './types';

const SYSTEM_DEFAULT_OUTPUT = 'System default audio output';
const DETECTING = 'Detecting devices…';

/**
 * Browsers hand back unnamed devices in some configurations, so an index-based
 * name is used rather than an empty entry. An empty list is never dressed up as
 * a device: it says whether the detection is still running or found nothing.
 */
function toSelectOptions(
  devices: MediaDeviceOption[],
  unnamed: string,
  emptyLabel: string,
) {
  if (devices.length === 0) return [{ value: '', label: emptyLabel }];
  return devices.map((device, index) => ({
    value: device.deviceId,
    label: device.label || `${unnamed} ${index + 1}`,
  }));
}

/**
 * Pre-flight step shown when the simulation page opens: pick the microphone,
 * camera and audio output, check the preview, then start the interview in one
 * click instead of hunting for the green phone button.
 */
const SimulationDeviceSetupModal = ({
  isOpen,
  onStart,
  onCancel,
}: SimulationDeviceSetupModalProps): React.ReactElement | null => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    audioInputs,
    videoInputs,
    audioOutputs,
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    selectAudioInput,
    selectVideoInput,
    selectAudioOutput,
    permission,
    error,
    isOutputSelectionSupported,
    cameraEnabled,
    setCameraEnabled,
    previewStream,
  } = useMediaDevices({ enabled: isOpen });

  const { audioLevel } = useAudioAnalyzer(previewStream);

  // The picker covers the whole page, so it needs a way out that is not the
  // Start button: Escape and the backdrop, matching ConfirmModal.
  useEffect(() => {
    if (!isOpen || !onCancel) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = previewStream;
    if (previewStream) video.play().catch(() => {});
  }, [previewStream]);

  if (!isOpen) return null;

  const micBlocked = permission === 'denied';
  const isDetecting = permission === 'pending';
  const emptyLabel = (none: string) => (isDetecting ? DETECTING : none);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulation-setup-title"
    >
      {onCancel ? (
        <button
          type="button"
          className="absolute inset-0 bg-scrim/50"
          onClick={onCancel}
          aria-label="Close device setup"
        />
      ) : (
        <div className="absolute inset-0 bg-scrim/50" />
      )}

      <div className="relative mx-4 w-full max-w-2xl rounded-lg border border-border bg-background shadow-xl">
        <div className="border-b border-border px-6 py-4">
          <h2 id="simulation-setup-title" className="text-h4 text-text">
            Set up your simulation
          </h2>
          <p className="text-body-m text-text-weak">
            Check your devices, then start the interview.
          </p>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-video-off">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                muted
                playsInline
                autoPlay
                data-testid="device-setup-preview"
              />
              {!cameraEnabled && (
                <p className="absolute inset-0 flex items-center justify-center text-body-m text-white">
                  Camera off
                </p>
              )}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <Icon icon={audioLevel > 5 ? 'mic-on' : 'mic-off'} size="sm" />
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised"
                role="meter"
                aria-label="Microphone level"
                aria-valuenow={Math.round(audioLevel)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${Math.min(100, audioLevel)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="setup-audio-input"
                className="mb-1 block text-label-m text-text-idle"
              >
                Microphone
              </label>
              <SelectorInput
                id="setup-audio-input"
                name="Microphone"
                className="w-full"
                value={selectedAudioInput}
                options={toSelectOptions(
                  audioInputs,
                  'Microphone',
                  emptyLabel('No microphone detected'),
                )}
                onChange={(event) => selectAudioInput(event.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="setup-video-input"
                className="mb-1 block text-label-m text-text-idle"
              >
                Camera
              </label>
              <SelectorInput
                id="setup-video-input"
                name="Camera"
                className="w-full"
                value={selectedVideoInput}
                options={toSelectOptions(
                  videoInputs,
                  'Camera',
                  emptyLabel('No camera detected'),
                )}
                disabled={!cameraEnabled}
                onChange={(event) => selectVideoInput(event.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="setup-audio-output"
                className="mb-1 block text-label-m text-text-idle"
              >
                Audio output
              </label>
              <SelectorInput
                id="setup-audio-output"
                name="Audio output"
                className="w-full"
                value={isOutputSelectionSupported ? selectedAudioOutput : ''}
                options={
                  isOutputSelectionSupported
                    ? toSelectOptions(
                        audioOutputs,
                        'Audio output',
                        emptyLabel('No output detected'),
                      )
                    : [{ value: '', label: SYSTEM_DEFAULT_OUTPUT }]
                }
                disabled={!isOutputSelectionSupported}
                onChange={(event) => selectAudioOutput(event.target.value)}
              />
              {!isOutputSelectionSupported && (
                <p className="mt-1 text-body-s text-text-weakest">
                  This browser cannot choose the audio output. Sound will use
                  the system default device.
                </p>
              )}
            </div>

            <Button
              variant="outlined"
              color="neutral"
              className="w-full"
              onClick={() => setCameraEnabled(!cameraEnabled)}
            >
              <Icon icon={cameraEnabled ? 'video' : 'video-off'} size="sm" />
              {cameraEnabled ? 'Turn the camera off' : 'Turn the camera on'}
            </Button>
          </div>
        </div>

        {micBlocked && error && (
          <p className="px-6 pb-2 text-body-m text-error" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          {onCancel && (
            <Button variant="outlined" color="neutral" onClick={onCancel}>
              Later
            </Button>
          )}
          <Button
            variant="contained"
            color="accent"
            disabled={micBlocked}
            onClick={() =>
              onStart({
                audioInputId: selectedAudioInput,
                videoInputId: selectedVideoInput,
                audioOutputId: isOutputSelectionSupported
                  ? selectedAudioOutput
                  : '',
                cameraEnabled,
              })
            }
          >
            Start the simulation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimulationDeviceSetupModal;

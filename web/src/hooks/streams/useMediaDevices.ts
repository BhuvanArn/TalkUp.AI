import { useCallback, useEffect, useRef, useState } from 'react';

/** A single selectable input or output device. */
export interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

export interface UseMediaDevicesOptions {
  /** Only probe the hardware while the picker is actually on screen. */
  enabled: boolean;
}

/** Where the permission handshake got to. */
export type MediaPermissionState = 'pending' | 'granted' | 'denied';

export interface UseMediaDevicesReturn {
  audioInputs: MediaDeviceOption[];
  videoInputs: MediaDeviceOption[];
  audioOutputs: MediaDeviceOption[];
  selectedAudioInput: string;
  selectedVideoInput: string;
  selectedAudioOutput: string;
  selectAudioInput: (deviceId: string) => void;
  selectVideoInput: (deviceId: string) => void;
  selectAudioOutput: (deviceId: string) => void;
  /** `denied` means the microphone is unusable and the simulation cannot start. */
  permission: MediaPermissionState;
  /** Human-readable reason shown next to a denied microphone. */
  error: string | null;
  /**
   * Whether the browser can route audio to a chosen output. Chrome and Edge
   * implement `setSinkId`; Firefox and Safari do not, and also return no
   * `audiooutput` devices at all.
   */
  isOutputSelectionSupported: boolean;
  /** Whether the camera is part of the preview (and of the simulation). */
  cameraEnabled: boolean;
  setCameraEnabled: (enabled: boolean) => void;
  /** Live stream for the preview tile, rebuilt whenever a device changes. */
  previewStream: MediaStream | null;
}

function toOptions(
  devices: MediaDeviceInfo[],
  kind: MediaDeviceKind,
): MediaDeviceOption[] {
  return devices
    .filter((device) => device.kind === kind)
    .map((device) => ({ deviceId: device.deviceId, label: device.label }));
}

/** Keeps an already-made choice when it is still plugged in, else falls back. */
function firstDeviceId(
  devices: MediaDeviceInfo[],
  kind: MediaDeviceKind,
  current: string,
): string {
  const options = toOptions(devices, kind);
  if (options.some((option) => option.deviceId === current)) return current;
  return options[0]?.deviceId ?? '';
}

const MIC_DENIED_MESSAGE =
  "L'accès au micro a été refusé. Autorisez-le dans les réglages du navigateur, puis rechargez la page.";
const MEDIA_UNSUPPORTED_MESSAGE =
  'Ce navigateur ne donne pas accès aux périphériques audio et vidéo. Une connexion sécurisée (HTTPS) est nécessaire pour lancer une simulation.';
const MIC_MISSING_MESSAGE =
  'Aucun micro utilisable. Branchez un micro, puis rechargez la page.';

function isPermissionDenied(error: unknown): boolean {
  const name = (error as { name?: string } | null)?.name;
  return name === 'NotAllowedError' || name === 'SecurityError';
}

function supportsOutputSelection(): boolean {
  return (
    typeof HTMLMediaElement !== 'undefined' &&
    'setSinkId' in HTMLMediaElement.prototype
  );
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function audioConstraint(deviceId: string): MediaTrackConstraints {
  return {
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
}

/**
 * Enumerates the microphones, cameras and audio outputs available to the
 * browser so the user can pick them before a simulation starts, and keeps a
 * live preview stream in sync with the current selection.
 */
export function useMediaDevices({
  enabled,
}: UseMediaDevicesOptions): UseMediaDevicesReturn {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState('');
  const [selectedVideoInput, setSelectedVideoInput] = useState('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [permission, setPermission] = useState<MediaPermissionState>('pending');
  const [error, setError] = useState<string | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const previewRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Absent on insecure origins and in older browsers; without it there is no
    // way to reach a microphone at all.
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission('denied');
      setError(MEDIA_UNSUPPORTED_MESSAGE);
      return;
    }

    let cancelled = false;

    // Keeps the lists and the current choices in step, whether the devices come
    // from the first probe or from a later hot-plug.
    const applyDevices = (found: MediaDeviceInfo[]) => {
      setDevices(found);
      setSelectedAudioInput((current) =>
        firstDeviceId(found, 'audioinput', current),
      );
      setSelectedVideoInput((current) =>
        firstDeviceId(found, 'videoinput', current),
      );
      setSelectedAudioOutput((current) =>
        firstDeviceId(found, 'audiooutput', current),
      );
    };

    const probe = async () => {
      // Labels come back empty until the user has granted access once, so the
      // permission prompt has to happen before the devices are listed. The
      // probe stream is thrown away; the preview effect below opens the
      // devices the user actually picked.
      let granted: MediaStream;

      try {
        granted = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
      } catch (videoError) {
        if (isPermissionDenied(videoError)) {
          if (cancelled) return;
          setPermission('denied');
          setError(MIC_DENIED_MESSAGE);
          return;
        }

        // A missing or busy camera must not cost the user their microphone:
        // retry audio-only and start the picker with the camera switched off.
        try {
          granted = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (audioError) {
          if (cancelled) return;
          setPermission('denied');
          setError(
            isPermissionDenied(audioError)
              ? MIC_DENIED_MESSAGE
              : MIC_MISSING_MESSAGE,
          );
          return;
        }

        if (!cancelled) setCameraEnabled(false);
      }

      stopStream(granted);

      const found = await navigator.mediaDevices.enumerateDevices();
      if (cancelled) return;
      setPermission('granted');
      setError(null);
      applyDevices(found);
    };

    void probe();

    const refresh = () => {
      void navigator.mediaDevices.enumerateDevices().then((found) => {
        if (!cancelled) applyDevices(found);
      });
    };

    navigator.mediaDevices.addEventListener?.('devicechange', refresh);

    return () => {
      cancelled = true;
      navigator.mediaDevices.removeEventListener?.('devicechange', refresh);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (!selectedAudioInput && !selectedVideoInput) return;

    let cancelled = false;

    const acquire = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraint(selectedAudioInput),
        video: !cameraEnabled
          ? false
          : selectedVideoInput
            ? { deviceId: { exact: selectedVideoInput } }
            : true,
      });

      if (cancelled) {
        stopStream(stream);
        return;
      }

      stopStream(previewRef.current);
      previewRef.current = stream;
      setPreviewStream(stream);
    };

    void acquire();

    return () => {
      cancelled = true;
    };
  }, [enabled, selectedAudioInput, selectedVideoInput, cameraEnabled]);

  useEffect(() => {
    return () => {
      stopStream(previewRef.current);
      previewRef.current = null;
    };
  }, []);

  const selectAudioInput = useCallback(
    (deviceId: string) => setSelectedAudioInput(deviceId),
    [],
  );
  const selectVideoInput = useCallback(
    (deviceId: string) => setSelectedVideoInput(deviceId),
    [],
  );
  const selectAudioOutput = useCallback(
    (deviceId: string) => setSelectedAudioOutput(deviceId),
    [],
  );

  return {
    audioInputs: toOptions(devices, 'audioinput'),
    videoInputs: toOptions(devices, 'videoinput'),
    audioOutputs: toOptions(devices, 'audiooutput'),
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    selectAudioInput,
    selectVideoInput,
    selectAudioOutput,
    permission,
    error,
    isOutputSelectionSupported: supportsOutputSelection(),
    cameraEnabled,
    setCameraEnabled,
    previewStream,
  };
}

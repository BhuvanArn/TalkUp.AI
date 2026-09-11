import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMediaDevices } from './useMediaDevices';

class FakeMediaStreamTrack {
  public readonly stopped = false;
  constructor(public readonly kind: 'audio' | 'video') {}
  stop = vi.fn();
}

class FakeMediaStream {
  constructor(private readonly tracks: FakeMediaStreamTrack[]) {}
  getTracks() {
    return this.tracks;
  }
  getAudioTracks() {
    return this.tracks.filter((track) => track.kind === 'audio');
  }
  getVideoTracks() {
    return this.tracks.filter((track) => track.kind === 'video');
  }
}

const device = (
  kind: MediaDeviceKind,
  deviceId: string,
  label: string,
): MediaDeviceInfo =>
  ({ kind, deviceId, label, groupId: 'group' }) as MediaDeviceInfo;

const DEVICES = [
  device('audioinput', 'mic-1', 'Built-in Microphone'),
  device('audioinput', 'mic-2', 'USB Headset'),
  device('videoinput', 'cam-1', 'FaceTime HD Camera'),
  device('audiooutput', 'out-1', 'Built-in Speakers'),
];

let getUserMedia: ReturnType<typeof vi.fn>;
let enumerateDevices: ReturnType<typeof vi.fn>;

beforeEach(() => {
  getUserMedia = vi.fn(
    async () =>
      new FakeMediaStream([
        new FakeMediaStreamTrack('audio'),
        new FakeMediaStreamTrack('video'),
      ]) as unknown as MediaStream,
  );
  enumerateDevices = vi.fn(async () => DEVICES);

  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia,
      enumerateDevices,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useMediaDevices', () => {
  it('groups the enumerated devices by kind', async () => {
    const { result } = renderHook(() => useMediaDevices({ enabled: true }));

    await waitFor(() => expect(result.current.audioInputs).toHaveLength(2));

    expect(result.current.audioInputs.map((d) => d.label)).toEqual([
      'Built-in Microphone',
      'USB Headset',
    ]);
    expect(result.current.videoInputs.map((d) => d.deviceId)).toEqual([
      'cam-1',
    ]);
    expect(result.current.audioOutputs.map((d) => d.deviceId)).toEqual([
      'out-1',
    ]);
  });
  it('asks for permission before enumerating, so device labels are populated', async () => {
    const { result } = renderHook(() => useMediaDevices({ enabled: true }));

    await waitFor(() => expect(result.current.audioInputs).toHaveLength(2));

    expect(getUserMedia).toHaveBeenCalled();
    expect(getUserMedia.mock.invocationCallOrder[0]).toBeLessThan(
      enumerateDevices.mock.invocationCallOrder[0],
    );
  });
  it('defaults each selection to the first device of its kind', async () => {
    const { result } = renderHook(() => useMediaDevices({ enabled: true }));

    await waitFor(() => expect(result.current.audioInputs).toHaveLength(2));

    expect(result.current.selectedAudioInput).toBe('mic-1');
    expect(result.current.selectedVideoInput).toBe('cam-1');
    expect(result.current.selectedAudioOutput).toBe('out-1');
  });
  it('reacquires the preview stream with the newly chosen microphone', async () => {
    const { result } = renderHook(() => useMediaDevices({ enabled: true }));

    await waitFor(() => expect(result.current.previewStream).not.toBeNull());
    const firstStream = result.current.previewStream!;

    act(() => result.current.selectAudioInput('mic-2'));

    await waitFor(() =>
      expect(result.current.previewStream).not.toBe(firstStream),
    );

    const lastConstraints = getUserMedia.mock.calls.at(-1)?.[0];
    expect(lastConstraints.audio).toMatchObject({
      deviceId: { exact: 'mic-2' },
    });
    expect(firstStream.getTracks()[0].stop).toHaveBeenCalled();
  });
  it('opens the preview without video once the camera is switched off', async () => {
    const { result } = renderHook(() => useMediaDevices({ enabled: true }));

    await waitFor(() => expect(result.current.previewStream).not.toBeNull());

    act(() => result.current.setCameraEnabled(false));

    await waitFor(() =>
      expect(getUserMedia.mock.calls.at(-1)?.[0].video).toBe(false),
    );
    expect(result.current.cameraEnabled).toBe(false);
  });
  it('reports output switching as unsupported when setSinkId is missing', async () => {
    const { result } = renderHook(() => useMediaDevices({ enabled: true }));

    await waitFor(() => expect(result.current.audioInputs).toHaveLength(2));

    expect(result.current.isOutputSelectionSupported).toBe(false);
  });

  it('reports output switching as supported when setSinkId exists', async () => {
    Object.defineProperty(HTMLMediaElement.prototype, 'setSinkId', {
      configurable: true,
      value: vi.fn(async () => {}),
    });

    const { result } = renderHook(() => useMediaDevices({ enabled: true }));

    await waitFor(() => expect(result.current.audioInputs).toHaveLength(2));

    expect(result.current.isOutputSelectionSupported).toBe(true);

    Reflect.deleteProperty(HTMLMediaElement.prototype, 'setSinkId');
  });
  it('falls back to an audio-only probe when the machine has no camera', async () => {
    getUserMedia.mockImplementation(
      async (constraints: MediaStreamConstraints) => {
        if (constraints.video) {
          throw Object.assign(new Error('no camera'), {
            name: 'NotFoundError',
          });
        }
        return new FakeMediaStream([
          new FakeMediaStreamTrack('audio'),
        ]) as unknown as MediaStream;
      },
    );

    const { result } = renderHook(() => useMediaDevices({ enabled: true }));

    await waitFor(() => expect(result.current.audioInputs).toHaveLength(2));

    expect(result.current.permission).toBe('granted');
    expect(result.current.cameraEnabled).toBe(false);
  });
  it('marks the permission as denied when the microphone is refused', async () => {
    getUserMedia.mockRejectedValue(
      Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
    );

    const { result } = renderHook(() => useMediaDevices({ enabled: true }));

    await waitFor(() => expect(result.current.permission).toBe('denied'));

    expect(result.current.error).toMatch(/microphone/i);
    expect(enumerateDevices).not.toHaveBeenCalled();
  });

  it('re-enumerates when a device is plugged in or removed', async () => {
    const listeners: Record<string, () => void> = {};
    (
      navigator.mediaDevices.addEventListener as ReturnType<typeof vi.fn>
    ).mockImplementation((event: string, handler: () => void) => {
      listeners[event] = handler;
    });

    const { result } = renderHook(() => useMediaDevices({ enabled: true }));

    await waitFor(() => expect(result.current.audioInputs).toHaveLength(2));

    enumerateDevices.mockResolvedValue([
      device('audioinput', 'mic-1', 'Built-in Microphone'),
      device('videoinput', 'cam-1', 'FaceTime HD Camera'),
      device('audiooutput', 'out-1', 'Built-in Speakers'),
    ]);

    act(() => listeners.devicechange?.());

    await waitFor(() => expect(result.current.audioInputs).toHaveLength(1));
  });
  it('releases the preview stream when the picker closes', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useMediaDevices({ enabled }),
      { initialProps: { enabled: true } },
    );

    await waitFor(() => expect(result.current.previewStream).not.toBeNull());

    const tracks = result.current.previewStream!.getTracks();

    rerender({ enabled: false });

    await waitFor(() => expect(result.current.previewStream).toBeNull());
    tracks.forEach((track) => expect(track.stop).toHaveBeenCalled());
  });

  it('reports a device that cannot be opened instead of failing silently', async () => {
    let probed = false;
    getUserMedia.mockImplementation(async () => {
      if (!probed) {
        probed = true;
        return new FakeMediaStream([
          new FakeMediaStreamTrack('audio'),
          new FakeMediaStreamTrack('video'),
        ]) as unknown as MediaStream;
      }
      throw Object.assign(new Error('busy'), { name: 'NotReadableError' });
    });

    const { result } = renderHook(() => useMediaDevices({ enabled: true }));

    await waitFor(() => expect(result.current.permission).toBe('denied'));

    expect(result.current.error).toMatch(/could not be opened/i);
    expect(result.current.previewStream).toBeNull();
  });

  it('reports denied when the device listing itself fails', async () => {
    enumerateDevices.mockRejectedValue(new Error('enumeration failed'));

    const { result } = renderHook(() => useMediaDevices({ enabled: true }));

    await waitFor(() => expect(result.current.permission).toBe('denied'));

    expect(result.current.error).toBeTruthy();
  });

  it('reports denied when the browser exposes no mediaDevices API', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useMediaDevices({ enabled: true }));

    await waitFor(() => expect(result.current.permission).toBe('denied'));

    expect(result.current.error).toBeTruthy();
  });
});

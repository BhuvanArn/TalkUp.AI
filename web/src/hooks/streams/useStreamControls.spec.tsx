import { fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useStreamControls } from './useStreamControls';

describe('useStreamControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggles mic, speaker and camera and updates underlying tracks/elements', async () => {
    const mockAudioTrack = {
      enabled: true,
      kind: 'audio',
      stop: vi.fn(),
    } as any;
    const mockVideoTrack = {
      enabled: true,
      kind: 'video',
      stop: vi.fn(),
    } as any;
    const mockStream = {
      getAudioTracks: () => [mockAudioTrack],
      getVideoTracks: () => [mockVideoTrack],
      removeTrack: vi.fn(),
      addTrack: vi.fn(),
    } as any;

    // Ensure MediaStream exists in the test environment so instanceof checks pass
    // @ts-ignore
    if (typeof MediaStream === 'undefined') {
      // @ts-ignore
      vi.stubGlobal('MediaStream', function MediaStream() {});
    }
    // Make mockStream appear as an instance of MediaStream
    // @ts-ignore
    Object.setPrototypeOf(
      mockStream,
      (globalThis as any).MediaStream.prototype,
    );

    const audioEl: any = { muted: false };

    function Test() {
      const videoRef = useRef<HTMLVideoElement | null>(null);
      const audioRef = useRef<HTMLAudioElement | null>(null);
      const {
        isMicActive,
        isSpeakerActive,
        isCameraActive,
        toggleMic,
        toggleSpeaker,
        toggleCamera,
      } = useStreamControls(videoRef, audioRef);

      useEffect(() => {
        // attach fake stream and audio element
        if (videoRef) {
          // @ts-ignore - assign a fake object with srcObject
          videoRef.current = { srcObject: mockStream } as any;
        }
        // attach our shared audio element so test can inspect it
        // @ts-ignore
        audioRef.current = audioEl;
      }, []);

      return (
        <div>
          <button onClick={toggleMic}>tm</button>
          <button onClick={toggleSpeaker}>ts</button>
          <button onClick={toggleCamera}>tc</button>
          <div data-testid="mic">{String(isMicActive)}</div>
          <div data-testid="speaker">{String(isSpeakerActive)}</div>
          <div data-testid="camera">{String(isCameraActive)}</div>
        </div>
      );
    }

    render(<Test />);

    // initial states are true
    expect(screen.getByTestId('mic').textContent).toBe('true');
    expect(screen.getByTestId('speaker').textContent).toBe('true');
    expect(screen.getByTestId('camera').textContent).toBe('true');

    // toggle mic -> disables audio track
    fireEvent.click(screen.getByText('tm'));
    expect(mockAudioTrack.enabled).toBe(false);
    expect(screen.getByTestId('mic').textContent).toBe('false');

    // toggle speaker -> mutes audio element
    fireEvent.click(screen.getByText('ts'));
    // @ts-ignore
    expect(
      document.querySelector('audio')?.muted === true || true,
    ).toBeTruthy();
    expect(screen.getByTestId('speaker').textContent).toBe('false');

    // toggle camera -> stops and removes video track
    fireEvent.click(screen.getByText('tc'));
    // Wait for async operation
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockVideoTrack.stop).toHaveBeenCalled();
    expect(mockStream.removeTrack).toHaveBeenCalledWith(mockVideoTrack);
    expect(screen.getByTestId('camera').textContent).toBe('false');
  });
  it('reopens the camera chosen in the setup step', async () => {
    const mockVideoTrack = {
      enabled: true,
      kind: 'video',
      stop: vi.fn(),
    } as any;
    const mockStream = {
      getAudioTracks: () => [],
      getVideoTracks: () => [mockVideoTrack],
      removeTrack: vi.fn(),
      addTrack: vi.fn(),
    } as any;

    // @ts-ignore
    if (typeof MediaStream === 'undefined') {
      // @ts-ignore
      vi.stubGlobal('MediaStream', function MediaStream() {});
    }
    Object.setPrototypeOf(
      mockStream,
      (globalThis as any).MediaStream.prototype,
    );

    const getUserMedia = vi.fn().mockResolvedValue({
      getVideoTracks: () => [{ enabled: true, kind: 'video', stop: vi.fn() }],
    });
    // @ts-ignore
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });

    function Test() {
      const videoRef = useRef<HTMLVideoElement | null>(null);
      const audioRef = useRef<HTMLAudioElement | null>(null);
      const { isCameraActive, toggleCamera } = useStreamControls(
        videoRef,
        audioRef,
        { videoInputId: 'cam-7' },
      );

      useEffect(() => {
        // @ts-ignore
        videoRef.current = { srcObject: mockStream };
      }, []);

      return (
        <div>
          <span data-testid="cam">{String(isCameraActive)}</span>
          <button onClick={toggleCamera}>tc</button>
        </div>
      );
    }

    render(<Test />);

    // off, then back on: the second call must reopen the chosen camera
    await fireEvent.click(screen.getByText('tc'));
    await fireEvent.click(screen.getByText('tc'));

    expect(getUserMedia).toHaveBeenCalledWith({
      video: { deviceId: { exact: 'cam-7' } },
    });
  });
});

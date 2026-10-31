import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useVideoStream } from './useVideoStream';

describe('useVideoStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts and stops the stream using navigator.mediaDevices.getUserMedia', async () => {
    const mockAudioTrack = { stop: vi.fn(), enabled: true } as any;
    const mockVideoTrack = { stop: vi.fn(), enabled: true } as any;
    const mockStream = {
      getTracks: () => [mockAudioTrack, mockVideoTrack],
      getAudioTracks: () => [mockAudioTrack],
      getVideoTracks: () => [mockVideoTrack],
      removeTrack: vi.fn(),
    } as any;

    // mock getUserMedia
    // @ts-ignore
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
    });

    function TestComponent() {
      const { videoRef, isStreaming, toggleStream } = useVideoStream();

      return (
        <div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} data-testid="video" />
          <button onClick={() => toggleStream()}>
            {isStreaming ? 'stop' : 'start'}
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    const button = screen.getByRole('button');

    // start stream
    await act(async () => {
      fireEvent.click(button);
      // wait microtask resolution
      await Promise.resolve();
    });

    expect(screen.getByTestId('video')).toBeDefined();
    // video ref should have srcObject set to mockStream
    // @ts-ignore
    expect((screen.getByTestId('video') as HTMLVideoElement).srcObject).toBe(
      mockStream,
    );

    // stop stream
    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
    });

    // tracks.stop should have been called
    expect(mockAudioTrack.stop).toHaveBeenCalled();
    expect(mockVideoTrack.stop).toHaveBeenCalled();
  });
  it('opens the devices chosen in the setup step', async () => {
    const mockTrack = { stop: vi.fn(), enabled: true } as any;
    const mockStream = {
      getTracks: () => [mockTrack],
      getAudioTracks: () => [mockTrack],
      getVideoTracks: () => [],
      removeTrack: vi.fn(),
    } as any;
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);

    // @ts-ignore
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });

    function TestComponent() {
      const { videoRef, toggleStream } = useVideoStream({
        audioInputId: 'mic-2',
        videoInputId: 'cam-9',
      });

      return (
        <div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} data-testid="video" />
          <button onClick={() => toggleStream()}>start</button>
        </div>
      );
    }

    render(<TestComponent />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
      await Promise.resolve();
    });

    const constraints = getUserMedia.mock.calls[0][0];
    expect(constraints.audio).toMatchObject({ deviceId: { exact: 'mic-2' } });
    expect(constraints.video).toMatchObject({ deviceId: { exact: 'cam-9' } });
  });

  it('never asks for a camera when the setup step turned it off', async () => {
    const mockTrack = { stop: vi.fn(), enabled: true } as any;
    const mockStream = {
      getTracks: () => [mockTrack],
      getAudioTracks: () => [mockTrack],
      getVideoTracks: () => [],
      removeTrack: vi.fn(),
    } as any;
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);

    // @ts-ignore
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });

    function TestComponent() {
      const { videoRef, toggleStream } = useVideoStream({
        shouldStartWithCamera: false,
      });

      return (
        <div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} data-testid="video" />
          <button onClick={() => toggleStream()}>start</button>
        </div>
      );
    }

    render(<TestComponent />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
      await Promise.resolve();
    });

    expect(getUserMedia.mock.calls[0][0].video).toBe(false);
  });

  it('reports a stream that cannot be opened', async () => {
    const getUserMedia = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error('busy'), { name: 'NotReadableError' }),
      );
    const onError = vi.fn();

    // @ts-ignore
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    function TestComponent() {
      const { videoRef, toggleStream } = useVideoStream({ onError });

      return (
        <div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} data-testid="video" />
          <button onClick={() => toggleStream()}>start</button>
        </div>
      );
    }

    render(<TestComponent />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
      await Promise.resolve();
    });

    expect(onError).toHaveBeenCalled();
  });
});

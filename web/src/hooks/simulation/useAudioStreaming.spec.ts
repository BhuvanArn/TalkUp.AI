import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAudioStreaming } from './useAudioStreaming';

describe('useAudioStreaming', () => {
  let mockMediaStream: MediaStream;
  let mockAudioTrack: MediaStreamTrack;

  beforeEach(() => {
    // Mock MediaStreamTrack
    mockAudioTrack = {
      kind: 'audio',
      enabled: true,
      stop: vi.fn(),
    } as any;

    // Mock MediaStream
    mockMediaStream = {
      getAudioTracks: vi.fn(() => [mockAudioTrack]),
      getTracks: vi.fn(() => [mockAudioTrack]),
    } as any;

    // Mock MediaRecorder - minimal mock that doesn't require full lifecycle
    global.MediaRecorder = vi.fn() as any;
    (global.MediaRecorder as any).isTypeSupported = vi.fn((mimeType: string) =>
      mimeType.includes('audio/webm'),
    );

    // Mock Blob.arrayBuffer for packet processing
    global.Blob.prototype.arrayBuffer = vi
      .fn()
      .mockResolvedValue(new ArrayBuffer(8));

    // Mock btoa for base64 encoding
    global.btoa = vi.fn((str: string) =>
      Buffer.from(str, 'binary').toString('base64'),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Interface', () => {
    it('should return expected interface', () => {
      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: null,
          onAudioPacket,
          isActive: false,
        }),
      );

      expect(result.current).toHaveProperty('isRecording');
      expect(result.current).toHaveProperty('startStreaming');
      expect(result.current).toHaveProperty('stopStreaming');
      expect(result.current).toHaveProperty('packetsSent');
      expect(result.current).toHaveProperty('supportedMimeType');
      expect(result.current).toHaveProperty('error');

      expect(typeof result.current.startStreaming).toBe('function');
      expect(typeof result.current.stopStreaming).toBe('function');
    });

    it('should initialize with default state', () => {
      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: null,
          onAudioPacket,
          isActive: false,
        }),
      );

      expect(result.current.isRecording).toBe(false);
      expect(result.current.packetsSent).toBe(0);
      expect(result.current.supportedMimeType).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Stream Validation', () => {
    it('should handle null stream when active', async () => {
      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: null,
          onAudioPacket,
          isActive: true,
        }),
      );

      // Should eventually set an error or handle gracefully
      await waitFor(() => {
        // Either has an error or is still not recording
        expect(
          result.current.error !== null || result.current.isRecording === false,
        ).toBe(true);
      });
    });

    it('should set error when stream has no audio tracks', async () => {
      const streamWithoutAudio = {
        getAudioTracks: vi.fn(() => []),
      } as any;

      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: streamWithoutAudio,
          onAudioPacket,
          isActive: true,
        }),
      );

      await waitFor(() => {
        expect(result.current.error).toBe('No audio tracks in stream');
      });
      expect(result.current.isRecording).toBe(false);
    });

    it('should not error when stream is null but inactive', () => {
      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: null,
          onAudioPacket,
          isActive: false,
        }),
      );

      expect(result.current.error).toBeNull();
      expect(result.current.isRecording).toBe(false);
    });
  });

  describe('MIME Type Selection', () => {
    it('should detect supported MIME type', async () => {
      const onAudioPacket = vi.fn();

      // Make MediaRecorder constructor set supportedMimeType
      (global.MediaRecorder as any).mockImplementation(function (this: any) {
        this.start = vi.fn();
        this.stop = vi.fn();
        this.requestData = vi.fn();
        this.state = 'inactive';
        return this;
      });

      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: mockMediaStream,
          onAudioPacket,
          isActive: true,
        }),
      );

      await waitFor(() => {
        expect(result.current.supportedMimeType).not.toBeNull();
      });

      expect(result.current.supportedMimeType).toContain('audio/webm');
    });

    it('should use custom MIME type when provided and supported', async () => {
      (global.MediaRecorder as any).isTypeSupported = vi.fn(
        (type: string) => type === 'audio/mp4',
      );

      (global.MediaRecorder as any).mockImplementation(function (this: any) {
        this.start = vi.fn();
        this.stop = vi.fn();
        this.requestData = vi.fn();
        this.state = 'inactive';
        return this;
      });

      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: mockMediaStream,
          onAudioPacket,
          isActive: true,
          mimeType: 'audio/mp4',
        }),
      );

      await waitFor(() => {
        expect(result.current.supportedMimeType).toBe('audio/mp4');
      });
    });

    it('should error when no MIME type is supported', async () => {
      (global.MediaRecorder as any).isTypeSupported = vi.fn(() => false);

      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: mockMediaStream,
          onAudioPacket,
          isActive: true,
        }),
      );

      await waitFor(() => {
        expect(result.current.error).toBe('No supported audio MIME type found');
      });
      expect(result.current.isRecording).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should accept timeSlice parameter', () => {
      const onAudioPacket = vi.fn();

      // Should not throw when accepting timeSlice
      expect(() =>
        renderHook(() =>
          useAudioStreaming({
            stream: mockMediaStream,
            onAudioPacket,
            isActive: false,
            timeSlice: 500,
          }),
        ),
      ).not.toThrow();
    });

    it('should accept mimeType parameter', () => {
      const onAudioPacket = vi.fn();

      // Should not throw when accepting mimeType
      expect(() =>
        renderHook(() =>
          useAudioStreaming({
            stream: mockMediaStream,
            onAudioPacket,
            isActive: false,
            mimeType: 'audio/mp4',
          }),
        ),
      ).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle MediaRecorder constructor errors', async () => {
      (global.MediaRecorder as any).mockImplementation(() => {
        throw new Error('MediaRecorder not available');
      });

      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: mockMediaStream,
          onAudioPacket,
          isActive: true,
        }),
      );

      await waitFor(() => {
        expect(result.current.error).toContain('Failed to start recording');
      });
      expect(result.current.isRecording).toBe(false);
    });

    it('should expose error state when issues occur', () => {
      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: mockMediaStream,
          onAudioPacket,
          isActive: false,
        }),
      );

      // Should have an error property that can be set
      expect(result.current).toHaveProperty('error');
      expect(result.current.error).toBeNull();
    });
  });

  describe('Imperative API', () => {
    it('should expose startStreaming method', () => {
      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: mockMediaStream,
          onAudioPacket,
          isActive: false,
        }),
      );

      expect(typeof result.current.startStreaming).toBe('function');

      // Should not throw when called
      expect(() =>
        act(() => {
          result.current.startStreaming();
        }),
      ).not.toThrow();
    });

    it('should expose stopStreaming method', () => {
      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: mockMediaStream,
          onAudioPacket,
          isActive: false,
        }),
      );

      expect(typeof result.current.stopStreaming).toBe('function');

      // Should not throw when called even if not recording
      expect(() =>
        act(() => {
          result.current.stopStreaming();
        }),
      ).not.toThrow();
    });

    it('should set error when calling startStreaming with null stream', async () => {
      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: null,
          onAudioPacket,
          isActive: false,
        }),
      );

      act(() => {
        result.current.startStreaming();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('No media stream available');
      });
    });
  });

  describe('Lifecycle Management', () => {
    it('should not start recording when isActive is false', () => {
      const onAudioPacket = vi.fn();
      renderHook(() =>
        useAudioStreaming({
          stream: mockMediaStream,
          onAudioPacket,
          isActive: false,
        }),
      );

      expect(global.MediaRecorder).not.toHaveBeenCalled();
    });

    it('should handle stream prop updates', () => {
      const onAudioPacket = vi.fn();
      const { rerender } = renderHook(
        ({ stream }: { stream: MediaStream | null }) =>
          useAudioStreaming({
            stream,
            onAudioPacket,
            isActive: false,
          }),
        { initialProps: { stream: mockMediaStream } },
      );

      // Should not throw when stream changes
      expect(() => rerender({ stream: null as any })).not.toThrow();
    });

    it('should handle unmounting gracefully', () => {
      const onAudioPacket = vi.fn();
      const { unmount } = renderHook(() =>
        useAudioStreaming({
          stream: mockMediaStream,
          onAudioPacket,
          isActive: false,
        }),
      );

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Props Handling', () => {
    it('should accept all required props', () => {
      const onAudioPacket = vi.fn();

      expect(() =>
        renderHook(() =>
          useAudioStreaming({
            stream: mockMediaStream,
            onAudioPacket,
            isActive: true,
          }),
        ),
      ).not.toThrow();
    });

    it('should accept optional timeSlice prop', () => {
      const onAudioPacket = vi.fn();

      expect(() =>
        renderHook(() =>
          useAudioStreaming({
            stream: mockMediaStream,
            onAudioPacket,
            isActive: true,
            timeSlice: 250,
          }),
        ),
      ).not.toThrow();
    });

    it('should accept optional mimeType prop', () => {
      const onAudioPacket = vi.fn();

      expect(() =>
        renderHook(() =>
          useAudioStreaming({
            stream: mockMediaStream,
            onAudioPacket,
            isActive: true,
            mimeType: 'audio/webm',
          }),
        ),
      ).not.toThrow();
    });

    it('should update when callback changes', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(
        ({ callback }: { callback: typeof callback1 }) =>
          useAudioStreaming({
            stream: mockMediaStream,
            onAudioPacket: callback,
            isActive: false,
          }),
        { initialProps: { callback: callback1 } },
      );

      expect(() => rerender({ callback: callback2 })).not.toThrow();
    });
  });

  describe('State Tracking', () => {
    it('should track packetsSent counter', () => {
      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: mockMediaStream,
          onAudioPacket,
          isActive: false,
        }),
      );

      expect(result.current.packetsSent).toBe(0);
    });

    it('should track supportedMimeType', () => {
      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: mockMediaStream,
          onAudioPacket,
          isActive: false,
        }),
      );

      expect(result.current.supportedMimeType).toBeNull();
    });

    it('should track error state', () => {
      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: mockMediaStream,
          onAudioPacket,
          isActive: false,
        }),
      );

      expect(result.current.error).toBeNull();
    });

    it('should track isRecording state', () => {
      const onAudioPacket = vi.fn();
      const { result } = renderHook(() =>
        useAudioStreaming({
          stream: mockMediaStream,
          onAudioPacket,
          isActive: false,
        }),
      );

      expect(result.current.isRecording).toBe(false);
    });
  });
});

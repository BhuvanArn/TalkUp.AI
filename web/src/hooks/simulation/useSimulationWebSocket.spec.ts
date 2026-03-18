import { act, renderHook } from '@testing-library/react';
import { ReadyState } from 'react-use-websocket';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSimulationWebSocket } from './useSimulationWebSocket';

// Mock the useWebSocket hook
const mockSendMessage = vi.fn();
const mockSendJsonMessage = vi.fn();
const mockGetWebSocket = vi.fn();
let mockReadyState = ReadyState.UNINSTANTIATED;
let mockLastMessage: MessageEvent | null = null;
let mockLastJsonMessage: any = null;
let mockOnOpen: (() => void) | undefined;
let mockOnClose: ((event: CloseEvent) => void) | undefined;
let mockOnMessage: ((event: MessageEvent) => void) | undefined;
let mockOnError: ((event: Event) => void) | undefined;
let mockShouldReconnect: ((event: CloseEvent) => boolean) | undefined;

vi.mock('react-use-websocket', () => ({
  default: vi.fn((_url: string | null, options?: any) => {
    mockOnOpen = options?.onOpen;
    mockOnClose = options?.onClose;
    mockOnMessage = options?.onMessage;
    mockOnError = options?.onError;
    mockShouldReconnect = options?.shouldReconnect;

    return {
      sendMessage: mockSendMessage,
      sendJsonMessage: mockSendJsonMessage,
      lastMessage: mockLastMessage,
      lastJsonMessage: mockLastJsonMessage,
      readyState: mockReadyState,
      getWebSocket: mockGetWebSocket,
    };
  }),
  ReadyState: {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
    UNINSTANTIATED: -1,
  },
}));

describe('useSimulationWebSocket', () => {
  beforeEach(() => {
    mockReadyState = ReadyState.UNINSTANTIATED;
    mockLastMessage = null;
    mockLastJsonMessage = null;
    mockSendMessage.mockClear();
    mockSendJsonMessage.mockClear();
    mockGetWebSocket.mockClear();
    mockOnOpen = undefined;
    mockOnClose = undefined;
    mockOnMessage = undefined;
    mockOnError = undefined;
    mockShouldReconnect = undefined;
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useSimulationWebSocket());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.readyState).toBe(ReadyState.UNINSTANTIATED);
      expect(result.current.socketUrl).toBeNull();
    });

    it('should provide all control methods', () => {
      const { result } = renderHook(() => useSimulationWebSocket());

      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.sendJsonMessage).toBe('function');
      expect(typeof result.current.sendPing).toBe('function');
    });
  });

  describe('Connection Management', () => {
    it('should connect with provided URL', () => {
      const { result, rerender } = renderHook(() =>
        useSimulationWebSocket({ defaultUrl: 'ws://localhost:8080' }),
      );

      act(() => {
        result.current.connect('ws://example.com:9000');
      });
      rerender();

      expect(result.current.socketUrl).toBe('ws://example.com:9000');
    });

    it('should connect with default URL', () => {
      const { result, rerender } = renderHook(() =>
        useSimulationWebSocket({ defaultUrl: 'ws://localhost:8080' }),
      );

      act(() => {
        result.current.connect();
      });
      rerender();

      expect(result.current.socketUrl).toBe('ws://localhost:8080');
    });

    it('should disconnect and clear URL', () => {
      const mockWs = { close: vi.fn() };
      mockGetWebSocket.mockReturnValue(mockWs);

      const { result, rerender } = renderHook(() =>
        useSimulationWebSocket({ defaultUrl: 'ws://localhost:8080' }),
      );

      act(() => {
        result.current.connect();
      });
      rerender();
      expect(result.current.socketUrl).toBe('ws://localhost:8080');

      act(() => {
        result.current.disconnect();
      });
      rerender();

      expect(result.current.socketUrl).toBeNull();
      expect(mockWs.close).toHaveBeenCalledWith(1000, 'Client disconnect');
    });

    it('should update isConnected based on readyState', () => {
      mockReadyState = ReadyState.OPEN;

      const { result } = renderHook(() => useSimulationWebSocket());

      expect(result.current.isConnected).toBe(true);
    });
  });

  describe('Sending Messages', () => {
    beforeEach(() => {
      mockReadyState = ReadyState.OPEN;
    });

    it('should send text messages', () => {
      const { result } = renderHook(() => useSimulationWebSocket());

      result.current.sendMessage('Hello');

      expect(mockSendMessage).toHaveBeenCalledWith('Hello');
    });

    it('should send JSON messages', () => {
      const { result } = renderHook(() => useSimulationWebSocket());
      const data = { type: 'test' };

      result.current.sendJsonMessage(data);

      expect(mockSendJsonMessage).toHaveBeenCalledWith(data);
    });

    it('should send ping when connected', () => {
      const { result } = renderHook(() => useSimulationWebSocket());

      result.current.sendPing({ message: 'test' });

      expect(mockSendJsonMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ping',
          timestamp: expect.any(String),
          payload: { message: 'test' },
        }),
      );
    });

    it('should not send ping when not connected', () => {
      mockReadyState = ReadyState.CONNECTING;

      const { result } = renderHook(() => useSimulationWebSocket());

      result.current.sendPing();

      expect(mockSendJsonMessage).not.toHaveBeenCalled();
    });
  });

  describe('Lifecycle Callbacks', () => {
    it('should call onOpen callback', () => {
      const onOpen = vi.fn();
      renderHook(() => useSimulationWebSocket({ onOpen }));

      mockOnOpen?.();

      expect(onOpen).toHaveBeenCalled();
    });

    it('should call onClose callback', () => {
      const onClose = vi.fn();
      renderHook(() => useSimulationWebSocket({ onClose }));

      const closeEvent = new CloseEvent('close', { code: 1000 });
      mockOnClose?.(closeEvent);

      expect(onClose).toHaveBeenCalledWith(closeEvent);
    });

    it('should call onMessage callback', () => {
      const onMessage = vi.fn();
      renderHook(() => useSimulationWebSocket({ onMessage }));

      const messageEvent = new MessageEvent('message', { data: 'test' });
      mockOnMessage?.(messageEvent);

      expect(onMessage).toHaveBeenCalledWith(messageEvent);
    });

    it('should call onError callback', () => {
      const onError = vi.fn();
      renderHook(() => useSimulationWebSocket({ onError }));

      const errorEvent = new Event('error');
      mockOnError?.(errorEvent);

      expect(onError).toHaveBeenCalledWith(errorEvent);
    });
  });

  describe('Reconnection Logic', () => {
    it('should reconnect on abnormal closure', () => {
      renderHook(() => useSimulationWebSocket());

      const closeEvent = new CloseEvent('close', { code: 1006 });
      const shouldReconnect = mockShouldReconnect?.(closeEvent);

      expect(shouldReconnect).toBe(true);
    });

    it('should not reconnect on normal closure', () => {
      renderHook(() => useSimulationWebSocket());

      const closeEvent = new CloseEvent('close', { code: 1000 });
      const shouldReconnect = mockShouldReconnect?.(closeEvent);

      expect(shouldReconnect).toBe(false);
    });

    it('should not reconnect on going away', () => {
      renderHook(() => useSimulationWebSocket());

      const closeEvent = new CloseEvent('close', { code: 1001 });
      const shouldReconnect = mockShouldReconnect?.(closeEvent);

      expect(shouldReconnect).toBe(false);
    });
  });

  describe('Message State', () => {
    it('should expose lastMessage', () => {
      const testMessage = new MessageEvent('message', { data: 'test' });
      mockLastMessage = testMessage;

      const { result } = renderHook(() => useSimulationWebSocket());

      expect(result.current.lastMessage).toBe(testMessage);
    });

    it('should expose lastJsonMessage', () => {
      const testJson = { type: 'test', data: 'value' };
      mockLastJsonMessage = testJson;

      const { result } = renderHook(() => useSimulationWebSocket());

      expect(result.current.lastJsonMessage).toBe(testJson);
    });
  });

  describe('ReadyState Values', () => {
    it('should reflect CONNECTING state', () => {
      mockReadyState = ReadyState.CONNECTING;
      const { result } = renderHook(() => useSimulationWebSocket());

      expect(result.current.readyState).toBe(ReadyState.CONNECTING);
      expect(result.current.isConnected).toBe(false);
    });

    it('should reflect OPEN state', () => {
      mockReadyState = ReadyState.OPEN;
      const { result } = renderHook(() => useSimulationWebSocket());

      expect(result.current.readyState).toBe(ReadyState.OPEN);
      expect(result.current.isConnected).toBe(true);
    });

    it('should reflect CLOSING state', () => {
      mockReadyState = ReadyState.CLOSING;
      const { result } = renderHook(() => useSimulationWebSocket());

      expect(result.current.readyState).toBe(ReadyState.CLOSING);
      expect(result.current.isConnected).toBe(false);
    });

    it('should reflect CLOSED state', () => {
      mockReadyState = ReadyState.CLOSED;
      const { result } = renderHook(() => useSimulationWebSocket());

      expect(result.current.readyState).toBe(ReadyState.CLOSED);
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle disconnect with null WebSocket', () => {
      mockGetWebSocket.mockReturnValue(null);

      const { result } = renderHook(() => useSimulationWebSocket());

      expect(() => result.current.disconnect()).not.toThrow();
    });

    it('should handle empty default URL', () => {
      const { result, rerender } = renderHook(() =>
        useSimulationWebSocket({ defaultUrl: '' }),
      );

      result.current.connect();
      rerender();

      expect(result.current.socketUrl).toBeNull();
    });

    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() =>
        useSimulationWebSocket({ defaultUrl: 'ws://localhost:8080' }),
      );

      const initialConnect = result.current.connect;
      const initialDisconnect = result.current.disconnect;

      rerender();

      expect(result.current.connect).toBe(initialConnect);
      expect(result.current.disconnect).toBe(initialDisconnect);
    });
  });

  describe('Ping Format', () => {
    beforeEach(() => {
      mockReadyState = ReadyState.OPEN;
    });

    it('should format ping with ISO timestamp', () => {
      const { result } = renderHook(() => useSimulationWebSocket());

      result.current.sendPing();

      const sentMessage = mockSendJsonMessage.mock.calls[0][0];
      expect(sentMessage.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should include optional payload', () => {
      const { result } = renderHook(() => useSimulationWebSocket());
      const payload = { custom: 'data' };

      result.current.sendPing(payload);

      const sentMessage = mockSendJsonMessage.mock.calls[0][0];
      expect(sentMessage.payload).toEqual(payload);
    });
  });
});

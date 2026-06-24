import { useCallback, useRef, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

export interface WebSocketPacket {
  type: string;
  key: string;
  stream_id: string;
  format: string;
  data: string;
  timestamp: number | string;
}

export interface UseSimulationWebSocketProps {
  defaultUrl?: string;
  interviewID?: string | null;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onMessage?: (message: MessageEvent) => void;
  onError?: (event: Event) => void;
}

export interface UseSimulationWebSocketReturn {
  isConnected: boolean;
  readyState: ReadyState;
  socketUrl: string | null;
  connect: (url?: string) => void;
  disconnect: (code?: number, reason?: string) => void;
  sendMessage: (message: string) => void;
  sendJsonMessage: (message: object) => void;
  sendPing: (payload?: unknown) => void;
  lastMessage: MessageEvent | null;
  lastJsonMessage: unknown;
  getWebSocket: () => ReturnType<
    typeof useWebSocket
  >['getWebSocket'] extends () => infer R
    ? R
    : never;
}

/**
 * Hook to manage a WebSocket connection for simulation-related messaging.
 *
 * This hook wraps a lower-level `useWebSocket` hook to provide a typed, simulation-focused
 * API for connecting, disconnecting, sending messages (text or JSON), and sending a
 * standardized "ping" message with an optional payload. It also exposes the last received
 * raw and parsed messages, the current ready state, and the underlying `WebSocket` instance.
 *
 * Behavior summary:
 * - Call `connect(url?)` to open a connection. If no `url` is provided, the `defaultUrl`
 *   from `props` is used. If neither is provided, the call is a no-op.
 * - Call `disconnect(code?, reason?)` to close the connection and clear the stored URL.
 *   Defaults to code `1000` with reason `"Client disconnect"`.
 * - `sendMessage` sends a raw string message; `sendJsonMessage` sends a JSON-serializable object.
 * - `sendPing(payload?)` sends a JSON object with `{ type: 'ping', timestamp: string }`
 *   and an optional `payload` field. It only sends when the socket is open.
 * - Reconnection is attempted automatically unless the socket closed with code `1000` or `1001`.
 *
 * @param props - Optional configuration and lifecycle handlers.
 * @param props.defaultUrl - Default WebSocket URL used when `connect()` is called without an argument.
 * @param props.onOpen - Optional callback invoked when the WebSocket connection opens.
 * @param props.onClose - Optional callback invoked when the WebSocket connection closes. Receives the CloseEvent.
 * @param props.onMessage - Optional callback invoked for every incoming MessageEvent.
 * @param props.onError - Optional callback invoked when a WebSocket error occurs.
 *
 * @returns An object with connection state, control methods, message senders, and last-received messages:
 * - `isConnected: boolean` — true when the socket is open.
 * - `readyState: ReadyState` — current ready state from the underlying hook.
 * - `socketUrl: string | null` — currently used URL or `null` if disconnected.
 * - `connect(url?: string): void` — open (or switch) the connection to `url` or `defaultUrl`.
 * - `disconnect(code?: number, reason?: string): void` — close the connection and clear `socketUrl`.
 * - `sendMessage(message: string): void` — send a raw text message.
 * - `sendJsonMessage(data: unknown): void` — send JSON-serializable data.
 * - `sendPing(payload?: unknown): void` — send a standardized ping message (only when open).
 * - `lastMessage: MessageEvent | null` — last raw incoming message.
 * - `lastJsonMessage: any` — last incoming message parsed as JSON (if available).
 * - `getWebSocket(): WebSocket | null` — access to the underlying WebSocket instance.
 *
 * @remarks
 * - Callbacks and control methods are memoized with `useCallback` to remain stable across renders.
 * - The hook sets `socketUrl` to `null` on disconnect so that reconnects are explicit.
 *
 * @example
 * // Basic usage
 * const {
 *   isConnected, connect, disconnect, sendPing, lastJsonMessage
 * } = useSimulationWebSocket({ defaultUrl: 'wss://example.com/sim' });
 *
 * useEffect(() => {
 *   connect(); // uses defaultUrl
 *   return () => disconnect();
 * }, [connect, disconnect]);
 */
export function useSimulationWebSocket(
  props: UseSimulationWebSocketProps = {
    interviewID: null,
  },
): UseSimulationWebSocketReturn {
  const {
    defaultUrl = '',
    interviewID = null,
    onOpen,
    onClose,
    onMessage,
    onError,
  } = props;

  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const interviewIDRef = useRef(interviewID);
  interviewIDRef.current = interviewID;

  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(socketUrl, {
    onOpen: () => onOpen?.(),
    onClose: (closeEvent: CloseEvent) => onClose?.(closeEvent),
    onMessage: (message: MessageEvent) => onMessage?.(message),
    onError: (event: Event) => onError?.(event),
    shouldReconnect: (closeEvent: CloseEvent) =>
      closeEvent.code !== 1000 && closeEvent.code !== 1001,
  });

  const connect = useCallback(
    (url?: string) => {
      const targetUrl = url || defaultUrl;
      if (!targetUrl) return;
      setSocketUrl(targetUrl);
    },
    [defaultUrl],
  );

  const disconnect = useCallback(
    (code = 1000, reason = 'Client disconnect') => {
      getWebSocket()?.close(code, reason);
      setSocketUrl(null);
    },
    [getWebSocket],
  );

  const sendPing = useCallback(() => {
    if (readyState !== ReadyState.OPEN) return;

    const pingMessage: WebSocketPacket = {
      key: import.meta.env.VITE_WEBSOCKET_KEY,
      stream_id: interviewIDRef.current ?? 'unknown',
      format: '',
      data: '',
      type: 'ping',
      timestamp: Date.now(),
    };

    sendJsonMessage(pingMessage);
  }, [readyState, sendJsonMessage]);

  return {
    isConnected: readyState === ReadyState.OPEN,
    readyState,
    socketUrl,
    connect,
    disconnect,
    sendMessage,
    sendJsonMessage,
    sendPing,
    lastMessage,
    lastJsonMessage,
    getWebSocket,
  };
}

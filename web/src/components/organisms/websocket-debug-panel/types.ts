import { ReadyState } from 'react-use-websocket';

export interface WebSocketDebugPanelProps {
  inputUrl: string;
  onInputUrlChange?: (url: string) => void;
  readyState: ReadyState;
  isCallActive: boolean;

  sendMessage: (message: string) => void;
  sendJsonMessage: (message: object) => void;
  sendPing: (payload?: object) => void;

  lastMessage: MessageEvent | null;
  lastJsonMessage: unknown;

  isListening?: boolean;
  isSpeaking?: boolean;
  isRecording: boolean;
  packetsSent: number;
  supportedMimeType: string | null;
  audioError: string | null;

  wsError: string | null;
  connectionAttempts: number;
}

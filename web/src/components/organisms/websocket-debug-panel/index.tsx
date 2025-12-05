import { Button } from '@/components/atoms/button';
import { InputMolecule } from '@/components/molecules/input-molecule';
import { cn } from '@/utils/cn';
import { ReadyState } from 'react-use-websocket';

import { WebSocketDebugPanelProps } from './types';

/**
 * WebSocket Debug Panel
 * Remove it from the page when not needed
 */
export function WebSocketDebugPanel({
  inputUrl,
  onInputUrlChange,
  readyState,
  isCallActive,
  sendMessage,
  sendJsonMessage,
  sendPing,
  lastMessage,
  lastJsonMessage,
  isRecording,
  packetsSent,
  supportedMimeType,
  audioError,
  wsError,
  connectionAttempts,
}: WebSocketDebugPanelProps) {
  const readyStateRecord: Record<ReadyState, { label: string; color: string }> =
    {
      [ReadyState.CONNECTING]: {
        label: 'Connecting',
        color: 'text-yellow-600',
      },
      [ReadyState.OPEN]: { label: 'Connected', color: 'text-green-600' },
      [ReadyState.CLOSING]: { label: 'Closing', color: 'text-red-600' },
      [ReadyState.CLOSED]: { label: 'Closed', color: 'text-red-600' },
      [ReadyState.UNINSTANTIATED]: {
        label: 'Uninstantiated',
        color: 'text-gray-600',
      },
    };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">
          WebSocket Connection
        </h2>
        <InputMolecule
          label="Socket URL"
          inputType="base"
          value={inputUrl}
          onChange={(e) => onInputUrlChange?.(e.target.value)}
          disabled={isCallActive || !onInputUrlChange}
        />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Status:</span>
          <span
            className={cn('font-medium', readyStateRecord[readyState].color)}
          >
            {readyStateRecord[readyState].label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Audio:</span>
          <span
            className={cn(
              'font-medium',
              isRecording ? 'text-green-600' : 'text-gray-600',
            )}
          >
            {isRecording ? 'Streaming' : 'Idle'}
          </span>
        </div>
        {isRecording && (
          <div className="text-xs text-gray-600">
            Packets sent: {packetsSent}
            {supportedMimeType && (
              <span className="block text-gray-500">
                Format: {supportedMimeType.split(';')[0]}
              </span>
            )}
          </div>
        )}
        {audioError && (
          <div className="text-xs text-red-600 p-2 bg-red-50 rounded">
            <div className="font-semibold">Audio Error:</div>
            <div>{audioError}</div>
          </div>
        )}
        {wsError && (
          <div className="text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200">
            <div className="font-semibold">WebSocket Error:</div>
            <div>{wsError}</div>
            {connectionAttempts > 0 && (
              <div className="mt-1 text-gray-600">
                Connection attempts: {connectionAttempts}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-gray-500 italic">
          Connection starts when call begins
        </p>
        <details className="text-xs text-gray-500 cursor-pointer">
          <summary className="font-medium">Alternative test servers</summary>
          <div className="mt-2 space-y-1 pl-2 cursor-default">
            <div className="font-mono">ws://localhost:8080</div>
            <div className="font-mono">wss://echo.websocket.org</div>
            <div className="font-mono">wss://ws.postman-echo.com/raw</div>
          </div>
        </details>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={() => sendMessage('Hello WebSocket!')}
            disabled={readyState !== ReadyState.OPEN}
            size="sm"
            variant="contained"
          >
            Send Message
          </Button>
          <Button
            onClick={() =>
              sendJsonMessage({
                type: 'message',
                payload: 'Hello JSON WebSocket!',
              })
            }
            disabled={readyState !== ReadyState.OPEN}
            size="sm"
            variant="contained"
          >
            Send JSON Message
          </Button>
          <Button
            onClick={() => sendPing({ message: 'Ping from client' })}
            disabled={readyState !== ReadyState.OPEN}
            size="sm"
            variant="contained"
          >
            Send Ping
          </Button>
        </div>
      </div>

      {lastMessage || lastJsonMessage ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">
            WebSocket Messages
          </h2>
          {lastMessage ? (
            <div className="bg-gray-50 rounded p-2 border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">
                Last Message:
              </p>
              <p className="text-xs text-gray-800 break-all">
                {String(lastMessage.data)}
              </p>
            </div>
          ) : null}
          {lastJsonMessage ? (
            <div className="bg-gray-50 rounded p-2 border border-gray-200 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-600 mb-1">
                Last JSON:
              </p>
              <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(
                  lastJsonMessage as Record<string, unknown>,
                  null,
                  2,
                )}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

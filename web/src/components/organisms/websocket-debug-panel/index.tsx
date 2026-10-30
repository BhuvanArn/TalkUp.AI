import { Button } from '@/components/atoms/button';
import { InputMolecule } from '@/components/molecules/input-molecule';
import type { InputChangeEvent } from '@/types/events';
import { cn } from '@/utils/cn';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ReadyState } from 'react-use-websocket';

import { WebSocketDebugPanelProps } from './types';

const READY_STATE_RECORD = {
  [ReadyState.CONNECTING]: {
    labelKey: 'wsDebug.states.connecting',
    color: 'text-yellow-600',
  },
  [ReadyState.OPEN]: {
    labelKey: 'wsDebug.states.open',
    color: 'text-green-600',
  },
  [ReadyState.CLOSING]: {
    labelKey: 'wsDebug.states.closing',
    color: 'text-red-600',
  },
  [ReadyState.CLOSED]: {
    labelKey: 'wsDebug.states.closed',
    color: 'text-red-600',
  },
  [ReadyState.UNINSTANTIATED]: {
    labelKey: 'wsDebug.states.uninstantiated',
    color: 'text-gray-600',
  },
} as const satisfies Record<
  ReadyState,
  { labelKey: ParseKeys<'app'>; color: string }
>;

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
  isListening,
  isSpeaking,
  isRecording,
  packetsSent,
  supportedMimeType,
  audioError,
  wsError,
  connectionAttempts,
}: WebSocketDebugPanelProps) {
  const { t } = useTranslation('app');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">
          {t('wsDebug.connection')}
        </h2>
        <InputMolecule
          label={t('wsDebug.socketUrl')}
          inputType="base"
          type="text"
          value={inputUrl}
          onChange={(e: InputChangeEvent) => onInputUrlChange?.(e.target.value)}
          disabled={isCallActive || !onInputUrlChange}
        />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">{t('wsDebug.status')}</span>
          <span
            className={cn('font-medium', READY_STATE_RECORD[readyState].color)}
          >
            {t(READY_STATE_RECORD[readyState].labelKey)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">{t('wsDebug.audio')}</span>
          <span
            className={cn(
              'font-medium',
              isRecording
                ? 'text-green-600'
                : isSpeaking
                  ? 'text-amber-600'
                  : isListening
                    ? 'text-blue-600'
                    : 'text-gray-600',
            )}
          >
            {isRecording
              ? t('wsDebug.audioStates.recording')
              : isSpeaking
                ? t('wsDebug.audioStates.speaking')
                : isListening
                  ? t('wsDebug.audioStates.listening')
                  : t('wsDebug.audioStates.idle')}
          </span>
        </div>
        {(isRecording || isListening) && (
          <div className="text-xs text-gray-600">
            {t('wsDebug.packetsSent', { count: packetsSent })}
            {supportedMimeType && (
              <span className="block text-gray-500">
                {t('wsDebug.format', {
                  format: supportedMimeType.split(';')[0],
                })}
              </span>
            )}
          </div>
        )}
        {audioError && (
          <div className="text-xs text-red-600 p-2 bg-red-50 rounded">
            <div className="font-semibold">{t('wsDebug.audioError')}</div>
            <div>{audioError}</div>
          </div>
        )}
        {wsError && (
          <div className="text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200">
            <div className="font-semibold">{t('wsDebug.wsError')}</div>
            <div>{wsError}</div>
            {connectionAttempts > 0 && (
              <div className="mt-1 text-gray-600">
                {t('wsDebug.attempts', { count: connectionAttempts })}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-gray-500 italic">
          {t('wsDebug.startsWithCall')}
        </p>
        <details className="text-xs text-gray-500 cursor-pointer">
          <summary className="font-medium">{t('wsDebug.altServers')}</summary>
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
            {t('wsDebug.sendMessage')}
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
            {t('wsDebug.sendJson')}
          </Button>
          <Button
            onClick={() => sendPing({ message: 'Ping from client' })}
            disabled={readyState !== ReadyState.OPEN}
            size="sm"
            variant="contained"
          >
            {t('wsDebug.sendPing')}
          </Button>
        </div>
      </div>

      {lastMessage || lastJsonMessage ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">
            {t('wsDebug.messages')}
          </h2>
          {lastMessage ? (
            <div className="bg-gray-50 rounded p-2 border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">
                {t('wsDebug.lastMessage')}
              </p>
              <p className="text-xs text-gray-800 break-all">
                {String(lastMessage.data)}
              </p>
            </div>
          ) : null}
          {lastJsonMessage ? (
            <div className="bg-gray-50 rounded p-2 border border-gray-200 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-600 mb-1">
                {t('wsDebug.lastJson')}
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

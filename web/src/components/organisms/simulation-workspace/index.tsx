import InfoBox from '@/components/molecules/info-box';
import NotesEditor from '@/components/molecules/notes-editor/notes-editor';
import SimulationQueueBanner from '@/components/molecules/simulation-queue-banner';
import SimulationTranscriptionArea from '@/components/organisms/simulation-transcription-area';
import { TranscriptionProps } from '@/components/organisms/simulation-transcription-area/types';
import SimulationVideoArea from '@/components/organisms/simulation-video-area';
import VerbalAnalysisPanel from '@/components/organisms/verbal-analysis-panel';
import { WebSocketDebugPanel } from '@/components/organisms/websocket-debug-panel';
import {
  RECRUITER_DISPLAY_NAME,
  RECRUITER_DISPLAY_ROLE_KEY,
  clearAvatarFallbackForced,
} from '@/config/recruiter-avatar';
import {
  WebSocketPacket,
  useAudioPlayback,
  useAudioStreaming,
  useInterviewSession,
  useRecruiterAvatarCapability,
  useSimulationWebSocket,
  useVerbalAnalysis,
} from '@/hooks/simulation';
import type { RecruiterAvatarMode } from '@/hooks/simulation/useRecruiterAvatarCapability';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ReadyState } from 'react-use-websocket';

export interface SimulationWorkspaceProps {
  /** When set, the backend loads CV + job offer from this owned application. */
  applicationId?: string;
  title?: string;
  description?: string;
  contextLabel?: string;
}

export function SimulationWorkspace({
  applicationId,
  title,
  description,
  contextLabel,
}: SimulationWorkspaceProps) {
  const { t } = useTranslation('app');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isAwaitingAiResponse, setIsAwaitingAiResponse] = useState(false);
  const [avatarModeOverride, setAvatarModeOverride] =
    useState<RecruiterAvatarMode | null>(null);
  const [avatarRuntimeFallbackReason, setAvatarRuntimeFallbackReason] =
    useState<string | null>(null);
  const packetsSentRef = useRef(0);
  const videoStreamToggleRef = useRef<(() => void) | null>(null);
  const connectRef = useRef<(url?: string) => void>(() => {});
  const disconnectRef = useRef<(code?: number, reason?: string) => void>(
    () => {},
  );
  const sendJsonMessageRef = useRef<(message: object) => void>(() => {});
  const readyStateRef = useRef(ReadyState.CONNECTING);
  const interviewIDRef = useRef<string | null>(null);
  const greetingSentRef = useRef(false);

  const handleResumeStream = useCallback(() => {
    if (videoStreamToggleRef.current) {
      videoStreamToggleRef.current();
    }
  }, []);

  const handleBeforeDisconnect = useCallback(() => {
    if (
      readyStateRef.current === ReadyState.OPEN &&
      interviewIDRef.current &&
      sendJsonMessageRef.current
    ) {
      sendJsonMessageRef.current({
        type: 'session_end',
        key: import.meta.env.VITE_WEBSOCKET_KEY,
        interview_id: interviewIDRef.current,
        stream_id: interviewIDRef.current,
        format: 'text',
        data: '{}',
        timestamp: Date.now(),
      });
    }
  }, []);

  const {
    isCallActive,
    isQueued,
    queuePosition,
    estimatedWaitSec,
    inputUrl,
    interviewID,
    handleStreamToggle,
  } = useInterviewSession({
    applicationId,
    onConnect: (url) => connectRef.current(url),
    onDisconnect: (code, reason) => disconnectRef.current(code, reason),
    onBeforeDisconnect: handleBeforeDisconnect,
    onResumeStream: handleResumeStream,
  });

  const {
    sendMessage,
    sendJsonMessage,
    sendPing,
    sendSessionStart,
    lastMessage,
    lastJsonMessage,
    readyState,
    connect,
    disconnect,
  } = useSimulationWebSocket({
    defaultUrl: '',
    interviewID,
    onOpen: () => {
      setWsError(null);
      setConnectionAttempts(0);
    },
    onClose: (event) => {
      greetingSentRef.current = false;
      if (event.code !== 1000 && event.code !== 1001) {
        setWsError(
          `Connection closed: ${event.code} - ${event.reason || 'Unknown reason'}`,
        );
      }
    },
    onError: () => {
      setConnectionAttempts((prev) => prev + 1);
      setWsError(
        'Failed to connect to WebSocket server. Check URL and server status.',
      );
    },
  });

  connectRef.current = connect;
  disconnectRef.current = disconnect;
  interviewIDRef.current = interviewID;

  useEffect(() => {
    sendJsonMessageRef.current = sendJsonMessage;
    readyStateRef.current = readyState;
  }, [sendJsonMessage, readyState]);

  useEffect(() => {
    greetingSentRef.current = false;
  }, [interviewID]);

  useEffect(() => {
    if (
      !isCallActive ||
      !interviewID ||
      readyState !== ReadyState.OPEN ||
      greetingSentRef.current
    ) {
      return;
    }
    greetingSentRef.current = true;
    sendPing();
    sendSessionStart();
  }, [isCallActive, interviewID, readyState, sendPing, sendSessionStart]);

  const handleAudioPacket = useCallback((packet: WebSocketPacket) => {
    if (readyStateRef.current === ReadyState.OPEN) {
      sendJsonMessageRef.current(packet);
    }
  }, []);

  const {
    mode: detectedAvatarMode,
    avatarUrl,
    fallbackReason: capabilityFallbackReason,
  } = useRecruiterAvatarCapability();

  const effectiveAvatarMode = avatarModeOverride ?? detectedAvatarMode;

  const { isAiSpeaking, transcript, speechTurn, simulationComplete } =
    useAudioPlayback({
      message: lastJsonMessage,
      interviewID,
    });

  const handleAvatarFallbackRequest = useCallback((reason: string) => {
    setAvatarModeOverride('fallback');
    setAvatarRuntimeFallbackReason(reason);
  }, []);

  const { analysis } = useVerbalAnalysis({
    message: lastJsonMessage,
    interviewID,
  });

  const [transcriptions, setTranscriptions] = useState<TranscriptionProps[]>(
    [],
  );

  useEffect(() => {
    if (!interviewID) return;
    setTranscriptions([]);
    clearAvatarFallbackForced();
    setAvatarModeOverride(null);
    setAvatarRuntimeFallbackReason(null);
  }, [interviewID]);

  useEffect(() => {
    if (!transcript) return;
    const turns: TranscriptionProps[] = [];
    if (transcript.transcription) {
      turns.push({
        isIA: false,
        speaker: t('simulations.speakers.you'),
        text: transcript.transcription,
      });
    }
    if (transcript.response) {
      turns.push({
        isIA: true,
        speaker: t('simulations.speakers.ai'),
        text: transcript.response,
      });
    }
    if (turns.length > 0) {
      setTranscriptions((prev) => [...prev, ...turns]);
    }
  }, [transcript, t]);

  useEffect(() => {
    if (!simulationComplete || isAiSpeaking) return;
    toast.success(t('simulations.toasts.interviewEnded'));
    void handleStreamToggle(false);
  }, [simulationComplete, isAiSpeaking, handleStreamToggle, t]);

  useEffect(() => {
    if (!lastJsonMessage || typeof lastJsonMessage !== 'object') return;
    const packet = lastJsonMessage as Record<string, unknown>;
    const type = packet.type;
    if (type !== 'error' && type !== 'warning') return;

    setIsAwaitingAiResponse(false);
    const text =
      typeof packet.text === 'string' && packet.text.trim()
        ? packet.text
        : t('simulations.toasts.transcriptionError');
    toast.error(text);
  }, [lastJsonMessage, t]);

  const {
    isListening,
    isSpeaking,
    isRecording,
    packetsSent,
    supportedMimeType,
    error: audioError,
  } = useAudioStreaming({
    stream: mediaStream,
    interviewID,
    onAudioPacket: handleAudioPacket,
    isActive: isCallActive && readyState === ReadyState.OPEN && !isAiSpeaking,
  });

  useEffect(() => {
    if (packetsSent > packetsSentRef.current) {
      setIsAwaitingAiResponse(true);
    }
    packetsSentRef.current = packetsSent;
  }, [packetsSent]);

  useEffect(() => {
    if (isAiSpeaking) {
      setIsAwaitingAiResponse(false);
    }
  }, [isAiSpeaking]);

  useEffect(() => {
    if (!isCallActive) {
      setIsAwaitingAiResponse(false);
    }
  }, [isCallActive]);

  const avatarStatusText =
    effectiveAvatarMode === '3d'
      ? t('recruiter.status.interactive')
      : (avatarRuntimeFallbackReason ??
        capabilityFallbackReason ??
        t('recruiter.status.static'));

  return (
    <div className="p-6 h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          {(title ?? t('simulations.title')) ? (
            <h1 className="text-2xl font-bold text-text">
              {title ?? t('simulations.title')}
            </h1>
          ) : null}
          <p className="text-text-weak">
            {description ?? t('simulations.description')}
          </p>
          {contextLabel ? (
            <p className="mt-2 text-sm text-idle">
              {t('simulations.interviewContext', { label: contextLabel })}
            </p>
          ) : null}
        </div>
      </div>

      {isQueued && (
        <div className="mb-4">
          <SimulationQueueBanner
            queuePosition={queuePosition}
            estimatedWaitSec={estimatedWaitSec}
          />
        </div>
      )}

      <div className="grid grid-cols-[1fr_20rem] gap-6">
        <div>
          <SimulationVideoArea
            isAiSpeaking={isAiSpeaking}
            isAwaitingAiResponse={isAwaitingAiResponse}
            speechTurn={speechTurn}
            avatarUrl={avatarUrl}
            avatarMode={effectiveAvatarMode}
            avatarFallbackReason={
              avatarRuntimeFallbackReason ?? capabilityFallbackReason
            }
            onAvatarFallbackRequest={handleAvatarFallbackRequest}
            onStreamToggle={handleStreamToggle}
            onStreamChange={setMediaStream}
            onToggleRef={(toggleFn) => {
              videoStreamToggleRef.current = toggleFn;
            }}
          />
          <SimulationTranscriptionArea transcriptions={transcriptions} />
        </div>

        <div className="space-y-6">
          {import.meta.env.VITE_SHOW_WS_DEBUG === 'true' && (
            <WebSocketDebugPanel
              inputUrl={inputUrl}
              readyState={readyState}
              isCallActive={isCallActive}
              sendMessage={sendMessage}
              sendJsonMessage={sendJsonMessage}
              sendPing={sendPing}
              lastMessage={lastMessage}
              lastJsonMessage={lastJsonMessage}
              isListening={isListening}
              isSpeaking={isSpeaking}
              isRecording={isRecording}
              packetsSent={packetsSent}
              supportedMimeType={supportedMimeType}
              audioError={audioError}
              wsError={wsError}
              connectionAttempts={connectionAttempts}
            />
          )}

          <InfoBox
            title={RECRUITER_DISPLAY_NAME}
            text={`${t(RECRUITER_DISPLAY_ROLE_KEY)}. ${avatarStatusText}`}
            icon="members"
          />

          <VerbalAnalysisPanel analysis={analysis} />
        </div>
      </div>
      <NotesEditor interviewID={interviewID} />
    </div>
  );
}

import InfoBox from '@/components/molecules/info-box';
import NotesEditor from '@/components/molecules/notes-editor/notes-editor';
import SimulationQueueBanner from '@/components/molecules/simulation-queue-banner';
import SimulationTranscriptionArea from '@/components/organisms/simulation-transcription-area';
import { TranscriptionProps } from '@/components/organisms/simulation-transcription-area/types';
import SimulationVideoArea from '@/components/organisms/simulation-video-area';
import VerbalAnalysisPanel from '@/components/organisms/verbal-analysis-panel';
import { WebSocketDebugPanel } from '@/components/organisms/websocket-debug-panel';
import {
  WebSocketPacket,
  useAudioPlayback,
  useAudioStreaming,
  useInterviewSession,
  useSimulationWebSocket,
  useVerbalAnalysis,
} from '@/hooks/simulation';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  title = 'Simulations',
  description = 'Practice interview scenarios in a safe environment.',
  contextLabel,
}: SimulationWorkspaceProps) {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const videoStreamToggleRef = useRef<(() => void) | null>(null);
  const connectRef = useRef<(url?: string) => void>(() => {});
  const disconnectRef = useRef<(code?: number, reason?: string) => void>(
    () => {},
  );
  const sendJsonMessageRef = useRef<(message: object) => void>(() => {});
  const readyStateRef = useRef(ReadyState.CONNECTING);
  const interviewIDRef = useRef<string | null>(null);

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
      sendPing();
    },
    onClose: (event) => {
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

  const handleAudioPacket = useCallback((packet: WebSocketPacket) => {
    if (readyStateRef.current === ReadyState.OPEN) {
      sendJsonMessageRef.current(packet);
    }
  }, []);

  const { isAiSpeaking, transcript } = useAudioPlayback({
    message: lastJsonMessage,
  });

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
  }, [interviewID]);

  useEffect(() => {
    if (!transcript) return;
    const turns: TranscriptionProps[] = [];
    if (transcript.transcription) {
      turns.push({
        isIA: false,
        speaker: 'You',
        text: transcript.transcription,
      });
    }
    if (transcript.response) {
      turns.push({ isIA: true, speaker: 'AI', text: transcript.response });
    }
    if (turns.length > 0) {
      setTranscriptions((prev) => [...prev, ...turns]);
    }
  }, [transcript]);

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

  return (
    <div className="p-6 h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{title}</h1>
          <p className="text-text-weak">{description}</p>
          {contextLabel ? (
            <p className="mt-2 text-sm text-idle">
              Interview context: {contextLabel}
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
            onStreamToggle={handleStreamToggle}
            onStreamChange={setMediaStream}
            onToggleRef={(toggleFn) => {
              videoStreamToggleRef.current = toggleFn;
            }}
          />
          <SimulationTranscriptionArea transcriptions={transcriptions} />
        </div>

        <div className="space-y-6">
          {import.meta.env.DEV && (
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
            title="Statistics Overview"
            text="Real-time statistics will appear here."
            icon="notifications"
          />

          <VerbalAnalysisPanel analysis={analysis} />

          <img src="/avatarworking.png" alt="Avatar Working" />
        </div>
      </div>
      <NotesEditor interviewID={interviewID} />
    </div>
  );
}

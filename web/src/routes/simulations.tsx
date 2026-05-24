import InfoBox from '@/components/molecules/info-box';
import NotesEditor from '@/components/molecules/notes-editor/notes-editor';
import SimulationTranscriptionArea from '@/components/organisms/simulation-transcription-area';
import { TranscriptionProps } from '@/components/organisms/simulation-transcription-area/types';
import SimulationVideoArea from '@/components/organisms/simulation-video-area';
import { WebSocketDebugPanel } from '@/components/organisms/websocket-debug-panel';
import {
  WebSocketPacket,
  useAudioStreaming,
  useInterviewSession,
  useSimulationWebSocket,
} from '@/hooks/simulation';
import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ReadyState } from 'react-use-websocket';

export const Route = createFileRoute('/simulations')({
  beforeLoad: createAuthGuard('/simulations'),
  component: Simulations,
});

function Simulations() {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [interviewID, setInterviewID] = useState<string | null>(null);
  const videoStreamToggleRef = useRef<(() => void) | null>(null);

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

  const handleResumeStream = useCallback(() => {
    if (videoStreamToggleRef.current) {
      videoStreamToggleRef.current();
    }
  }, []);

  const {
    isCallActive,
    inputUrl,
    interviewID: sessionInterviewID,
    handleStreamToggle,
  } = useInterviewSession({
    onConnect: connect,
    onDisconnect: disconnect,
    onResumeStream: handleResumeStream,
  });

  useEffect(() => {
    setInterviewID(sessionInterviewID);
  }, [sessionInterviewID]);

  const sendJsonMessageRef = useRef(sendJsonMessage);
  const readyStateRef = useRef(readyState);

  useEffect(() => {
    sendJsonMessageRef.current = sendJsonMessage;
    readyStateRef.current = readyState;
  }, [sendJsonMessage, readyState]);

  const handleAudioPacket = useCallback((packet: WebSocketPacket) => {
    if (readyStateRef.current === ReadyState.OPEN) {
      sendJsonMessageRef.current(packet);
    }
  }, []);

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
    isActive: isCallActive && readyState === ReadyState.OPEN,
  });

  const staticTranscriptions: TranscriptionProps[] = [
    {
      isIA: true,
      speaker: 'AI',
      text: "Hello, thank you for joining me. Let's start the interview.",
    },
    {
      isIA: false,
      speaker: 'You',
      text: "Hello, I'm delighted to be here. I look forward to discussing how my experience can benefit your team.",
    },
    {
      isIA: true,
      speaker: 'AI',
      text: 'Excellent. Can you tell me about a recent project where you faced a particularly difficult technical challenge, and how you overcame it?',
    },
  ];

  return (
    <div className="p-6 h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Simulations</h1>
          <p className="text-gray-600">
            Simulations let you practice interview scenarios in a safe
            environment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_20rem] gap-6">
        <div>
          <SimulationVideoArea
            onStreamToggle={handleStreamToggle}
            onStreamChange={setMediaStream}
            onToggleRef={(toggleFn) => {
              videoStreamToggleRef.current = toggleFn;
            }}
          />
          <SimulationTranscriptionArea transcriptions={staticTranscriptions} />
        </div>

        <div className="space-y-6">
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

          <InfoBox
            title="Statistics Overview"
            text="Real-time statistics will appear here."
            icon="notifications"
          />

          <InfoBox
            title="Real time advice"
            text="Remember to keep your hands above the table"
            icon="check"
          />

          <img src="/avatarworking.png" alt="Avatar Working" />
        </div>
      </div>
      <NotesEditor />
    </div>
  );
}

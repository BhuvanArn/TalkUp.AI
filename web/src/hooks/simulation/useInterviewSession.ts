import {
  cancelInterview,
  createInterview,
  getInterviewSession,
  heartbeatInterview,
  updateInterview,
} from '@/services/ai/http';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const STORAGE_KEYS = {
  INTERVIEW_ID: 'currentInterviewID',
  INTERVIEW_URL: 'currentInterviewURL',
  IS_STREAMING: 'isInterviewStreaming',
} as const;

const WEBSOCKET_CLOSE_CODE_NORMAL = 1000;
const STREAM_RESUME_DELAY_MS = 100;
const QUEUE_POLL_INTERVAL_MS = 3000;
const QUEUE_POLL_MAX_MS = 20 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 60 * 1000;

/**
 * Props for the useInterviewSession hook.
 */
export interface UseInterviewSessionProps {
  /** Callback to connect to WebSocket with the given URL */
  onConnect: (url: string) => void;
  /** Callback to disconnect from WebSocket */
  onDisconnect: (code: number, reason: string) => void;
  /** Optional callback to resume video streaming after page refresh */
  onResumeStream?: () => void;
}

/**
 * Return value from the useInterviewSession hook.
 */
export interface UseInterviewSessionReturn {
  /** Whether an interview call is currently active */
  isCallActive: boolean;
  /** Whether the user is waiting in the simulation queue */
  isQueued: boolean;
  /** Queue position when isQueued (1-based) */
  queuePosition: number;
  /** Estimated wait in seconds when queued */
  estimatedWaitSec?: number;
  /** WebSocket URL for the current interview session */
  inputUrl: string;
  /** ID of the current interview session, if any */
  interviewID: string | null;
  /** Function to toggle interview streaming on/off */
  handleStreamToggle: (streaming: boolean) => Promise<void>;
}

async function waitForReadyEntrypoint(
  interviewId: string,
  signal: AbortSignal,
): Promise<string> {
  const started = Date.now();

  while (Date.now() - started < QUEUE_POLL_MAX_MS) {
    if (signal.aborted) {
      throw new Error('Queue wait aborted');
    }

    const session = await getInterviewSession(interviewId);
    if (session.sessionStatus === 'ready' && session.entrypoint) {
      return session.entrypoint;
    }
    if (session.sessionStatus === 'ended') {
      throw new Error('Simulation session ended before start');
    }

    await new Promise((resolve) => setTimeout(resolve, QUEUE_POLL_INTERVAL_MS));
  }

  throw new Error('Queue wait timed out');
}

/**
 * Custom hook to manage AI interview session lifecycle.
 */
export function useInterviewSession({
  onConnect,
  onDisconnect,
  onResumeStream,
}: UseInterviewSessionProps): UseInterviewSessionReturn {
  const [inputUrl, setInputUrl] = useState('');
  const [interviewID, setInterviewID] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isQueued, setIsQueued] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [estimatedWaitSec, setEstimatedWaitSec] = useState<number | undefined>();
  const processingRef = useRef(false);
  const hasResumedRef = useRef(false);
  const queueAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (hasResumedRef.current) return;
    hasResumedRef.current = true;

    const savedInterviewID = localStorage.getItem(STORAGE_KEYS.INTERVIEW_ID);
    const savedInterviewURL = localStorage.getItem(STORAGE_KEYS.INTERVIEW_URL);
    const wasStreaming =
      localStorage.getItem(STORAGE_KEYS.IS_STREAMING) === 'true';

    if (savedInterviewID && savedInterviewURL) {
      setInputUrl(savedInterviewURL);
      setInterviewID(savedInterviewID);
      setIsCallActive(true);
      onConnect(savedInterviewURL);

      if (wasStreaming && onResumeStream) {
        setTimeout(() => {
          onResumeStream();
        }, STREAM_RESUME_DELAY_MS);
      }

      toast.success('Resumed your interview session');
    }
  }, [onConnect, onResumeStream]);

  useEffect(() => {
    return () => {
      queueAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isCallActive || !interviewID) {
      return;
    }

    const sendHeartbeat = () => {
      heartbeatInterview(interviewID).catch((error) => {
        console.warn('Simulation heartbeat failed:', error);
      });
    };

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isCallActive, interviewID]);

  const handleStreamToggle = useCallback(
    async (streaming: boolean) => {
      if (processingRef.current) return;
      processingRef.current = true;

      if (streaming) {
        try {
          const created = await createInterview({
            type: 'technical',
            language: 'French',
          });

          setInterviewID(created.interviewID);
          localStorage.setItem(STORAGE_KEYS.INTERVIEW_ID, created.interviewID);

          let entrypoint = created.entrypoint ?? null;

          if (created.status === 'queued') {
            setIsQueued(true);
            setQueuePosition(created.queuePosition);
            setEstimatedWaitSec(created.estimatedWaitSec);
            toast.loading('En file d\'attente…', { id: 'sim-queue' });

            queueAbortRef.current?.abort();
            queueAbortRef.current = new AbortController();

            entrypoint = await waitForReadyEntrypoint(
              created.interviewID,
              queueAbortRef.current.signal,
            );

            toast.dismiss('sim-queue');
            setIsQueued(false);
            setQueuePosition(0);
            toast.success('C\'est votre tour — démarrage de la simulation');
          }

          if (!entrypoint) {
            throw new Error('No WebSocket entrypoint returned');
          }

          localStorage.setItem(STORAGE_KEYS.INTERVIEW_URL, entrypoint);
          localStorage.setItem(STORAGE_KEYS.IS_STREAMING, 'true');
          setInputUrl(entrypoint);
          setIsCallActive(true);
          onConnect(entrypoint);

          await updateInterview(created.interviewID, { status: 'in_progress' });
        } catch (error) {
          console.error('Failed to start interview:', error);
          toast.dismiss('sim-queue');
          setIsQueued(false);
          const interviewId = localStorage.getItem(STORAGE_KEYS.INTERVIEW_ID);
          if (interviewId) {
            try {
              await cancelInterview(interviewId);
            } catch {
              /* ignore cleanup errors */
            }
          }
          localStorage.removeItem(STORAGE_KEYS.INTERVIEW_ID);
          localStorage.removeItem(STORAGE_KEYS.INTERVIEW_URL);
          localStorage.removeItem(STORAGE_KEYS.IS_STREAMING);
          toast.error('Failed to start interview. Please try again.');
        } finally {
          processingRef.current = false;
        }
      } else {
        const interviewId = localStorage.getItem(STORAGE_KEYS.INTERVIEW_ID);
        queueAbortRef.current?.abort();

        try {
          onDisconnect(WEBSOCKET_CLOSE_CODE_NORMAL, 'Call ended');
        } catch (error) {
          console.error('Failed to disconnect WebSocket:', error);
        }

        if (interviewId) {
          try {
            await updateInterview(interviewId, { status: 'completed' });
            localStorage.removeItem(STORAGE_KEYS.INTERVIEW_ID);
            localStorage.removeItem(STORAGE_KEYS.INTERVIEW_URL);
            localStorage.removeItem(STORAGE_KEYS.IS_STREAMING);
          } catch (error) {
            console.error('Failed to update interview status:', error);
          }
        }

        setIsCallActive(false);
        setIsQueued(false);
        setInputUrl('');
        setInterviewID(null);
        processingRef.current = false;
      }
    },
    [onConnect, onDisconnect],
  );

  return {
    isCallActive,
    isQueued,
    queuePosition,
    estimatedWaitSec,
    inputUrl,
    interviewID,
    handleStreamToggle,
  };
}

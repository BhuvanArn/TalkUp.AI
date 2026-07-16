import {
  cancelInterview,
  createInterview,
  getInterviewSession,
  heartbeatInterview,
  updateInterview,
} from '@/services/ai/http';
import axios from 'axios';
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

function clearInterviewStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.INTERVIEW_ID);
  localStorage.removeItem(STORAGE_KEYS.INTERVIEW_URL);
  localStorage.removeItem(STORAGE_KEYS.IS_STREAMING);
}

function isTerminalSessionRestoreError(error: unknown): boolean {
  if (error instanceof Error) {
    if (error.message === 'Simulation session ended before start') {
      return true;
    }
    if (
      error.message === 'Queue wait aborted' ||
      error.message === 'Queue wait timed out'
    ) {
      return false;
    }
  }

  return (
    axios.isAxiosError(error) &&
    (error.response?.status === 404 || error.response?.status === 403)
  );
}

/**
 * Props for the useInterviewSession hook.
 */
export interface UseInterviewSessionProps {
  /** Application whose CV and job offer are sent to the AI at session init. */
  applicationId?: string;
  /** Callback to connect to WebSocket with the given URL */
  onConnect: (url: string) => void;
  /** Callback to disconnect from WebSocket */
  onDisconnect: (code: number, reason: string) => void;
  /** Optional callback before disconnect (e.g. send session_end) */
  onBeforeDisconnect?: () => void;
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

/** Live queue progress reported on every poll while waiting. */
interface QueueProgress {
  queuePosition: number;
  estimatedWaitSec?: number;
}

async function waitForReadyEntrypoint(
  interviewId: string,
  signal: AbortSignal,
  onProgress?: (progress: QueueProgress) => void,
): Promise<string> {
  const started = Date.now();

  while (Date.now() - started < QUEUE_POLL_MAX_MS) {
    if (signal.aborted) {
      throw new Error('Queue wait aborted');
    }

    try {
      const session = await getInterviewSession(interviewId);
      if (session.sessionStatus === 'ready' && session.entrypoint) {
        return session.entrypoint;
      }
      if (session.sessionStatus === 'ended') {
        throw new Error('Simulation session ended before start');
      }

      // Surface the fresh position/wait so the queue banner counts down instead
      // of showing the stale value captured at enqueue time.
      onProgress?.({
        queuePosition: session.queuePosition,
        estimatedWaitSec: session.estimatedWaitSec,
      });
    } catch (error) {
      if (isTerminalSessionRestoreError(error)) {
        throw error;
      }
      console.warn('Transient queue poll failure, retrying:', error);
    }

    await new Promise((resolve) => setTimeout(resolve, QUEUE_POLL_INTERVAL_MS));
  }

  throw new Error('Queue wait timed out');
}

/**
 * Custom hook to manage AI interview session lifecycle.
 */
export function useInterviewSession({
  applicationId,
  onConnect,
  onDisconnect,
  onBeforeDisconnect,
  onResumeStream,
}: UseInterviewSessionProps): UseInterviewSessionReturn {
  const [inputUrl, setInputUrl] = useState('');
  const [interviewID, setInterviewID] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isQueued, setIsQueued] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [estimatedWaitSec, setEstimatedWaitSec] = useState<
    number | undefined
  >();
  const processingRef = useRef(false);
  const hasResumedRef = useRef(false);
  const queueAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (hasResumedRef.current) return;
    hasResumedRef.current = true;

    const restoreSavedSession = async () => {
      const savedInterviewID = localStorage.getItem(STORAGE_KEYS.INTERVIEW_ID);
      const savedInterviewURL = localStorage.getItem(
        STORAGE_KEYS.INTERVIEW_URL,
      );
      const wasStreaming =
        localStorage.getItem(STORAGE_KEYS.IS_STREAMING) === 'true';

      if (!savedInterviewID) return;

      try {
        const session = await getInterviewSession(savedInterviewID);

        if (session.sessionStatus === 'ended') {
          clearInterviewStorage();
          return;
        }

        if (session.sessionStatus === 'queued') {
          setInterviewID(savedInterviewID);
          setIsQueued(true);
          setQueuePosition(session.queuePosition);
          setEstimatedWaitSec(session.estimatedWaitSec);
          toast.loading("Reprise de la file d'attente…", { id: 'sim-queue' });

          queueAbortRef.current?.abort();
          queueAbortRef.current = new AbortController();

          const entrypoint = await waitForReadyEntrypoint(
            savedInterviewID,
            queueAbortRef.current.signal,
            ({ queuePosition, estimatedWaitSec }) => {
              setQueuePosition(queuePosition);
              setEstimatedWaitSec(estimatedWaitSec);
            },
          );

          toast.dismiss('sim-queue');
          setIsQueued(false);
          setQueuePosition(0);
          localStorage.setItem(STORAGE_KEYS.INTERVIEW_URL, entrypoint);
          setInputUrl(entrypoint);
          setInterviewID(savedInterviewID);
          onConnect(entrypoint);
          setIsCallActive(true);
          toast.success('Simulation reprise');
          return;
        }

        const entrypoint = session.entrypoint ?? savedInterviewURL;
        if (!entrypoint) {
          await cancelInterview(savedInterviewID);
          clearInterviewStorage();
          return;
        }

        localStorage.setItem(STORAGE_KEYS.INTERVIEW_URL, entrypoint);
        setInputUrl(entrypoint);
        setInterviewID(savedInterviewID);
        onConnect(entrypoint);
        setIsCallActive(true);

        if (wasStreaming && onResumeStream) {
          setTimeout(() => {
            onResumeStream();
          }, STREAM_RESUME_DELAY_MS);
        }

        toast.success('Simulation reprise');
      } catch (error) {
        console.warn('Failed to restore simulation session:', error);

        if (isTerminalSessionRestoreError(error)) {
          try {
            await cancelInterview(savedInterviewID);
          } catch {
            /* ignore cleanup errors */
          }
          clearInterviewStorage();
          toast.error(
            'La session précédente a expiré. Vous pouvez démarrer un nouvel entretien.',
          );
          return;
        }

        toast.error(
          'Impossible de reprendre la simulation pour le moment. Rechargez la page pour réessayer.',
        );
        toast.dismiss('sim-queue');
        setIsCallActive(false);
        setIsQueued(false);
        setQueuePosition(0);
        setEstimatedWaitSec(undefined);
        setInterviewID(null);
        setInputUrl('');
      }
    };

    void restoreSavedSession();
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
          const staleInterviewId = localStorage.getItem(
            STORAGE_KEYS.INTERVIEW_ID,
          );
          if (staleInterviewId) {
            onBeforeDisconnect?.();
            onDisconnect(
              WEBSOCKET_CLOSE_CODE_NORMAL,
              'Replacing stale session',
            );
            try {
              await cancelInterview(staleInterviewId);
            } catch {
              /* slot may already be released */
            }
            clearInterviewStorage();
            setIsCallActive(false);
            setInputUrl('');
            setInterviewID(null);
          }

          const created = await createInterview({
            type: 'technical',
            language: 'French',
            ...(applicationId ? { applicationId } : {}),
          });

          setInterviewID(created.interviewID);
          localStorage.setItem(STORAGE_KEYS.INTERVIEW_ID, created.interviewID);

          let entrypoint = created.entrypoint ?? null;

          if (created.status === 'queued') {
            setIsQueued(true);
            setQueuePosition(created.queuePosition);
            setEstimatedWaitSec(created.estimatedWaitSec);
            toast.loading("En file d'attente…", { id: 'sim-queue' });

            queueAbortRef.current?.abort();
            queueAbortRef.current = new AbortController();

            entrypoint = await waitForReadyEntrypoint(
              created.interviewID,
              queueAbortRef.current.signal,
              ({ queuePosition, estimatedWaitSec }) => {
                setQueuePosition(queuePosition);
                setEstimatedWaitSec(estimatedWaitSec);
              },
            );

            toast.dismiss('sim-queue');
            setIsQueued(false);
            setQueuePosition(0);
            toast.success("C'est votre tour — démarrage de la simulation");
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
          onBeforeDisconnect?.();
          onDisconnect(WEBSOCKET_CLOSE_CODE_NORMAL, 'Call ended');
        } catch (error) {
          console.error('Failed to disconnect WebSocket:', error);
        }

        if (interviewId) {
          try {
            await updateInterview(interviewId, { status: 'completed' });
            clearInterviewStorage();
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
    [applicationId, onConnect, onDisconnect, onBeforeDisconnect],
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

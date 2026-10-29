import {
  cancelInterview,
  createInterview,
  getInterviewSession,
  heartbeatInterview,
  updateInterview,
} from '@/services/ai/http';
import { safeLocalStorage } from '@/utils/safeStorage';
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

// With storage blocked, the simulation still works; it just cannot be resumed
// after a reload.
function clearInterviewStorage(): void {
  safeLocalStorage.removeItem(STORAGE_KEYS.INTERVIEW_ID);
  safeLocalStorage.removeItem(STORAGE_KEYS.INTERVIEW_URL);
  safeLocalStorage.removeItem(STORAGE_KEYS.IS_STREAMING);
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
      // "End call" may land while the poll is in flight: never hand out a
      // slot after that.
      if (signal.aborted) {
        throw new Error('Queue wait aborted');
      }
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
      if (signal.aborted || isTerminalSessionRestoreError(error)) {
        throw error;
      }
      console.warn('Transient queue poll failure, retrying:', error);
    }

    // Wakes up early on abort, so leaving the queue takes effect at once.
    await new Promise<void>((resolve) => {
      const wake = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', wake);
        resolve();
      };
      const timer = setTimeout(wake, QUEUE_POLL_INTERVAL_MS);
      signal.addEventListener('abort', wake);
    });
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
  /** Set while a start runs; aborted by "End call" or unmount. */
  const startAbortRef = useRef<AbortController | null>(null);
  /** A start requested while the lock was held, run once it is released. */
  const pendingStartRef = useRef(false);
  const sessionActiveRef = useRef(false);
  sessionActiveRef.current = isCallActive || isQueued;

  useEffect(() => {
    if (hasResumedRef.current) return;
    hasResumedRef.current = true;

    let restoreQueueAbort: AbortController | null = null;

    const restoreSavedSession = async () => {
      const savedInterviewID = safeLocalStorage.getItem(
        STORAGE_KEYS.INTERVIEW_ID,
      );
      const savedInterviewURL = safeLocalStorage.getItem(
        STORAGE_KEYS.INTERVIEW_URL,
      );
      const wasStreaming =
        safeLocalStorage.getItem(STORAGE_KEYS.IS_STREAMING) === 'true';

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
          restoreQueueAbort = new AbortController();
          queueAbortRef.current = restoreQueueAbort;

          const entrypoint = await waitForReadyEntrypoint(
            savedInterviewID,
            restoreQueueAbort.signal,
            ({ queuePosition, estimatedWaitSec }) => {
              setQueuePosition(queuePosition);
              setEstimatedWaitSec(estimatedWaitSec);
            },
          );

          toast.dismiss('sim-queue');
          setIsQueued(false);
          setQueuePosition(0);
          safeLocalStorage.setItem(STORAGE_KEYS.INTERVIEW_URL, entrypoint);
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

        safeLocalStorage.setItem(STORAGE_KEYS.INTERVIEW_URL, entrypoint);
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
        // Left on purpose ("End call" or unmount): the stop path cleans up.
        if (restoreQueueAbort?.signal.aborted) return;
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
      startAbortRef.current?.abort();
      // A stop still in flight must not replay a start after unmount.
      pendingStartRef.current = false;
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

  const handleStreamToggleRef = useRef<
    ((streaming: boolean) => Promise<void>) | null
  >(null);

  /** Runs a start that arrived while the lock was held. */
  const runPendingStart = useCallback(() => {
    if (!pendingStartRef.current) return;
    pendingStartRef.current = false;
    void handleStreamToggleRef.current?.(true);
  }, []);

  /** Ends a restored queue wait that a stop or a new start supersedes. */
  const clearQueueState = useCallback(() => {
    queueAbortRef.current?.abort();
    toast.dismiss('sim-queue');
    setIsQueued(false);
    setQueuePosition(0);
    setEstimatedWaitSec(undefined);
  }, []);

  const handleStreamToggle = useCallback(
    async (streaming: boolean) => {
      if (processingRef.current) {
        const start = startAbortRef.current;
        if (!streaming) {
          // A start can hold the lock for up to 20 minutes in the queue:
          // "End call" aborts it, and the start branch cleans up.
          pendingStartRef.current = false;
          start?.abort();
        } else if (!start || start.signal.aborted) {
          // Start clicked while a stop (or an aborted start) finishes.
          pendingStartRef.current = true;
        }
        return;
      }
      if (!streaming && !sessionActiveRef.current) {
        // Nothing to stop. SimulationVideoArea also reports `false` on mount,
        // before the restore effect: ending the saved interview here would
        // defeat the resume.
        return;
      }
      processingRef.current = true;

      if (streaming) {
        const startAbort = new AbortController();
        startAbortRef.current = startAbort;
        const throwIfStopped = () => {
          if (startAbort.signal.aborted) throw new Error('Start aborted');
        };
        let createdId: string | null = null;
        let connected = false;
        try {
          // A new start supersedes a restored queue wait.
          clearQueueState();

          const staleInterviewId = safeLocalStorage.getItem(
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
            throwIfStopped();
          }

          const created = await createInterview({
            type: 'technical',
            language: 'French',
            ...(applicationId ? { applicationId } : {}),
          });
          createdId = created.interviewID;
          throwIfStopped();

          setInterviewID(created.interviewID);
          safeLocalStorage.setItem(
            STORAGE_KEYS.INTERVIEW_ID,
            created.interviewID,
          );

          let entrypoint = created.entrypoint ?? null;

          if (created.status === 'queued') {
            setIsQueued(true);
            setQueuePosition(created.queuePosition);
            setEstimatedWaitSec(created.estimatedWaitSec);
            toast.loading("En file d'attente…", { id: 'sim-queue' });

            entrypoint = await waitForReadyEntrypoint(
              created.interviewID,
              startAbort.signal,
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

          safeLocalStorage.setItem(STORAGE_KEYS.INTERVIEW_URL, entrypoint);
          safeLocalStorage.setItem(STORAGE_KEYS.IS_STREAMING, 'true');
          setInputUrl(entrypoint);
          setIsCallActive(true);
          onConnect(entrypoint);
          connected = true;

          await updateInterview(created.interviewID, { status: 'in_progress' });
          throwIfStopped();
        } catch (error) {
          // Stopped on purpose ("End call" or unmount): no error to report.
          const stopped = startAbort.signal.aborted;
          if (!stopped) console.error('Failed to start interview:', error);
          toast.dismiss('sim-queue');
          setIsQueued(false);
          setQueuePosition(0);
          if (connected) {
            try {
              onBeforeDisconnect?.();
              onDisconnect(
                WEBSOCKET_CLOSE_CODE_NORMAL,
                stopped ? 'Call ended' : 'Start failed',
              );
            } catch (disconnectError) {
              console.error('Failed to disconnect WebSocket:', disconnectError);
            }
          }
          // Reset before the cancel round-trip, so heartbeats stop at once.
          setIsCallActive(false);
          setInputUrl('');
          setInterviewID(null);
          // Cancel the interview this start created, not whatever the shared
          // storage holds now (another tab may have written it).
          if (createdId) {
            try {
              // Ended by the user once connected: a normal end, not a cancel.
              if (stopped && connected) {
                await updateInterview(createdId, { status: 'completed' });
              } else {
                await cancelInterview(createdId);
              }
            } catch {
              /* ignore cleanup errors */
            }
            if (
              safeLocalStorage.getItem(STORAGE_KEYS.INTERVIEW_ID) === createdId
            ) {
              clearInterviewStorage();
            }
          }
          if (!stopped) {
            toast.error('Failed to start interview. Please try again.');
          }
        } finally {
          startAbortRef.current = null;
          processingRef.current = false;
          runPendingStart();
        }
      } else {
        // `finally`: a lock left set makes every later start a silent no-op.
        try {
          const interviewId = safeLocalStorage.getItem(
            STORAGE_KEYS.INTERVIEW_ID,
          );
          clearQueueState();

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
          setInputUrl('');
          setInterviewID(null);
        } finally {
          processingRef.current = false;
          runPendingStart();
        }
      }
    },
    [
      applicationId,
      onConnect,
      onDisconnect,
      onBeforeDisconnect,
      runPendingStart,
      clearQueueState,
    ],
  );
  handleStreamToggleRef.current = handleStreamToggle;

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

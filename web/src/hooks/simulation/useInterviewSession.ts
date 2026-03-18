import { createInterview, updateInterview } from '@/services/ai/http';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const STORAGE_KEYS = {
  INTERVIEW_ID: 'currentInterviewID',
  INTERVIEW_URL: 'currentInterviewURL',
  IS_STREAMING: 'isInterviewStreaming',
} as const;

const WEBSOCKET_CLOSE_CODE_NORMAL = 1000;
const STREAM_RESUME_DELAY_MS = 100;

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
  /** WebSocket URL for the current interview session */
  inputUrl: string;
  /** ID of the current interview session, if any */
  interviewID: string | null;
  /** Function to toggle interview streaming on/off */
  handleStreamToggle: (streaming: boolean) => Promise<void>;
}

/**
 * Custom hook to manage AI interview session lifecycle.
 *
 * Features:
 * - Creates new interview sessions via API
 * - Manages WebSocket connection lifecycle
 * - Persists session state to localStorage
 * - Auto-resumes interrupted sessions after page refresh
 * - Updates interview status on completion
 *
 * @param props - Configuration for interview session management
 * @returns Interview session state and control functions
 *
 * @example
 * ```tsx
 * const { isCallActive, inputUrl, handleStreamToggle } = useInterviewSession({
 *   onConnect: (url) => websocket.connect(url),
 *   onDisconnect: (code, reason) => websocket.disconnect(code, reason),
 *   onResumeStream: () => videoStream.start(),
 * });
 * ```
 */
export function useInterviewSession({
  onConnect,
  onDisconnect,
  onResumeStream,
}: UseInterviewSessionProps): UseInterviewSessionReturn {
  const [inputUrl, setInputUrl] = useState('');
  const [interviewID, setInterviewID] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const processingRef = useRef(false);
  const hasResumedRef = useRef(false);

  useEffect(() => {
    if (hasResumedRef.current) return;
    hasResumedRef.current = true;

    const savedInterviewID = localStorage.getItem(STORAGE_KEYS.INTERVIEW_ID);
    const savedInterviewURL = localStorage.getItem(STORAGE_KEYS.INTERVIEW_URL);
    const wasStreaming =
      localStorage.getItem(STORAGE_KEYS.IS_STREAMING) === 'true';

    if (savedInterviewID && savedInterviewURL) {
      console.log('Resuming interrupted interview:', savedInterviewID);
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

  const handleStreamToggle = useCallback(
    async (streaming: boolean) => {
      if (processingRef.current) return;
      processingRef.current = true;

      if (streaming) {
        try {
          const { entrypoint, interviewID } = await createInterview({
            type: 'technical',
            language: 'English',
          });
          setInterviewID(interviewID);
          localStorage.setItem(STORAGE_KEYS.INTERVIEW_ID, interviewID);
          localStorage.setItem(STORAGE_KEYS.INTERVIEW_URL, entrypoint);
          localStorage.setItem(STORAGE_KEYS.IS_STREAMING, 'true');
          setInputUrl(entrypoint);
          setIsCallActive(true);
          onConnect(entrypoint);
        } catch (error) {
          console.error('Failed to start interview:', error);
          toast.error('Failed to start interview. Please try again.');
        } finally {
          processingRef.current = false;
        }
      } else {
        const interviewID = localStorage.getItem(STORAGE_KEYS.INTERVIEW_ID);

        try {
          onDisconnect(WEBSOCKET_CLOSE_CODE_NORMAL, 'Call ended');
        } catch (error) {
          console.error('Failed to disconnect WebSocket:', error);
        }

        if (interviewID) {
          try {
            await updateInterview(interviewID, { status: 'completed' });
            localStorage.removeItem(STORAGE_KEYS.INTERVIEW_ID);
            localStorage.removeItem(STORAGE_KEYS.INTERVIEW_URL);
            localStorage.removeItem(STORAGE_KEYS.IS_STREAMING);
          } catch (error) {
            console.error('Failed to update interview status:', error);
          }
        }

        processingRef.current = false;
      }
    },
    [onConnect, onDisconnect],
  );

  return {
    isCallActive,
    inputUrl,
    interviewID,
    handleStreamToggle,
  };
}

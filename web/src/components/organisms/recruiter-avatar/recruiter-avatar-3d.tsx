import {
  RECRUITER_AVATAR_SHOW_OPTIONS,
  RECRUITER_DISPLAY_NAME,
  RECRUITER_DISPLAY_ROLE,
} from '@/config/recruiter-avatar';
import type { AiSpeechTurn } from '@/hooks/simulation/useAudioPlayback';
import { buildWordTimings, decodeAudioChunks } from '@/utils/aiSpeechPayload';
import { TalkingHead } from '@met4citizen/talkinghead';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  AVATAR_LOAD_TIMEOUT_MS,
  fetchAvatarBlob,
  waitForElementSize,
  withTimeout,
} from './avatar-loader';
import RecruiterAvatarBackdrop from './recruiter-avatar-backdrop';
import type { RecruiterAvatar3DProps } from './types';

type InitState = 'idle' | 'loading' | 'ready' | 'error';

function applyCanvasStyles(container: HTMLElement) {
  const canvas = container.querySelector('canvas');
  if (!canvas) return;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.pointerEvents = 'none';
}

function ensureRendererRunning(head: TalkingHead, container: HTMLElement) {
  head.renderer.setClearColor(0x000000, 0);
  applyCanvasStyles(container);
  head.onResize();
  head.setView('upper');

  if (!head.isRunning) {
    head.start();
  }

  head.render();
}

/**
 * Real-time 3D recruiter avatar powered by TalkingHead (Three.js / WebGL).
 * Audio is played by useAudioPlayback — this component drives lip-sync only.
 */
export function RecruiterAvatar3D({
  active,
  avatarUrl,
  isAwaitingAiResponse,
  speechTurn,
  onLoadError,
  onContextLost,
}: RecruiterAvatar3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<TalkingHead | null>(null);
  const loadGenerationRef = useRef(0);
  const objectUrlRef = useRef<string | null>(null);
  const lastSpeechTurnIdRef = useRef<number | null>(null);
  const [initState, setInitState] = useState<InitState>('idle');
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadDetail, setLoadDetail] = useState('Initializing…');

  const callbacksRef = useRef({ onLoadError, onContextLost });

  useEffect(() => {
    callbacksRef.current = { onLoadError, onContextLost };
  }, [onLoadError, onContextLost]);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const disposeHead = useCallback(() => {
    const head = headRef.current;
    if (head) {
      try {
        head.stopSpeaking();
        head.stop();
        head.dispose();
      } catch {
        // Best-effort cleanup during unmount or context loss.
      }
      headRef.current = null;
    }
    revokeObjectUrl();
  }, [revokeObjectUrl]);

  useEffect(() => {
    if (!active) {
      disposeHead();
      setInitState('idle');
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const generation = ++loadGenerationRef.current;
    let contextLostHandler: ((event: Event) => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;

    setInitState('loading');
    setLoadProgress(0);
    setLoadDetail('Starting 3D engine…');
    disposeHead();

    const init = async () => {
      try {
        setLoadDetail('Preparing viewport…');
        await waitForElementSize(container);

        if (generation !== loadGenerationRef.current) return;

        const head = new TalkingHead(container, {
          lipsyncLang: 'fr',
          lipsyncModules: ['fr'],
          cameraView: 'upper',
          cameraRotateEnable: false,
          cameraPanEnable: false,
          cameraZoomEnable: false,
          modelFPS: 30,
          modelPixelRatio: 1,
          lightAmbientIntensity: 3,
          lightDirectIntensity: 28,
          avatarMood: 'neutral',
        });

        headRef.current = head;
        head.audioSpeechGainNode.gain.value = 0;
        applyCanvasStyles(container);
        head.onResize();

        setLoadDetail('Downloading model…');
        const blob = await withTimeout(
          fetchAvatarBlob(avatarUrl, (pct) => {
            if (generation !== loadGenerationRef.current) return;
            setLoadProgress(pct);
          }),
          AVATAR_LOAD_TIMEOUT_MS,
          'Avatar model download timed out.',
        );

        if (generation !== loadGenerationRef.current) return;

        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;

        setLoadDetail('Preparing avatar…');
        await withTimeout(
          head.showAvatar({
            url: objectUrl,
            ...RECRUITER_AVATAR_SHOW_OPTIONS,
          }),
          AVATAR_LOAD_TIMEOUT_MS,
          'Avatar model parsing timed out.',
        );

        if (generation !== loadGenerationRef.current) return;

        ensureRendererRunning(head, container);

        const canvas = container.querySelector('canvas');
        contextLostHandler = (event: Event) => {
          event.preventDefault();
          callbacksRef.current.onContextLost();
        };
        canvas?.addEventListener('webglcontextlost', contextLostHandler);

        resizeObserver = new ResizeObserver(() => {
          if (generation !== loadGenerationRef.current) return;
          head.onResize();
          head.render();
        });
        resizeObserver.observe(container);

        setLoadProgress(100);
        setLoadDetail('');
        setInitState('ready');
      } catch (error) {
        if (generation !== loadGenerationRef.current) return;
        const message =
          error instanceof Error ? error.message : 'Failed to load 3D avatar.';
        setInitState('error');
        callbacksRef.current.onLoadError(message);
        disposeHead();
      }
    };

    void init();

    return () => {
      if (generation === loadGenerationRef.current) {
        loadGenerationRef.current += 1;
      }
      resizeObserver?.disconnect();
      const canvas = container.querySelector('canvas');
      if (contextLostHandler) {
        canvas?.removeEventListener('webglcontextlost', contextLostHandler);
      }
      disposeHead();
    };
  }, [active, avatarUrl, disposeHead]);

  const playSpeechTurn = useCallback(
    async (turn: AiSpeechTurn) => {
      const head = headRef.current;
      if (!head || initState !== 'ready') return;

      try {
        if (head.audioCtx.state === 'suspended') {
          await head.audioCtx.resume();
        }

        head.stopSpeaking();

        const audioBuffer = await decodeAudioChunks(
          head.audioCtx,
          turn.audioChunks,
        );
        if (!audioBuffer) return;

        const durationMs = audioBuffer.duration * 1000;
        const { words, wtimes, wdurations } = buildWordTimings(
          turn.response,
          durationMs,
        );

        head.speakAudio(
          {
            audio: audioBuffer,
            words,
            wtimes,
            wdurations,
          },
          { lipsyncLang: 'fr' },
        );
      } catch {
        // Visual-only failure — audio still plays via useAudioPlayback.
      }
    },
    [initState],
  );

  // Start lipsync once per new speech turn. Audio always plays via
  // useAudioPlayback (direct Web Audio); the avatar is visual-only, so lipsync
  // is driven by the turn arriving, independent of `isAiSpeaking` (which flips
  // asynchronously in direct mode and would otherwise race the turn).
  useEffect(() => {
    if (initState !== 'ready' || !speechTurn) return;
    if (lastSpeechTurnIdRef.current === speechTurn.id) return;

    lastSpeechTurnIdRef.current = speechTurn.id;
    void playSpeechTurn(speechTurn);
  }, [speechTurn, playSpeechTurn, initState]);

  useEffect(() => {
    const head = headRef.current;
    if (!head || initState !== 'ready') return;

    if (isAwaitingAiResponse && !head.isSpeaking && !head.isAudioPlaying) {
      head.setMood('neutral');
    }
  }, [isAwaitingAiResponse, initState]);

  return (
    <div className="relative h-full min-h-[240px] w-full overflow-hidden">
      <RecruiterAvatarBackdrop />

      <div
        ref={containerRef}
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
        <p className="text-sm font-semibold text-white">
          {RECRUITER_DISPLAY_NAME}
        </p>
        <p className="text-xs text-white/80">{RECRUITER_DISPLAY_ROLE}</p>
      </div>

      {initState === 'loading' ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-[2px]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm font-medium text-white">{loadDetail}</p>
          {loadProgress > 0 ? (
            <p className="text-xs text-white/70">{loadProgress}%</p>
          ) : null}
        </div>
      ) : null}

      {initState === 'error' ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <p className="text-sm text-white/70">3D avatar unavailable</p>
        </div>
      ) : null}
    </div>
  );
}

export default RecruiterAvatar3D;

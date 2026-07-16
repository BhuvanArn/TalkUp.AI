/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public documentation base URL (optional; defaults in app). */
  readonly VITE_DOCUMENTATION_URL?: string;
  /** Set to 'true' to render the WebSocket debug panel in simulations (dev/debug only; off in prod). */
  readonly VITE_SHOW_WS_DEBUG?: string;
  /** Same-origin relative path to the recruiter GLB avatar model. */
  readonly VITE_RECRUITER_AVATAR_URL?: string;
  /** Same-origin relative path to the recruiter office room background image. */
  readonly VITE_RECRUITER_OFFICE_BACKGROUND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Minimal ambient types for `@met4citizen/talkinghead`, which ships as plain
 * ESM with no bundled declarations. Only the surface used by the recruiter
 * avatar is declared; extend as needed.
 */
declare module '@met4citizen/talkinghead' {
  import type { WebGLRenderer } from 'three';

  export interface TalkingHeadOptions {
    lipsyncLang?: string;
    lipsyncModules?: string[];
    cameraView?: string;
    cameraRotateEnable?: boolean;
    cameraPanEnable?: boolean;
    cameraZoomEnable?: boolean;
    modelFPS?: number;
    modelPixelRatio?: number;
    lightAmbientIntensity?: number;
    lightDirectIntensity?: number;
    avatarMood?: string;
    [key: string]: unknown;
  }

  export interface ShowAvatarOptions {
    url: string;
    [key: string]: unknown;
  }

  export interface SpeakAudioData {
    audio: AudioBuffer;
    words: string[];
    wtimes: number[];
    wdurations: number[];
  }

  export interface SpeakAudioOptions {
    lipsyncLang?: string;
    [key: string]: unknown;
  }

  export class TalkingHead {
    constructor(node: HTMLElement, options?: TalkingHeadOptions);

    readonly audioCtx: AudioContext;
    readonly audioSpeechGainNode: GainNode;
    readonly renderer: WebGLRenderer;
    readonly isRunning: boolean;
    readonly isSpeaking: boolean;
    readonly isAudioPlaying: boolean;

    showAvatar(options: ShowAvatarOptions): Promise<void>;
    speakAudio(data: SpeakAudioData, options?: SpeakAudioOptions): void;
    stopSpeaking(): void;
    setMood(mood: string): void;
    setView(view: string): void;
    onResize(): void;
    render(): void;
    start(): void;
    stop(): void;
    dispose(): void;
  }
}

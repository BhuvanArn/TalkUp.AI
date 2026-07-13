/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public documentation base URL (optional; defaults in app). */
  readonly VITE_DOCUMENTATION_URL?: string;
  /** Set to 'true' to render the WebSocket debug panel in simulations (dev/debug only; off in prod). */
  readonly VITE_SHOW_WS_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

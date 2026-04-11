/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public documentation base URL (optional; defaults in app). */
  readonly VITE_DOCUMENTATION_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public documentation base URL (optional; defaults in app). */
  readonly VITE_DOCUMENTATION_URL?: string;
  /** Same-origin relative path to the recruiter GLB avatar model. */
  readonly VITE_RECRUITER_AVATAR_URL?: string;
  /** Same-origin relative path to the recruiter office room background image. */
  readonly VITE_RECRUITER_OFFICE_BACKGROUND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

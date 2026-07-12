/**
 * Default bundled avatar: Avaturn character in blazer + dress shirt (`avaturn_look_0`).
 * TalkingHead demo asset (Avaturn, non-commercial — see TalkingHead README).
 */
export const DEFAULT_RECRUITER_AVATAR_URL =
  '/avatars/recruiter-professional.glb';

/** Bump when replacing the bundled GLB so clients refetch the asset. */
export const RECRUITER_AVATAR_ASSET_VERSION = '3';

/**
 * Modern office room backdrop (Unsplash, free to use).
 * @see https://unsplash.com/photos/a-room-with-a-couch-and-a-table-in-it-1524758631624
 */
export const DEFAULT_RECRUITER_OFFICE_BACKGROUND_URL =
  '/backgrounds/recruiter-office.jpg';

/** Bump when replacing the bundled office background image. */
export const RECRUITER_OFFICE_BACKGROUND_VERSION = '1';

/** TalkingHead `showAvatar` tuning for the bundled Avaturn recruiter model. */
export const RECRUITER_AVATAR_SHOW_OPTIONS = {
  body: 'F' as const,
  lipsyncLang: 'fr',
  avatarMute: true,
  avatarMood: 'neutral',
  avatarIdleEyeContact: 0.35,
  avatarIdleHeadMove: 0.4,
  avatarSpeakingEyeContact: 0.65,
  avatarSpeakingHeadMove: 0.35,
  retarget: {
    Hips: { y: 0.03 },
    Spine: { y: 0.02 },
    Spine1: { y: 0.02, z: 0.01 },
    Spine2: { y: 0.02, z: 0.01 },
    Neck: { z: 0.02, y: 0.01 },
    Head: { z: 0.02 },
    LeftShoulder: { rx: -0.5 },
    RightShoulder: { rx: -0.5 },
    scaleToHipsLevel: 1.0,
  },
  baseline: {
    headRotateX: -0.05,
    eyeBlinkLeft: 0.15,
    eyeBlinkRight: 0.15,
  },
};

export const RECRUITER_DISPLAY_NAME = 'Sophie Martin';
export const RECRUITER_DISPLAY_ROLE = 'Recruteuse IT';

const FORCE_FALLBACK_STORAGE_KEY = 'talkup.avatar.forceFallback';

/**
 * Resolves the avatar GLB URL from env, restricted to same-origin relative paths
 * to avoid open redirects or loading arbitrary third-party assets at runtime.
 */
export function resolveRecruiterAvatarUrl(): string {
  const configured = import.meta.env.VITE_RECRUITER_AVATAR_URL?.trim();
  if (!configured) {
    return appendRecruiterAvatarAssetVersion(DEFAULT_RECRUITER_AVATAR_URL);
  }

  if (configured.startsWith('/') && !configured.startsWith('//')) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    try {
      const url = new URL(configured, window.location.origin);
      if (url.origin === window.location.origin) {
        return `${url.pathname}${url.search}`;
      }
    } catch {
      // Invalid URL — fall back to bundled asset.
    }
  }

  return appendRecruiterAvatarAssetVersion(DEFAULT_RECRUITER_AVATAR_URL);
}

function appendRecruiterAvatarAssetVersion(url: string): string {
  if (url.includes('v=')) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${RECRUITER_AVATAR_ASSET_VERSION}`;
}

/**
 * Resolves the office room background image URL from env, restricted to same-origin paths.
 */
export function resolveRecruiterOfficeBackgroundUrl(): string {
  const configured = import.meta.env.VITE_RECRUITER_OFFICE_BACKGROUND_URL?.trim();
  if (!configured) {
    return appendOfficeBackgroundVersion(DEFAULT_RECRUITER_OFFICE_BACKGROUND_URL);
  }

  if (configured.startsWith('/') && !configured.startsWith('//')) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    try {
      const url = new URL(configured, window.location.origin);
      if (url.origin === window.location.origin) {
        return `${url.pathname}${url.search}`;
      }
    } catch {
      // Invalid URL — fall back to bundled asset.
    }
  }

  return appendOfficeBackgroundVersion(DEFAULT_RECRUITER_OFFICE_BACKGROUND_URL);
}

function appendOfficeBackgroundVersion(url: string): string {
  if (url.includes('v=')) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${RECRUITER_OFFICE_BACKGROUND_VERSION}`;
}

export function isAvatarFallbackForced(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(FORCE_FALLBACK_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAvatarFallbackForced(forced: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (forced) {
      window.sessionStorage.setItem(FORCE_FALLBACK_STORAGE_KEY, '1');
    } else {
      window.sessionStorage.removeItem(FORCE_FALLBACK_STORAGE_KEY);
    }
  } catch {
    // sessionStorage may be unavailable in private mode — ignore.
  }
}

/** Clears a persisted fallback lock (e.g. when starting a new simulation). */
export function clearAvatarFallbackForced(): void {
  setAvatarFallbackForced(false);
}

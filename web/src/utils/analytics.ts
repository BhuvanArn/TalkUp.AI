/**
 * Umami analytics (cookie-less). Env-gated: nothing loads unless
 * `VITE_UMAMI_WEBSITE_ID` is set. See `web/ANALYTICS.md`.
 */

export type AnalyticsEventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      /** No arguments records a page view of the current URL. */
      track: (name?: string, data?: AnalyticsEventData) => void;
    };
  }
}

const DEFAULT_SCRIPT_URL = 'https://cloud.umami.is/script.js';
const SCRIPT_ATTR = 'data-umami-loader';

/**
 * Page views are only recorded on public marketing and onboarding pages: they
 * are what the landing conversion funnel needs, and in-app navigation would
 * burn through the Umami Hobby event quota. Custom events fire everywhere.
 */
export const TRACKED_PATHS: ReadonlySet<string> = new Set([
  '/',
  '/about',
  '/privacy',
  '/login',
  '/register',
  '/register-organization',
  '/verify-email',
]);

let lastTrackedPath: string | null = null;

/**
 * Events sent before the deferred tracker has loaded (e.g. `hero_view` on first
 * paint). Flushed on load. Only filled once the script is injected, and capped.
 */
const MAX_PENDING_EVENTS = 20;
let pendingEvents: Array<[string, AnalyticsEventData | undefined]> = [];

/** Records a page view for public paths, once per consecutive path. */
export function trackPageview(pathname: string): void {
  if (!TRACKED_PATHS.has(pathname) || pathname === lastTrackedPath) return;
  if (!window.umami) return;
  lastTrackedPath = pathname;
  try {
    window.umami.track();
  } catch {
    // Analytics must never break the UI.
  }
}

/** Test helper: forget the last tracked path and any queued event. */
export function resetPageviewTracking(): void {
  lastTrackedPath = null;
  pendingEvents = [];
}

/** Injects the Umami tracker once. No-op when no website id is configured. */
export function initAnalytics(
  env: Pick<
    ImportMetaEnv,
    'VITE_UMAMI_WEBSITE_ID' | 'VITE_UMAMI_SCRIPT_URL'
  > = import.meta.env,
): void {
  const websiteId = env.VITE_UMAMI_WEBSITE_ID?.trim();
  if (!websiteId || typeof document === 'undefined') return;
  if (document.querySelector(`script[${SCRIPT_ATTR}]`)) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = env.VITE_UMAMI_SCRIPT_URL?.trim() || DEFAULT_SCRIPT_URL;
  script.dataset.websiteId = websiteId;
  // Page views are sent by trackPageview() so only public pages count.
  script.dataset.autoTrack = 'false';
  // Query strings carry PII (`/verify-email?email=…`) and invite codes.
  script.dataset.excludeSearch = 'true';
  script.addEventListener('load', () => {
    trackPageview(window.location.pathname);
    const queued = pendingEvents;
    pendingEvents = [];
    queued.forEach(([name, data]) => trackEvent(name, data));
  });
  script.setAttribute(SCRIPT_ATTR, '');
  document.head.appendChild(script);
}

/**
 * Sends a custom event. Queued while the injected tracker is still loading;
 * silently ignored when Umami is not configured or throws.
 */
export function trackEvent(name: string, data?: AnalyticsEventData): void {
  if (!window.umami) {
    const loading = document.querySelector(`script[${SCRIPT_ATTR}]`);
    if (loading && pendingEvents.length < MAX_PENDING_EVENTS) {
      pendingEvents.push([name, data]);
    }
    return;
  }
  try {
    window.umami.track(name, data);
  } catch {
    // Analytics must never break the UI.
  }
}

/**
 * Hero headline A/B test. Each visitor gets one variant, kept in localStorage
 * so a returning visitor sees the same headline. See `web/ANALYTICS.md`.
 */
export type HeroVariant = 'a' | 'b';

const HERO_VARIANT_KEY = 'talkup.heroVariant';
let heroVariant: HeroVariant | null = null;

/** The visitor's variant if one was already assigned, without assigning one. */
export function peekHeroVariant(): HeroVariant | null {
  if (heroVariant) return heroVariant;
  try {
    const stored = localStorage.getItem(HERO_VARIANT_KEY);
    if (stored === 'a' || stored === 'b') heroVariant = stored;
  } catch {
    // Storage blocked (private mode): the variant lives for this page only.
  }
  return heroVariant;
}

/** The visitor's variant, assigned 50/50 on first call. */
export function getHeroVariant(): HeroVariant {
  const existing = peekHeroVariant();
  if (existing) return existing;
  const assigned: HeroVariant = Math.random() < 0.5 ? 'a' : 'b';
  heroVariant = assigned;
  try {
    localStorage.setItem(HERO_VARIANT_KEY, assigned);
  } catch {
    // Storage blocked: keep the in-memory variant.
  }
  return assigned;
}

/** Test helper: forget the in-memory variant. */
export function resetHeroVariant(): void {
  heroVariant = null;
}

/** `{ heroVariant }` when the visitor saw the hero, else nothing. */
export const heroVariantData = (): AnalyticsEventData => {
  const variant = peekHeroVariant();
  return variant ? { heroVariant: variant } : {};
};

/** Where a landing CTA lives; one value per placement for the funnel table. */
export type CtaLocation =
  | 'hero'
  | 'orgs'
  | 'pricing_candidates'
  | 'pricing_orgs'
  | 'final'
  | 'nav';

/** `cta_click` helper for landing buttons. Usable directly as an onClick. */
export const trackCtaClick = (location: CtaLocation, target: string) => () =>
  trackEvent('cta_click', { location, target, ...heroVariantData() });

/** `contact_click` helper for the contact mailto links. */
export const trackContactClick = (location: 'footer' | 'about') => () =>
  trackEvent('contact_click', { location });

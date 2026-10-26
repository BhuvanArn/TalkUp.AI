/**
 * Umami analytics (cookie-less). Env-gated: nothing loads unless
 * `VITE_UMAMI_WEBSITE_ID` is set. See `web/ANALYTICS.md`.
 */

export type AnalyticsEventData = Record<string, string | number | boolean>;

/** The payload Umami builds for the current page (url, title, referrer…). */
type UmamiPayload = Record<string, unknown>;

declare global {
  interface Window {
    umami?: {
      /** A function receives Umami's default payload and returns the one to send. */
      track: (payload: (props: UmamiPayload) => UmamiPayload) => void;
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

/** One Umami send: a page view when `name` is absent, else an event. */
interface UmamiSend {
  url: string;
  name?: string;
  data?: AnalyticsEventData;
}

/**
 * Page views and events sent before the deferred tracker has loaded (e.g. the
 * first page view and `hero_view` on first paint), in order, with the path
 * they were fired on. Flushed on load, dropped if the script fails (blocked).
 * Only filled while the script is loading, and capped.
 */
const MAX_PENDING_EVENTS = 20;
let pendingEvents: UmamiSend[] = [];
let trackerLoading = false;

/** Sends now, queues while the tracker loads, otherwise drops. */
function dispatch(send: UmamiSend): void {
  if (!window.umami) {
    if (trackerLoading && pendingEvents.length < MAX_PENDING_EVENTS) {
      pendingEvents.push(send);
    }
    return;
  }
  const { url, name, data } = send;
  try {
    window.umami.track((props) =>
      name ? { ...props, url, name, data } : { ...props, url },
    );
  } catch {
    // Analytics must never break the UI.
  }
}

/**
 * Records a page view for public paths, once per consecutive path. The URL is
 * passed explicitly: Umami only follows pushState/replaceState, so after a
 * Back/Forward (popstate) its own URL would still be the previous page.
 */
export function trackPageview(pathname: string): void {
  if (!TRACKED_PATHS.has(pathname)) {
    // Coming back from an untracked page is a new view, not a duplicate.
    lastTrackedPath = null;
    return;
  }
  if (pathname === lastTrackedPath) return;
  // Nothing to send or queue (no tracker configured): remember nothing either.
  if (!window.umami && !trackerLoading) return;
  lastTrackedPath = pathname;
  dispatch({ url: pathname });
}

/** Test helper: forget the last tracked path, the queue and the loader state. */
export function resetPageviewTracking(): void {
  lastTrackedPath = null;
  pendingEvents = [];
  trackerLoading = false;
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
  // Page views are sent by trackPageview() so only public pages count. Not
  // `data-auto-track="false"`: that also stops Umami from following SPA route
  // changes, so every manual page view and event would report the landing URL.
  script.dataset.autoPageview = 'false';
  // Query strings carry PII (`/verify-email?email=…`) and invite codes.
  script.dataset.excludeSearch = 'true';
  script.addEventListener('load', () => {
    trackerLoading = false;
    const queued = pendingEvents;
    pendingEvents = [];
    queued.forEach(dispatch);
    // In case the router resolved before anything could be queued.
    trackPageview(window.location.pathname);
  });
  script.addEventListener('error', () => {
    trackerLoading = false;
    pendingEvents = [];
  });
  trackerLoading = true;
  script.setAttribute(SCRIPT_ATTR, '');
  document.head.appendChild(script);
}

/**
 * Sends a custom event, attributed to the current path (see trackPageview for
 * why the URL is explicit). Queued while the injected tracker is still
 * loading; silently ignored when Umami is not configured, blocked or throws.
 */
export function trackEvent(name: string, data?: AnalyticsEventData): void {
  dispatch({ url: window.location.pathname, name, data });
}

/**
 * Hero headline A/B test. Each visitor gets one variant, kept in localStorage
 * so a returning visitor sees the same headline. See `web/ANALYTICS.md`.
 */
export type HeroVariant = 'a' | 'b';

const HERO_VARIANT_KEY = 'talkup.heroVariant';
/**
 * Stored as `<variant>:<assigned at, ms>`. localStorage never expires on its
 * own, so a value older than 13 months (the CNIL's maximum lifetime for
 * audience-measurement trackers) is ignored and deleted on the next visit.
 */
export const HERO_VARIANT_MAX_AGE_MS = 395 * 24 * 60 * 60 * 1000;
let heroVariant: HeroVariant | null = null;

const readStoredVariant = (): HeroVariant | null => {
  const stored = localStorage.getItem(HERO_VARIANT_KEY);
  if (stored === null) return null;
  const [variant, assignedAt] = stored.split(':');
  const age = Date.now() - Number(assignedAt);
  if ((variant === 'a' || variant === 'b') && age < HERO_VARIANT_MAX_AGE_MS) {
    // A date in the future (clock moved back) keeps the variant; restart the
    // 13 months from now rather than switching the visitor to the other arm.
    if (age < 0)
      localStorage.setItem(HERO_VARIANT_KEY, `${variant}:${Date.now()}`);
    return variant;
  }
  // Expired or malformed (NaN age fails the check above): forget it.
  localStorage.removeItem(HERO_VARIANT_KEY);
  return null;
};

/** The visitor's variant if one was already assigned, without assigning one. */
export function peekHeroVariant(): HeroVariant | null {
  if (heroVariant) return heroVariant;
  try {
    heroVariant = readStoredVariant();
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
    localStorage.setItem(HERO_VARIANT_KEY, `${assigned}:${Date.now()}`);
  } catch {
    // Storage blocked: keep the in-memory variant.
  }
  return assigned;
}

/** Test helper: forget the in-memory variant. */
export function resetHeroVariant(): void {
  heroVariant = null;
}

const HERO_VIEW_SESSION_KEY = 'talkup.heroViewCounted';

/**
 * `hero_view` once per browser session (tab), so the A/B denominator
 * approximates visits rather than every render of the landing (reloads, Back
 * to `/`). Cleared when the tab closes. If sessionStorage is blocked, falls
 * back to one view per mount.
 */
export function trackHeroView(variant: HeroVariant): void {
  try {
    if (sessionStorage.getItem(HERO_VIEW_SESSION_KEY)) return;
    sessionStorage.setItem(HERO_VIEW_SESSION_KEY, '1');
  } catch {
    // Storage blocked: count this view.
  }
  trackEvent('hero_view', { heroVariant: variant });
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

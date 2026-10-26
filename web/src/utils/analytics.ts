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
  if (pathname === lastTrackedPath || !window.umami) return;
  lastTrackedPath = pathname;
  try {
    window.umami.track((props) => ({ ...props, url: pathname }));
  } catch {
    // Analytics must never break the UI.
  }
}

/** Test helper: forget the last tracked path. */
export function resetPageviewTracking(): void {
  lastTrackedPath = null;
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
  script.addEventListener('load', () =>
    trackPageview(window.location.pathname),
  );
  script.setAttribute(SCRIPT_ATTR, '');
  document.head.appendChild(script);
}

/**
 * Sends a custom event, attributed to the current path (see trackPageview for
 * why the URL is explicit). Silently ignored when Umami is absent or throws.
 */
export function trackEvent(name: string, data?: AnalyticsEventData): void {
  try {
    window.umami?.track((props) => ({
      ...props,
      url: window.location.pathname,
      name,
      data,
    }));
  } catch {
    // Analytics must never break the UI.
  }
}

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
  trackEvent('cta_click', { location, target });

/** `contact_click` helper for the contact mailto links. */
export const trackContactClick = (location: 'footer' | 'about') => () =>
  trackEvent('contact_click', { location });

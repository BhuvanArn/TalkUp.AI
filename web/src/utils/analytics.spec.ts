import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  initAnalytics,
  resetPageviewTracking,
  trackEvent,
  trackPageview,
} from './analytics';

const loaderScripts = () =>
  document.head.querySelectorAll('script[data-umami-loader]');

describe('analytics', () => {
  afterEach(() => {
    loaderScripts().forEach((s) => s.remove());
    delete window.umami;
    resetPageviewTracking();
  });

  /** Runs each payload function Umami received against a stale default payload. */
  const sentPayloads = (track: ReturnType<typeof vi.fn>) =>
    track.mock.calls.map(([build]) =>
      build({ website: 'abc', url: 'https://talkup.test/stale' }),
    );

  describe('trackPageview', () => {
    it('tracks public paths once per consecutive path, with the path as url', () => {
      const track = vi.fn();
      window.umami = { track };
      trackPageview('/');
      trackPageview('/');
      trackPageview('/about');
      expect(sentPayloads(track)).toEqual([
        { website: 'abc', url: '/' },
        { website: 'abc', url: '/about' },
      ]);
    });

    it('counts a return through an untracked page as a new view', () => {
      const track = vi.fn();
      window.umami = { track };
      trackPageview('/login');
      trackPageview('/forgot-password');
      trackPageview('/login');
      expect(sentPayloads(track).map((p) => p.url)).toEqual([
        '/login',
        '/login',
      ]);
    });

    it('reports the right url after Back, when Umami still holds the previous page', () => {
      const track = vi.fn();
      window.umami = { track };
      trackPageview('/');
      trackPageview('/about');
      trackPageview('/'); // popstate: Umami's own url is still /about
      expect(sentPayloads(track).at(-1)?.url).toBe('/');
    });

    it('ignores in-app paths', () => {
      const track = vi.fn();
      window.umami = { track };
      trackPageview('/applications');
      trackPageview('/simulations');
      expect(track).not.toHaveBeenCalled();
    });

    it('waits for the script before remembering a path', () => {
      trackPageview('/');
      const track = vi.fn();
      window.umami = { track };
      trackPageview('/');
      expect(track).toHaveBeenCalledTimes(1);
    });
  });

  describe('initAnalytics', () => {
    it('disables automatic page views and query strings on the injected script', () => {
      initAnalytics({ VITE_UMAMI_WEBSITE_ID: 'abc' });
      const [script] = loaderScripts() as NodeListOf<HTMLScriptElement>;
      expect(script.dataset.autoPageview).toBe('false');
      expect(script.dataset.autoTrack).toBeUndefined();
      expect(script.dataset.excludeSearch).toBe('true');
    });

    it('does nothing without a website id', () => {
      initAnalytics({});
      initAnalytics({ VITE_UMAMI_WEBSITE_ID: '  ' });
      expect(loaderScripts()).toHaveLength(0);
    });

    it('injects a deferred cloud script with the website id', () => {
      initAnalytics({ VITE_UMAMI_WEBSITE_ID: 'abc-123' });
      const [script] = loaderScripts() as NodeListOf<HTMLScriptElement>;
      expect(script.src).toBe('https://cloud.umami.is/script.js');
      expect(script.defer).toBe(true);
      expect(script.dataset.websiteId).toBe('abc-123');
    });

    it('honours a self-hosted script url and injects only once', () => {
      const env = {
        VITE_UMAMI_WEBSITE_ID: 'abc',
        VITE_UMAMI_SCRIPT_URL: 'https://stats.example.com/script.js',
      };
      initAnalytics(env);
      initAnalytics(env);
      const scripts = loaderScripts() as NodeListOf<HTMLScriptElement>;
      expect(scripts).toHaveLength(1);
      expect(scripts[0].src).toBe('https://stats.example.com/script.js');
    });
  });

  describe('trackEvent', () => {
    it('is a no-op when window.umami is absent', () => {
      expect(() => trackEvent('cta_click')).not.toThrow();
    });

    it('forwards name and data, attributed to the current path', () => {
      const track = vi.fn();
      window.umami = { track };
      trackEvent('cta_click', { location: 'hero', target: '/register' });
      expect(sentPayloads(track)).toEqual([
        {
          website: 'abc',
          url: window.location.pathname,
          name: 'cta_click',
          data: { location: 'hero', target: '/register' },
        },
      ]);
    });

    it('swallows errors thrown by the tracker', () => {
      window.umami = {
        track: () => {
          throw new Error('blocked');
        },
      };
      expect(() => trackEvent('contact_click')).not.toThrow();
    });
  });
});

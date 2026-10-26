import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  HERO_VARIANT_MAX_AGE_MS,
  getHeroVariant,
  heroVariantData,
  initAnalytics,
  peekHeroVariant,
  resetHeroVariant,
  resetPageviewTracking,
  trackCtaClick,
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
    resetHeroVariant();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  /** Runs each payload function Umami received against a stale default payload. */
  const sentPayloads = (track: ReturnType<typeof vi.fn>) =>
    track.mock.calls.map(([build]) =>
      build({ website: 'abc', url: 'https://talkup.test/stale' }),
    );

  const sentEvents = (track: ReturnType<typeof vi.fn>) =>
    sentPayloads(track)
      .filter((p) => p.name)
      .map(({ name, data, url }) => ({ name, data, url }));

  describe('event queue', () => {
    it('queues events while the injected tracker loads, then flushes them', () => {
      initAnalytics({ VITE_UMAMI_WEBSITE_ID: 'abc' });
      trackEvent('hero_view', { heroVariant: 'a' });
      const track = vi.fn();
      window.umami = { track };
      const [script] = loaderScripts();
      script.dispatchEvent(new Event('load'));
      expect(sentEvents(track)).toEqual([
        { name: 'hero_view', data: { heroVariant: 'a' }, url: '/' },
      ]);
    });

    it('keeps the path an event was fired on when flushing later', () => {
      initAnalytics({ VITE_UMAMI_WEBSITE_ID: 'abc' });
      trackEvent('hero_view', { heroVariant: 'a' });
      window.history.pushState({}, '', '/register');
      const track = vi.fn();
      window.umami = { track };
      loaderScripts()[0].dispatchEvent(new Event('load'));
      window.history.pushState({}, '', '/');
      expect(sentEvents(track)).toEqual([
        { name: 'hero_view', data: { heroVariant: 'a' }, url: '/' },
      ]);
    });

    it('drops events when no tracker is configured', () => {
      trackEvent('hero_view', { heroVariant: 'a' });
      initAnalytics({ VITE_UMAMI_WEBSITE_ID: 'abc' });
      const track = vi.fn();
      window.umami = { track };
      loaderScripts()[0].dispatchEvent(new Event('load'));
      expect(sentEvents(track)).toEqual([]);
    });
  });

  describe('hero variant', () => {
    it('assigns a variant once and keeps it in localStorage', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.7);
      expect(peekHeroVariant()).toBeNull();
      expect(getHeroVariant()).toBe('b');
      resetHeroVariant();
      vi.spyOn(Math, 'random').mockReturnValue(0.1);
      expect(getHeroVariant()).toBe('b');
      expect(localStorage.getItem('talkup.heroVariant')).toMatch(/^b:\d+$/);
    });

    it('draws again once the stored variant is older than 13 months', () => {
      const expired = Date.now() - HERO_VARIANT_MAX_AGE_MS - 1;
      localStorage.setItem('talkup.heroVariant', `b:${expired}`);
      expect(peekHeroVariant()).toBeNull();
      expect(localStorage.getItem('talkup.heroVariant')).toBeNull();
      vi.spyOn(Math, 'random').mockReturnValue(0.1);
      expect(getHeroVariant()).toBe('a');
    });

    it('ignores a malformed stored value', () => {
      localStorage.setItem('talkup.heroVariant', 'b');
      expect(peekHeroVariant()).toBeNull();
    });

    it('still assigns a variant when storage is blocked', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      vi.spyOn(Math, 'random').mockReturnValue(0.1);
      expect(getHeroVariant()).toBe('a');
      expect(getHeroVariant()).toBe('a');
    });

    it('tags events only for visitors who saw the hero', () => {
      const track = vi.fn();
      window.umami = { track };
      expect(heroVariantData()).toEqual({});
      trackCtaClick('nav', '/register')();
      localStorage.setItem('talkup.heroVariant', `a:${Date.now()}`);
      trackCtaClick('hero', '/register')();
      expect(sentEvents(track).map(({ data }) => data)).toEqual([
        { location: 'nav', target: '/register' },
        { location: 'hero', target: '/register', heroVariant: 'a' },
      ]);
    });
  });

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

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
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

  describe('event queue', () => {
    it('queues events while the injected tracker loads, then flushes them', () => {
      initAnalytics({ VITE_UMAMI_WEBSITE_ID: 'abc' });
      trackEvent('hero_view', { heroVariant: 'a' });
      const track = vi.fn();
      window.umami = { track };
      const [script] = loaderScripts();
      script.dispatchEvent(new Event('load'));
      expect(track).toHaveBeenCalledWith('hero_view', { heroVariant: 'a' });
    });

    it('drops events when no tracker is configured', () => {
      trackEvent('hero_view', { heroVariant: 'a' });
      initAnalytics({ VITE_UMAMI_WEBSITE_ID: 'abc' });
      const track = vi.fn();
      window.umami = { track };
      loaderScripts()[0].dispatchEvent(new Event('load'));
      expect(track).not.toHaveBeenCalledWith('hero_view', expect.anything());
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
      expect(localStorage.getItem('talkup.heroVariant')).toBe('b');
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
      localStorage.setItem('talkup.heroVariant', 'a');
      trackCtaClick('hero', '/register')();
      expect(track.mock.calls).toEqual([
        ['cta_click', { location: 'nav', target: '/register' }],
        [
          'cta_click',
          { location: 'hero', target: '/register', heroVariant: 'a' },
        ],
      ]);
    });
  });

  describe('trackPageview', () => {
    it('tracks public paths once per consecutive path', () => {
      const track = vi.fn();
      window.umami = { track };
      trackPageview('/');
      trackPageview('/');
      trackPageview('/about');
      expect(track).toHaveBeenCalledTimes(2);
      expect(track).toHaveBeenCalledWith();
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

    it('disables automatic page views and query strings on the injected script', () => {
      initAnalytics({ VITE_UMAMI_WEBSITE_ID: 'abc' });
      const [script] = loaderScripts() as NodeListOf<HTMLScriptElement>;
      expect(script.dataset.autoTrack).toBe('false');
      expect(script.dataset.excludeSearch).toBe('true');
    });
  });

  describe('initAnalytics', () => {
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

    it('forwards name and data to umami.track', () => {
      const track = vi.fn();
      window.umami = { track };
      trackEvent('cta_click', { location: 'hero', target: '/register' });
      expect(track).toHaveBeenCalledWith('cta_click', {
        location: 'hero',
        target: '/register',
      });
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

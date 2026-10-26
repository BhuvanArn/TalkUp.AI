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
      expect(script.dataset.autoPageview).toBe('false');
      expect(script.dataset.autoTrack).toBeUndefined();
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

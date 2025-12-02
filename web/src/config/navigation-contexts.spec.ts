import { describe, expect, it } from 'vitest';

import {
  applicationNavigationContext,
  globalNavigationItems,
  navigationContexts,
  publicNavigationContext,
  rootNavigationContext,
  settingsNavigationContext,
} from './navigation-contexts';

describe('navigation-contexts', () => {
  describe('rootNavigationContext', () => {
    it('should have type "root"', () => {
      expect(rootNavigationContext.type).toBe('root');
    });

    it('should contain all expected navigation items', () => {
      expect(rootNavigationContext.items).toHaveLength(4);

      const labels = rootNavigationContext.items.map((item) => item.label);
      expect(labels).toContain('Applications');
      expect(labels).toContain('Curriculum Vitae');
      expect(labels).toContain('Agenda');
      expect(labels).toContain('Notes');
    });

    it('should have all items visible in navigation', () => {
      rootNavigationContext.items.forEach((item) => {
        expect(item.showInNav).toBe(true);
      });
    });

    it('should have correct routes', () => {
      const routes = rootNavigationContext.items.map((item) => item.to);
      expect(routes).toContain('/applications');
      expect(routes).toContain('/cv-analysis');
      expect(routes).toContain('/agenda');
      expect(routes).toContain('/notes');
    });

    it('should have icons for all items', () => {
      rootNavigationContext.items.forEach((item) => {
        expect(item.icon).toBeDefined();
        expect(typeof item.icon).toBe('string');
      });
    });

    it('should have order defined for all items', () => {
      rootNavigationContext.items.forEach((item) => {
        expect(item.order).toBeDefined();
        expect(typeof item.order).toBe('number');
      });
    });
  });

  describe('applicationNavigationContext', () => {
    it('should have type "application"', () => {
      expect(applicationNavigationContext.type).toBe('application');
    });

    it('should contain all expected navigation items', () => {
      expect(applicationNavigationContext.items).toHaveLength(3);

      const labels = applicationNavigationContext.items.map(
        (item) => item.label,
      );
      expect(labels).toContain('Dashboard');
      expect(labels).toContain('Simulations');
      expect(labels).toContain('Analytics');
    });

    it('should have parent context set to "root"', () => {
      expect(applicationNavigationContext.parentContext).toBe('root');
    });

    it('should have all items visible in navigation', () => {
      applicationNavigationContext.items.forEach((item) => {
        expect(item.showInNav).toBe(true);
      });
    });

    it('should have correct routes', () => {
      const routes = applicationNavigationContext.items.map((item) => item.to);
      expect(routes).toContain('/dashboard');
      expect(routes).toContain('/simulations');
      expect(routes).toContain('/analytics');
    });

    it('should have icons for all items', () => {
      applicationNavigationContext.items.forEach((item) => {
        expect(item.icon).toBeDefined();
        expect(typeof item.icon).toBe('string');
      });
    });
  });

  describe('publicNavigationContext', () => {
    it('should have type "public"', () => {
      expect(publicNavigationContext.type).toBe('public');
    });

    it('should contain all expected navigation items', () => {
      expect(publicNavigationContext.items).toHaveLength(4);

      const labels = publicNavigationContext.items.map((item) => item.label);
      expect(labels).toContain('Home');
      expect(labels).toContain('About');
      expect(labels).toContain('Login');
      expect(labels).toContain('Sign Up');
    });

    it('should have all items visible in navigation', () => {
      publicNavigationContext.items.forEach((item) => {
        expect(item.showInNav).toBe(true);
      });
    });

    it('should have correct routes', () => {
      const routes = publicNavigationContext.items.map((item) => item.to);
      expect(routes).toContain('/');
      expect(routes).toContain('/about');
      expect(routes).toContain('/login');
      expect(routes).toContain('/signup');
    });
  });

  describe('settingsNavigationContext', () => {
    it('should have type "settings"', () => {
      expect(settingsNavigationContext.type).toBe('settings');
    });

    it('should contain all expected navigation items', () => {
      expect(settingsNavigationContext.items).toHaveLength(4);

      const labels = settingsNavigationContext.items.map((item) => item.label);
      expect(labels).toContain('Profile');
      expect(labels).toContain('Billing');
      expect(labels).toContain('Integrations');
      expect(labels).toContain('Security');
    });

    it('should have all items visible in navigation', () => {
      settingsNavigationContext.items.forEach((item) => {
        expect(item.showInNav).toBe(true);
      });
    });

    it('should have correct routes starting with /settings', () => {
      settingsNavigationContext.items.forEach((item) => {
        expect(item.to).toMatch(/^\/settings\//);
      });
    });

    it('should have specific settings routes', () => {
      const routes = settingsNavigationContext.items.map((item) => item.to);
      expect(routes).toContain('/settings/profile');
      expect(routes).toContain('/settings/billing');
      expect(routes).toContain('/settings/integrations');
      expect(routes).toContain('/settings/security');
    });
  });

  describe('globalNavigationItems', () => {
    it('should contain global navigation items', () => {
      expect(globalNavigationItems).toHaveLength(2);
    });

    it('should include Settings and Help Center', () => {
      const labels = globalNavigationItems.map((item) => item.label);
      expect(labels).toContain('Settings');
      expect(labels).toContain('Help Center');
    });

    it('should have all items visible in navigation', () => {
      globalNavigationItems.forEach((item) => {
        expect(item.showInNav).toBe(true);
      });
    });

    it('should have icons for all items', () => {
      globalNavigationItems.forEach((item) => {
        expect(item.icon).toBeDefined();
        expect(typeof item.icon).toBe('string');
      });
    });
  });

  describe('navigationContexts', () => {
    it('should contain all navigation contexts', () => {
      expect(Object.keys(navigationContexts)).toHaveLength(4);
    });

    it('should have root context', () => {
      expect(navigationContexts.root).toBeDefined();
      expect(navigationContexts.root).toBe(rootNavigationContext);
    });

    it('should have application context', () => {
      expect(navigationContexts.application).toBeDefined();
      expect(navigationContexts.application).toBe(applicationNavigationContext);
    });

    it('should have public context', () => {
      expect(navigationContexts.public).toBeDefined();
      expect(navigationContexts.public).toBe(publicNavigationContext);
    });

    it('should have settings context', () => {
      expect(navigationContexts.settings).toBeDefined();
      expect(navigationContexts.settings).toBe(settingsNavigationContext);
    });

    it('should have all contexts with valid structure', () => {
      Object.values(navigationContexts).forEach((context) => {
        expect(context.type).toBeDefined();
        expect(context.items).toBeDefined();
        expect(Array.isArray(context.items)).toBe(true);
      });
    });
  });
});

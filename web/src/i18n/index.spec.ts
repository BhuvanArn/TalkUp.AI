import i18next from 'i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  LANGUAGE_STORAGE_KEY,
  changeLanguage,
  getLanguage,
  setupI18n,
  toSupportedLanguage,
} from './index';

const mockBrowserLanguages = (languages: string[]) => {
  vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(languages);
  vi.spyOn(window.navigator, 'language', 'get').mockReturnValue(
    languages[0] ?? '',
  );
};

describe('i18n setup', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  describe('language detection', () => {
    it.each([
      [['fr-FR'], 'fr'],
      [['fr'], 'fr'],
      [['fr-CA', 'en-US'], 'fr'],
      [['de'], 'en'],
      [['en-GB'], 'en'],
      [['de-DE', 'fr-FR'], 'fr'],
      [['es', 'en', 'fr'], 'en'],
      [['fr-CA', 'en'], 'fr'],
      [['en-GB', 'fr'], 'en'],
      [['fr-FR', 'en-US', 'en'], 'fr'],
      [['de', 'fr-CH'], 'fr'],
      [[], 'en'],
    ])('detects %j as %s', (languages, expected) => {
      mockBrowserLanguages(languages);

      const instance = setupI18n(i18next.createInstance());

      expect(getLanguage(instance)).toBe(expected);
    });

    it('prefers the stored choice over the browser language', () => {
      mockBrowserLanguages(['fr-FR']);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

      const instance = setupI18n(i18next.createInstance());

      expect(getLanguage(instance)).toBe('en');
    });

    it('reduces a stored regional tag to its primary subtag', () => {
      mockBrowserLanguages(['en-US']);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr-CA');

      const instance = setupI18n(i18next.createInstance());

      expect(instance.language).toBe('fr');
    });

    it('sets the language to the bare supported code', () => {
      mockBrowserLanguages(['fr-CA', 'en']);

      const instance = setupI18n(i18next.createInstance());

      expect(instance.language).toBe('fr');
    });

    it('ignores an unsupported stored value', () => {
      mockBrowserLanguages(['fr-FR']);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'de');

      const instance = setupI18n(i18next.createInstance());

      expect(getLanguage(instance)).toBe('fr');
    });

    it('does not save the detected language', () => {
      mockBrowserLanguages(['fr-FR']);

      setupI18n(i18next.createInstance());

      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
    });

    it('skips detection when a language is forced', () => {
      mockBrowserLanguages(['fr-FR']);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');

      const instance = setupI18n(i18next.createInstance(), { lng: 'en' });

      expect(getLanguage(instance)).toBe('en');
    });
  });

  describe('<html lang>', () => {
    it('is set on init', () => {
      mockBrowserLanguages(['fr-FR']);

      setupI18n(i18next.createInstance());

      expect(document.documentElement.lang).toBe('fr');
    });

    it('follows language changes', async () => {
      const instance = setupI18n(i18next.createInstance(), { lng: 'en' });

      await changeLanguage('fr', instance);
      expect(document.documentElement.lang).toBe('fr');

      await changeLanguage('en', instance);
      expect(document.documentElement.lang).toBe('en');
    });
  });

  describe('changeLanguage', () => {
    it('activates and saves the chosen language', async () => {
      const instance = setupI18n(i18next.createInstance(), { lng: 'en' });

      await changeLanguage('fr', instance);

      expect(getLanguage(instance)).toBe('fr');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
      expect(instance.t('actions.save')).toBe('Enregistrer');
    });
  });

  describe('toSupportedLanguage', () => {
    it.each([
      ['fr', 'fr'],
      ['fr-BE', 'fr'],
      ['FR-fr', 'fr'],
      ['en-US', 'en'],
      ['de', 'en'],
      [undefined, 'en'],
      [null, 'en'],
    ])('maps %s to %s', (tag, expected) => {
      expect(toSupportedLanguage(tag)).toBe(expected);
    });
  });
});

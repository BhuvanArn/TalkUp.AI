import i18next, { type i18n } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import {
  DEFAULT_LANGUAGE,
  DEFAULT_NAMESPACE,
  LANGUAGE_STORAGE_KEY,
  type Language,
  NAMESPACES,
  SUPPORTED_LANGUAGES,
  toPrimarySubtag,
  toSupportedLanguage,
} from './config';
import { resources } from './resources';

export * from './config';

interface I18nOptions {
  /**
   * Force a language and skip detection. Tests pin `en` with it so text-based
   * selectors keep matching the English source strings.
   */
  lng?: Language;
}

/**
 * Initialize an i18next instance with the bundled resources and the language
 * detector. Resources are bundled, so init is synchronous: the language is
 * resolved before the first render.
 *
 * Detection order: the language saved by the switcher (`localStorage`), then
 * `navigator.languages` (the first entry whose primary subtag is supported:
 * `fr-CA` gives `fr`, `en-GB` gives `en`), then `en`. The detected language is
 * not cached, so a visitor who never uses the switcher keeps following their
 * browser; only {@link changeLanguage} writes the choice.
 *
 * Also keeps `<html lang>` in sync with the active language.
 *
 * Exported for tests, which run it on a fresh `i18next.createInstance()`; the
 * app uses {@link initI18n}.
 */
export const setupI18n = (instance: i18n, { lng }: I18nOptions = {}): i18n => {
  instance.on('languageChanged', (language) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = toSupportedLanguage(language);
    }
  });

  void instance.use(LanguageDetector).init({
    resources,
    lng,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    ns: [...NAMESPACES],
    defaultNS: DEFAULT_NAMESPACE,
    initAsync: false,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: [],
      // Reduce every detected tag (stored value included) to its primary
      // subtag, so i18next picks the first supported entry in list order.
      // Without it, an exact match later in the list wins: `fr-CA, en` would
      // give `en`.
      convertDetectedLanguage: toPrimarySubtag,
    },
    interpolation: {
      // React already escapes rendered strings.
      escapeValue: false,
    },
  });

  return instance;
};

/**
 * Initialize the app-wide i18next instance used by `useTranslation()`. Call it
 * once, before the first render (`main.tsx`, `setupTests.ts`).
 *
 * @example
 * ```ts
 * initI18n(); // app: detect the language
 * initI18n({ lng: 'en' }); // tests: pin English
 * ```
 */
export const initI18n = (options?: I18nOptions): i18n => {
  if (i18next.isInitialized) {
    return i18next;
  }
  return setupI18n(i18next.use(initReactI18next), options);
};

/**
 * Switch the active language and save it as the user's choice, so it wins over
 * the browser language on the next visit.
 *
 * @param language - Language to activate
 * @param instance - i18next instance (the app-wide one by default)
 */
export const changeLanguage = async (
  language: Language,
  instance: i18n = i18next,
): Promise<void> => {
  await instance.changeLanguage(language);
  instance.services.languageDetector?.cacheUserLanguage?.(language, [
    'localStorage',
  ]);
};

/**
 * Active language of an i18next instance, narrowed to a supported language.
 */
export const getLanguage = (instance: i18n = i18next): Language =>
  toSupportedLanguage(instance.resolvedLanguage ?? instance.language);

/**
 * Static i18n settings shared by the setup, the switcher and the tests.
 * See `web/I18N.md` for the conventions built on top of them.
 */

/** Languages the UI ships in. `en` is the source language and the fallback. */
export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

/** `localStorage` key holding the language the user picked in the switcher. */
export const LANGUAGE_STORAGE_KEY = 'talkup.language';

/**
 * Translation namespaces, one JSON file each under
 * `web/src/locales/<language>/<namespace>.json`.
 */
export const NAMESPACES = [
  'common',
  'landing',
  'auth',
  'app',
  'settings',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export const DEFAULT_NAMESPACE = 'common' satisfies Namespace;

/** Lowercased primary subtag of a language tag: `fr-CA` gives `fr`. */
export const toPrimarySubtag = (tag: string): string =>
  tag.split('-')[0].toLowerCase();

/**
 * Narrow any language tag (`fr-FR`, `en`, `de`…) to a supported language: its
 * primary subtag when supported (`fr-CA` gives `fr`), else the default.
 */
export const toSupportedLanguage = (tag?: string | null): Language => {
  const primary = tag ? toPrimarySubtag(tag) : undefined;
  return (
    SUPPORTED_LANGUAGES.find((language) => language === primary) ??
    DEFAULT_LANGUAGE
  );
};

import enApp from '../locales/en/app.json';
import enAuth from '../locales/en/auth.json';
import enCommon from '../locales/en/common.json';
import enLanding from '../locales/en/landing.json';
import enSettings from '../locales/en/settings.json';
import frApp from '../locales/fr/app.json';
import frAuth from '../locales/fr/auth.json';
import frCommon from '../locales/fr/common.json';
import frLanding from '../locales/fr/landing.json';
import frSettings from '../locales/fr/settings.json';

/**
 * Bundled translations, keyed by language then namespace. `en` is the source
 * of truth: its shape types every `t()` key (see `i18next.d.ts`), and a unit
 * test checks that `fr` has exactly the same keys.
 */
export const resources = {
  en: {
    common: enCommon,
    landing: enLanding,
    auth: enAuth,
    app: enApp,
    settings: enSettings,
  },
  fr: {
    common: frCommon,
    landing: frLanding,
    auth: frAuth,
    app: frApp,
    settings: frSettings,
  },
} as const;

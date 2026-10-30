import 'i18next';

import type { DEFAULT_NAMESPACE } from './config';
import type { resources } from './resources';

/**
 * Types `t()` keys from the English resources, so an unknown key or namespace
 * fails `tsc`.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof DEFAULT_NAMESPACE;
    resources: (typeof resources)['en'];
  }
}

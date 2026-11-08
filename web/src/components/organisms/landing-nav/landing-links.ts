import type { ParseKeys } from 'i18next';

/** Shared by the landing nav, the landing footer and the About page. */

/** Landing section anchors. The ids live on the landing page sections. */
export const LANDING_SECTION_LINKS = [
  { hash: 'how', labelKey: 'links.howItWorks' },
  { hash: 'orgs', labelKey: 'links.forSchools' },
  { hash: 'pricing', labelKey: 'links.pricing' },
] as const satisfies readonly {
  hash: string;
  labelKey: ParseKeys<'landing'>;
}[];

/** Visible keyboard focus — the Button atom resets outlines on focus. */
export const LANDING_FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accent';

export const CONTACT_EMAIL = 'contact.talkup.ai@gmail.com';

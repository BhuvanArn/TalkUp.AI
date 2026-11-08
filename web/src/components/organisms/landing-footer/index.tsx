import Logo from '@/components/molecules/logo';
import {
  CONTACT_EMAIL,
  LANDING_FOCUS_RING,
  LANDING_SECTION_LINKS as PRODUCT_LINKS,
} from '@/components/organisms/landing-nav/landing-links';
import { trackContactClick } from '@/utils/analytics';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa6';

const FOCUS_RING = `rounded-sm ${LANDING_FOCUS_RING}`;

const LINK_CLASS = `text-body-m text-text-weaker transition-colors hover:text-text ${FOCUS_RING}`;

const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    href: 'https://github.com/BhuvanArn/TalkUp.AI',
    Icon: FaGithub,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/talkup-ai/',
    Icon: FaLinkedin,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/talkup.ai/',
    Icon: FaInstagram,
  },
] as const;

const ColumnTitle = ({ children }: { children: string }) => (
  <h2 className="font-display text-body-m font-semibold text-text mb-3">
    {children}
  </h2>
);

const LandingFooter = () => {
  const { t } = useTranslation('landing');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
        <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
          <Link
            to="/"
            aria-label={t('nav.home')}
            className={`self-start ${FOCUS_RING}`}
          >
            <Logo variant="line" color="primary" />
          </Link>
          <p className="text-body-m text-text-weaker max-w-[36ch]">
            {t('footer.tagline', { year })}
          </p>
          <ul
            className="flex items-center gap-1"
            aria-label={t('footer.socialLinks')}
          >
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-11 w-11 items-center justify-center text-icon transition-colors hover:text-accent ${FOCUS_RING}`}
                >
                  <Icon size={20} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label={t('footer.product')}>
          <ColumnTitle>{t('footer.product')}</ColumnTitle>
          <ul className="flex flex-col gap-2">
            {PRODUCT_LINKS.map((item) => (
              <li key={item.hash}>
                <Link
                  to="/"
                  hash={item.hash}
                  resetScroll={false}
                  className={LINK_CLASS}
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t('footer.company')}>
          <ColumnTitle>{t('footer.company')}</ColumnTitle>
          <ul className="flex flex-col gap-2">
            <li>
              <Link to="/about" className={LINK_CLASS}>
                {t('links.about')}
              </Link>
            </li>
            <li>
              <Link to="/privacy" className={LINK_CLASS}>
                {t('links.privacy')}
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                onClick={trackContactClick('footer')}
                className={`${LINK_CLASS} break-all`}
              >
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};

export default LandingFooter;

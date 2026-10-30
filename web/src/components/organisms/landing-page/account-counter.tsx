import { useLocale } from '@/hooks/i18n/useLocale';
import { usePublicStats } from '@/hooks/stats/usePublicStats';
import { Trans } from 'react-i18next';

type Variant = 'hero' | 'final';

const PHRASES = {
  hero: 'accountCounter.hero',
  final: 'accountCounter.final',
} as const;

interface AccountCounterProps {
  variant: Variant;
  className?: string;
}

/**
 * Public verified-accounts line (the server counts verified emails, all roles).
 * Always mounted with a reserved line height (no layout shift); it stays empty
 * while loading, on error, or when the count is 0. Not a live region: the
 * count arrives once, and two of them (hero, final CTA) would both be read.
 */
const AccountCounter = ({ variant, className = '' }: AccountCounterProps) => {
  const { data } = usePublicStats();
  const { intlLocale } = useLocale();
  const count = data?.totalAccounts;
  const visible = typeof count === 'number' && count > 0;

  return (
    <p
      data-testid={`account-counter-${variant}`}
      className={`min-h-5 text-sm leading-5 text-text-weaker tabular-nums ${className}`}
    >
      {visible && (
        <Trans
          ns="landing"
          i18nKey={PHRASES[variant]}
          count={count}
          values={{
            formatted: new Intl.NumberFormat(intlLocale).format(count),
          }}
          components={{
            number: <span className="font-semibold text-text" />,
          }}
        />
      )}
    </p>
  );
};

export default AccountCounter;

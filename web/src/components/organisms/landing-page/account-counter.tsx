import { usePublicStats } from '@/hooks/stats/usePublicStats';

const NUMBER_FORMAT = new Intl.NumberFormat('en-US');

type Variant = 'hero' | 'final';

const PHRASES: Record<
  Variant,
  (count: number, number: React.ReactNode) => React.ReactNode
> = {
  hero: (count, number) => (
    <>
      {number} verified {count === 1 ? 'account' : 'accounts'} so far
    </>
  ),
  final: (count, number) => (
    <>
      Join {number} {count === 1 ? 'person' : 'people'} already preparing with
      Talkup.
    </>
  ),
};

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
  const count = data?.totalAccounts;
  const visible = typeof count === 'number' && count > 0;

  return (
    <p
      data-testid={`account-counter-${variant}`}
      className={`min-h-5 text-sm leading-5 text-text-weaker tabular-nums ${className}`}
    >
      {visible &&
        PHRASES[variant](
          count,
          <span className="font-semibold text-text">
            {NUMBER_FORMAT.format(count)}
          </span>,
        )}
    </p>
  );
};

export default AccountCounter;

import { usePublicStats } from '@/hooks/stats/usePublicStats';

const NUMBER_FORMAT = new Intl.NumberFormat('en-US');

type Variant = 'hero' | 'final';

const PHRASES: Record<
  Variant,
  (count: number, number: React.ReactNode) => React.ReactNode
> = {
  hero: (count, number) => (
    <>
      {number} {count === 1 ? 'account' : 'accounts'} created so far
    </>
  ),
  final: (count, number) => (
    <>
      Join {number} {count === 1 ? 'candidate' : 'candidates'} already preparing
      with Talkup.
    </>
  ),
};

interface AccountCounterProps {
  variant: Variant;
  className?: string;
}

/**
 * Public "accounts created" line. The live region is always mounted with a
 * reserved line height (no layout shift); it stays empty while loading, on
 * error, or when the count is 0. No count-up: animating digits inside an
 * aria-live region would flood screen readers.
 */
const AccountCounter = ({ variant, className = '' }: AccountCounterProps) => {
  const { data } = usePublicStats();
  const count = data?.totalAccounts;
  const visible = typeof count === 'number' && count > 0;

  return (
    <p
      aria-live="polite"
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

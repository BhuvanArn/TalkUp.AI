import { Trans, useTranslation } from 'react-i18next';

type SimulationQueueBannerProps = {
  queuePosition: number;
  estimatedWaitSec?: number;
  activeCount?: number;
  maxConcurrent?: number;
};

export default function SimulationQueueBanner({
  queuePosition,
  estimatedWaitSec,
  activeCount,
  maxConcurrent,
}: SimulationQueueBannerProps) {
  const { t } = useTranslation('app');
  const waitMin =
    estimatedWaitSec != null
      ? Math.max(1, Math.ceil(estimatedWaitSec / 60))
      : null;

  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"
      role="status"
      aria-live="polite"
    >
      <p className="font-medium">{t('simulations.queue.title')}</p>
      <p className="text-sm mt-1">
        <Trans
          ns="app"
          i18nKey="simulations.queue.position"
          values={{ position: queuePosition }}
          components={{ strong: <strong /> }}
        />
        {waitMin != null && (
          <>
            {' '}
            <Trans
              ns="app"
              i18nKey="simulations.queue.estimatedWait"
              values={{ minutes: waitMin }}
              components={{ strong: <strong /> }}
            />
          </>
        )}
      </p>
      {activeCount != null && maxConcurrent != null && (
        <p className="text-xs mt-2 text-amber-800">
          {t('simulations.queue.slots', {
            active: activeCount,
            max: maxConcurrent,
          })}
        </p>
      )}
    </div>
  );
}

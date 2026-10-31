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
      <p className="font-medium">Simulation queue</p>
      <p className="text-sm mt-1">
        Position:&nbsp;<strong>{queuePosition}</strong>
        {waitMin != null && (
          <>
            {' '}
            — estimated wait ~<strong>{waitMin}</strong> min
          </>
        )}
      </p>
      {activeCount != null && maxConcurrent != null && (
        <p className="text-xs mt-2 text-amber-800">
          {activeCount}/{maxConcurrent} GPU slots in use. Your session will
          start automatically.
        </p>
      )}
    </div>
  );
}

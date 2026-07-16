interface MatchGaugeProps {
  /** Match score 0-100; clamped defensively. */
  score: number;
}

/**
 * Score ring extracted from the goal-progress-card gauge (same radius /
 * circumference / stroke-dashoffset math, -rotate-90, rounded cap).
 * Token-only colors: success ring at >= 70, accent below, neutral track —
 * dark-mode safe because every token theme-flips.
 */
export const MatchGauge = ({ score }: MatchGaugeProps) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const normalized = Math.round(Math.min(100, Math.max(0, score)));
  const strokeDashoffset = circumference - (normalized / 100) * circumference;
  const ringColor = normalized >= 70 ? 'text-success' : 'text-accent';

  return (
    <div className="relative flex items-center justify-center">
      <svg
        className={`h-20 w-20 -rotate-90 transform ${ringColor}`}
        viewBox="0 0 80 80"
        role="img"
        aria-label={`Match score ${normalized}%`}
      >
        <circle
          className="text-neutral-weaker"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="40"
          cy="40"
        />
        <circle
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="40"
          cy="40"
        />
      </svg>
      <p className="text-h5 text-text absolute">{normalized}%</p>
    </div>
  );
};

export default MatchGauge;

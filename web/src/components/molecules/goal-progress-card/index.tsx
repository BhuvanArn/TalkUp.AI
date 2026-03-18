import React from 'react';

/**
 * @interface GoalProgressCardProps
 * @description Defines the props for the GoalProgressCard component.
 */
interface GoalProgressCardProps {
  /** The title of the progress card (e.g., "Next Goal"). */
  title: string;
  /** The current progress percentage (e.g., 75 for 75%). */
  progress: number;
  /** The target percentage to achieve (e.g., 70 for 70%). */
  target: number;
}

/**
 * @function GoalProgressCard
 * @description Component card displaying progress towards a target goal via a circular gauge (progress ring).
 * This version uses colors and borders for depth and removes all shadow and hover effects.
 * @param {GoalProgressCardProps} props - The component props.
 * @returns {JSX.Element} The Goal Progress Card component.
 */
const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
  title,
  progress,
  target,
}) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset =
    circumference - (normalizedProgress / 100) * circumference;

  const isGoalReached = progress >= target;
  const ringColor = isGoalReached ? 'text-success' : 'text-accent';
  const targetText = isGoalReached ? 'Goal Reached' : `→ ${target}% Target`;

  const cardStyle = {
    backgroundColor: '#f9fbfd',
    backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #f4f7fa 100%)',
    borderColor: 'var(--color-border)',
  };

  return (
    <div
      className={`
        p-5 rounded-xl border flex flex-col justify-between items-center
      `}
      style={cardStyle}
    >
      <h3 className="text-label-m text-idle mb-4">{title}</h3>

      <div className="flex items-center justify-center relative my-2">
        {/* Circular Progress Gauge (SVG) */}
        <svg
          className={`w-20 h-20 transform -rotate-90 ${ringColor}`}
          viewBox="0 0 80 80"
        >
          {/* Gray background circle */}
          <circle
            className="text-neutral-weaker"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="40"
            cy="40"
          />
          {/* Colored progress circle */}
          <circle
            className={`${ringColor}`}
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

        {/* Progress text in the center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-h5 text-active">{progress}%</p>
        </div>
      </div>

      <p className={`text-body-s ${ringColor} mt-4 text-center`}>
        {targetText}
      </p>
    </div>
  );
};

export default GoalProgressCard;

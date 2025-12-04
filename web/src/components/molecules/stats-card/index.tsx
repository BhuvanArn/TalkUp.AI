import { Icon } from '@/components/atoms/icon';
import React from 'react';

/**
 * @interface StatsCardProps
 * @description Defines the props for the StatsCard component.
 */
interface StatsCardProps {
  /** The main title of the statistic. */
  title: string;
  /** The primary value to display. */
  value: string;
  /** Detailed text, often showing change or context. */
  detail: string;
  /** Theme color for the card's top border. */
  color: 'green' | 'blue' | 'purple' | 'teal';
}

/**
 * @constant colorClasses
 * @description Maps theme colors to specific Tailwind classes for detail text and top border.
 */
const colorClasses = {
  green: { detailText: 'text-green-600', topBorder: 'border-t-green-500' },
  blue: { detailText: 'text-blue-600', topBorder: 'border-t-blue-500' },
  purple: { detailText: 'text-purple-600', topBorder: 'border-t-purple-500' },
  teal: { detailText: 'text-teal-600', topBorder: 'border-t-teal-500' },
};

/**
 * @function StatsCard
 * @description A customizable card component used to display key statistics.
 * This version uses colors and borders for depth and removes all shadow and hover effects.
 * @param {StatsCardProps} props - The component props.
 * @returns {JSX.Element} The Stats Card component.
 */
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  detail,
  color,
}) => {
  const classes = colorClasses[color];

  const trendUp = detail.includes('↑');
  const trendDown = detail.includes('↓');

  const trendColor = trendUp
    ? 'text-success'
    : trendDown
      ? 'text-error'
      : 'text-idle';

  return (
    <div
      className={`
        p-5 rounded-xl border flex flex-col justify-between 
        
        // La bordure supérieure colorée est conservée
        border-t-4 ${classes.topBorder}
        
        // Suppression de transition-all, shadow-sm, hover:shadow-xl, hover:scale-[1.01], hover:bg-accent-weaker et cursor-pointer
      `}
      style={{
        // Le dégradé de fond est conservé pour la profondeur par couleur
        backgroundColor: '#f9fbfd',
        backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #f4f7fa 100%)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-body-m text-idle">{title}</h3>

        {(trendUp || trendDown) && (
          <Icon
            icon={trendUp ? 'arrow-up' : 'arrow-down'}
            size="xs"
            className={`mt-0.5 ${trendColor}`}
          />
        )}
      </div>

      <div className="flex-grow">
        <p className="text-h4 text-active">{value}</p>
      </div>

      <p className={`text-body-s ${classes.detailText} mt-2`}>{detail}</p>
    </div>
  );
};

export default StatsCard;

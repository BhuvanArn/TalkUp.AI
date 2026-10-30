import { cn } from '@/utils/cn';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ActivityBubbleProps } from './types';
import { activityBubbleVariants } from './variants';

/**
 * Activity bubble component that shows user status with colored indicators.
 * Used in Avatar component but could also be used in services status.
 *
 * @component
 * @param {Object} props - The component props
 * @param {'online' | 'offline' | 'away' | 'busy'} props.status - The activity status
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - The size of the bubble
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} The activity bubble component
 */
export const ActivityBubble = React.forwardRef<
  HTMLDivElement,
  ActivityBubbleProps
>(({ status, size, className, ...props }, ref) => {
  const { t } = useTranslation('app');

  return (
    <div
      ref={ref}
      className={cn(activityBubbleVariants({ status, size }), className)}
      title={t('activity.title', {
        status: status ? t(`activity.status.${status}`) : '',
      })}
      {...props}
    />
  );
});

ActivityBubble.displayName = 'ActivityBubble';

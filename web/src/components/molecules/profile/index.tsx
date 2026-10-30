import { ActivityBubble } from '@/components/atoms/activity-bubble';
import { Avatar } from '@/components/atoms/avatar';
import { cn } from '@/utils/cn';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ProfileProps } from './types';

/**
 * Profile component that combines avatar, name, and activity status.
 *
 * @component
 * @param {Object} props - The component props
 * @param {string} props.name - The user's display name
 * @param {string} [props.src] - Avatar image source URL
 * @param {string} [props.alt] - Alt text for avatar image
 * @param {string} [props.fallback] - Fallback text for avatar (usually initials)
 * @param {'online' | 'offline' | 'away' | 'busy'} [props.activityStatus='offline'] - User activity status
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl'} [props.avatarSize='md'] - Size of the avatar
 * @param {boolean} [props.showActivity=true] - Whether to show activity bubble
 * @param {boolean} [props.showName=true] - Whether to show user name
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} The profile component
 */
export const Profile = React.forwardRef<HTMLDivElement, ProfileProps>(
  (
    {
      name,
      src,
      alt,
      fallback,
      activityStatus = 'offline',
      avatarSize = 'md',
      showActivity = true,
      showName = true,
      className,
      ...props
    },
    ref,
  ) => {
    const { t } = useTranslation('app');
    const displayFallback = fallback || name.charAt(0).toUpperCase();

    return (
      <div
        ref={ref}
        className={cn('flex items-center space-x-3', className)}
        {...props}
      >
        <div className="relative">
          <Avatar
            src={src}
            alt={alt || t('profile.avatarAlt', { name })}
            fallback={displayFallback}
            size={avatarSize}
          />
          {showActivity && (
            <ActivityBubble
              status={activityStatus}
              size={avatarSize === 'xs' || avatarSize === 'sm' ? 'sm' : 'md'}
            />
          )}
        </div>

        {showName && (
          <span className="text-sm font-medium text-text truncate">{name}</span>
        )}
      </div>
    );
  },
);

Profile.displayName = 'Profile';

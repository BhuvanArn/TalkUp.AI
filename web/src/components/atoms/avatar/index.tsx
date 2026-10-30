import { cn } from '@/utils/cn';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AvatarProps } from './types';
import { avatarVariants } from './variants';

/**
 * Avatar component that displays user profile images with fallback initials.
 *
 * @component
 * @param {Object} props - The component props
 * @param {string} [props.src] - The image source URL
 * @param {string} [props.alt] - Alt text for the image
 * @param {string} [props.fallback] - Fallback text (usually initials) when image is not available
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl'} [props.size='md'] - The size of the avatar
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} The avatar component
 */
export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, fallback, size, className, ...props }, ref) => {
    const { t } = useTranslation();
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
      setImageError(true);
    };

    const showFallback = !src || imageError;

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {!showFallback ? (
          <img
            src={src}
            alt={alt || t('avatar.alt')}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <span className="select-none">{fallback || '?'}</span>
        )}
      </div>
    );
  },
);

Avatar.displayName = 'Avatar';

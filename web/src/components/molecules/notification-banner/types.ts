import { IconName } from '@/components/atoms/icon/icon-map';

/**
 * Props for NotificationBanner component
 */
export interface NotificationBannerProps {
  /** Badge text (e.g., "New", "Update", etc.) */
  badge: string;

  /** Main title of the notification */
  title: string;

  /** Description or body text */
  description: string;

  /** Call-to-action button text */
  ctaText?: string;

  /** Icon to display in the CTA button */
  ctaIcon?: IconName;

  /** Callback when CTA button is clicked */
  onCtaClick?: () => void;

  /** Callback when dismiss button is clicked */
  onDismiss?: () => void;
}

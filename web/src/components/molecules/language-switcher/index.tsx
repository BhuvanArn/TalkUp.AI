import { Button } from '@/components/atoms/button';
import type {
  ButtonColor,
  ButtonSize,
  ButtonVariant,
} from '@/components/atoms/button/types';
import { Icon } from '@/components/atoms/icon';
import { type Language, changeLanguage, getLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';

export interface LanguageSwitcherProps {
  /** Button style, `outlined` by default */
  variant?: ButtonVariant;
  /** Button color, `neutral` by default */
  color?: ButtonColor;
  /** Button size, `sm` by default */
  size?: ButtonSize;
  /** ARIA role override, e.g. `menuitem` inside a menu */
  role?: string;
  /** Additional CSS classes */
  className?: string;
}

const NEXT_LANGUAGE: Record<Language, Language> = { en: 'fr', fr: 'en' };

/**
 * A molecule component that toggles the UI language between English and
 * French. The button shows the code of the language it switches to (like
 * ThemeToggle shows the mode it switches to); its accessible name announces the
 * current language too. The choice is saved in `localStorage` and wins over the
 * browser language on the next visit.
 *
 * Composed of:
 * - Button atom (container)
 * - Icon atom (visual indicator)
 *
 * @component
 * @example
 * ```tsx
 * import LanguageSwitcher from '@/components/molecules/language-switcher';
 *
 * function Header() {
 *   return (
 *     <header>
 *       <ThemeToggle />
 *       <LanguageSwitcher />
 *     </header>
 *   );
 * }
 * ```
 */
export const LanguageSwitcher = ({
  variant = 'outlined',
  color = 'neutral',
  size = 'sm',
  role,
  className,
}: LanguageSwitcherProps) => {
  const { t, i18n } = useTranslation('common');
  const current = getLanguage(i18n);
  const next = NEXT_LANGUAGE[current];
  const nextCode = next.toUpperCase();

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      role={role}
      className={className}
      onClick={() => void changeLanguage(next, i18n)}
      aria-label={t('languageSwitcher.ariaLabel', {
        current: t(`languages.${current}`),
        next: t(`languages.${next}`),
        nextCode,
      })}
    >
      <Icon icon="globe" size="sm" />
      <span className="ml-2" lang={next}>
        {nextCode}
      </span>
    </Button>
  );
};

export default LanguageSwitcher;

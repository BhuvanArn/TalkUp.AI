import { Button } from '@/components/atoms/button';
import type {
  ButtonColor,
  ButtonSize,
  ButtonVariant,
} from '@/components/atoms/button/types';
import { Icon } from '@/components/atoms/icon';
import { type Language, changeLanguage, getLanguage } from '@/i18n';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

export interface LanguageSwitcherProps {
  /** Button style, `outlined` by default. Ignored when `unstyled`. */
  variant?: ButtonVariant;
  /** Button color, `neutral` by default. Ignored when `unstyled`. */
  color?: ButtonColor;
  /** Button size, `sm` by default. Ignored when `unstyled`. */
  size?: ButtonSize;
  /**
   * Render a plain `<button>` styled only by `className`, without the Button
   * atom's classes (e.g. to match sibling buttons inside a menu).
   */
  unstyled?: boolean;
  /** ARIA role override, e.g. `menuitem` inside a menu */
  role?: string;
  /** Additional CSS classes (the only classes when `unstyled`) */
  className?: string;
}

const NEXT_LANGUAGE: Record<Language, Language> = { en: 'fr', fr: 'en' };

/**
 * A molecule component that toggles the UI language between English and
 * French. The button shows the code of the language it switches to (like
 * ThemeToggle shows the mode it switches to). Its accessible name starts with
 * that visible code, then names the target language (marked with its own
 * `lang`) and the current one: "FR Switch to Français (current language:
 * English)". The choice is saved in `localStorage` and wins over the browser
 * language on the next visit.
 *
 * Composed of:
 * - Button atom (container), or a plain `<button>` when `unstyled`
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
  unstyled = false,
  role,
  className,
}: LanguageSwitcherProps) => {
  const { t, i18n } = useTranslation('common');
  const id = useId();
  const current = getLanguage(i18n);
  const next = NEXT_LANGUAGE[current];

  const ids = {
    code: `${id}-code`,
    switchTo: `${id}-switch-to`,
    next: `${id}-next`,
    current: `${id}-current`,
  };

  const content = (
    <>
      <Icon icon="globe" size="sm" />
      <span id={ids.code} className="ml-2" lang={next}>
        {next.toUpperCase()}
      </span>
      <span className="sr-only">
        <span id={ids.switchTo}>{t('languageSwitcher.switchTo')}</span>
        <span id={ids.next} lang={next}>
          {t(`languages.${next}`)}
        </span>
        <span id={ids.current}>
          {t('languageSwitcher.current', {
            current: t(`languages.${current}`),
          })}
        </span>
      </span>
    </>
  );

  const buttonProps = {
    type: 'button' as const,
    role,
    'aria-labelledby': `${ids.code} ${ids.switchTo} ${ids.next} ${ids.current}`,
    onClick: () => void changeLanguage(next, i18n),
  };

  if (unstyled) {
    return (
      <button {...buttonProps} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Button
      {...buttonProps}
      variant={variant}
      color={color}
      size={size}
      className={className}
    >
      {content}
    </Button>
  );
};

export default LanguageSwitcher;

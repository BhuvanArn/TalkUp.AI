import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

/**
 * A molecule component that provides a button to toggle between light and dark themes
 *
 * Composed of:
 * - Button atom (container)
 * - Icon atom (visual indicator)
 *
 * @component
 * @example
 * ```tsx
 * import ThemeToggle from '@/components/molecules/theme-toggle';
 *
 * function Header() {
 *   return (
 *     <header>
 *       <ThemeToggle />
 *     </header>
 *   );
 * }
 * ```
 */
export const ThemeToggle = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="contained"
      color="accent"
      size="sm"
      onClick={toggleTheme}
      aria-label={t('themeToggle.toggle')}
    >
      <Icon icon={theme === 'light' ? 'moon' : 'sun'} size="sm" />
      <span className="ml-2">
        {theme === 'light' ? t('themeToggle.dark') : t('themeToggle.light')}
      </span>
    </Button>
  );
};

export default ThemeToggle;

import { Icon } from '@/components/atoms/icon';
import Logo from '@/components/molecules/logo';
import { Link } from '@tanstack/react-router';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface AuthPageShellProps {
  children: ReactNode;
}

const AuthPageShell = ({ children }: AuthPageShellProps) => {
  const { t } = useTranslation('auth');

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen px-4 gap-8">
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-1 text-body-m text-text-weak hover:text-accent transition-colors"
      >
        <Icon icon="arrow-left" size="sm" aria-hidden focusable={false} />
        {t('pageShell.backToHome')}
      </Link>
      <Link to="/" aria-label={t('pageShell.homeLink')}>
        <Logo variant="line" color="primary" />
      </Link>
      {children}
    </div>
  );
};

export default AuthPageShell;

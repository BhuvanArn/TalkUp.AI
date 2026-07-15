import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import Logo from '@/components/molecules/logo';
import { Link, useRouter } from '@tanstack/react-router';

interface NotFoundPageProps {
  isAuthenticated?: boolean;
}

/**
 * 404 page. Purely presentational — `__root.tsx` decides the surrounding shell
 * and passes the auth state down.
 */
const NotFoundPage = ({ isAuthenticated = false }: NotFoundPageProps) => {
  const router = useRouter();

  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center py-16 px-4">
      {!isAuthenticated && (
        <Link
          to="/"
          aria-label="TalkUp home"
          className="mb-10"
          data-testid="not-found-logo"
        >
          <Logo variant="no-text" color="primary" />
        </Link>
      )}

      <div className="bg-neutral-weaker rounded-full p-6 mb-6">
        <Icon
          icon="search"
          className="w-12 h-12 text-text-weaker"
          aria-hidden
          focusable={false}
        />
      </div>

      <p className="text-h5 text-text-weaker mb-2">404</p>
      {/* The page's only h1. The logo above uses `no-text` so it renders no
          competing heading, and the sidebar's h1 disappears when collapsed. */}
      <h1 className="text-h2 text-text-idle mb-2 text-center">
        Page not found
      </h1>
      <p className="text-body-m text-text-weaker mb-8 text-center max-w-md">
        This page doesn&apos;t exist, or it moved somewhere else. Check the
        address, or head back to familiar ground.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="contained" color="accent" asChild>
          <Link to={isAuthenticated ? '/applications' : '/'}>Go home</Link>
        </Button>

        {isAuthenticated ? (
          <Button
            variant="text"
            color="accent"
            onClick={() => router.history.back()}
          >
            <Icon icon="arrow-left" size="sm" aria-hidden focusable={false} />
            Go back
          </Button>
        ) : (
          <Button variant="text" color="accent" asChild>
            <Link to="/login">Log in</Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default NotFoundPage;

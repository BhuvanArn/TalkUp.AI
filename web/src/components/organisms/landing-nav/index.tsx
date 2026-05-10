import { Button } from '@/components/atoms/button';
import Logo from '@/components/molecules/logo';
import ThemeToggle from '@/components/molecules/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#testimonials', label: 'Testimonials' },
];

const LandingNav = () => {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-200 ${
        scrolled
          ? 'bg-background/85 backdrop-blur border-b border-border'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link
          to="/"
          aria-label="TalkUp home"
          className="flex items-center gap-2"
        >
          <Logo variant="line" color="primary" />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-body-m text-text-weak hover:text-accent transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <Link to="/profile">
              <Button variant="contained" color="accent" size="sm">
                Open app
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="text" color="neutral" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="contained" color="accent" size="sm">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-text"
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1">
            <span className="block h-0.5 w-5 bg-text" />
            <span className="block h-0.5 w-5 bg-text" />
            <span className="block h-0.5 w-5 bg-text" />
          </div>
        </button>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <ul className="flex flex-col gap-2 px-6 py-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-2 text-body-l text-text hover:text-accent"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="mt-2 flex flex-col gap-2">
              <ThemeToggle />
              {isAuthenticated ? (
                <Link to="/profile" onClick={() => setOpen(false)}>
                  <Button
                    variant="contained"
                    color="accent"
                    size="sm"
                    className="w-full"
                  >
                    Open app
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button
                      variant="outlined"
                      color="neutral"
                      size="sm"
                      className="w-full"
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)}>
                    <Button
                      variant="contained"
                      color="accent"
                      size="sm"
                      className="w-full"
                    >
                      Get started
                    </Button>
                  </Link>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default LandingNav;

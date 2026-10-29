import { Button } from '@/components/atoms/button';
import Logo from '@/components/molecules/logo';
import ThemeToggle from '@/components/molecules/theme-toggle';
import { APP_HOME } from '@/config/routes.config';
import { useAuthStatus } from '@/hooks/auth/useServices';
import { trackCtaClick } from '@/utils/analytics';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import {
  LANDING_FOCUS_RING as FOCUS_RING,
  LANDING_SECTION_LINKS as SECTION_LINKS,
} from './landing-links';

const DESKTOP_LINK_CLASS = `rounded-sm text-body-m text-text-weaker transition-colors hover:text-text aria-[current=page]:text-text ${FOCUS_RING}`;
const MOBILE_LINK_CLASS = `block rounded-sm py-2 text-body-l text-text hover:text-accent aria-[current=page]:text-accent ${FOCUS_RING}`;

const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Same query (and cache key) the root layout already runs on every public
  // page, so this adds no request. Guest CTAs show until the user is known to
  // be signed in: on `/` (signed-in users are redirected away) they never wait.
  const { data: authStatus } = useAuthStatus();
  const isAuthenticated = authStatus?.isAuthenticated ?? false;

  const close = () => setOpen(false);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-200 ${
        scrolled
          ? 'bg-background/85 backdrop-blur border-b border-border'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6"
      >
        <Link
          to="/"
          aria-label="TalkUp home"
          className={`flex items-center gap-2 rounded-sm ${FOCUS_RING}`}
        >
          <Logo variant="line" color="primary" />
        </Link>

        <ul className="ml-auto hidden items-center gap-6 lg:flex">
          {SECTION_LINKS.map((link) => (
            <li key={link.hash}>
              <Link
                to="/"
                hash={link.hash}
                resetScroll={false}
                activeOptions={{ includeHash: true }}
                className={DESKTOP_LINK_CLASS}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/about" className={DESKTOP_LINK_CLASS}>
              About
            </Link>
          </li>
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          {/* Sized to what it shows, so signed-in users get no gap next to
              Open the app. A signed-in user reloading /about or /privacy sees
              the links shift once when the status arrives: accepted, rather
              than a permanent gap for every signed-in visitor. */}
          {isAuthenticated ? (
            <Button
              asChild
              variant="contained"
              color="accent"
              size="sm"
              className={FOCUS_RING}
            >
              <Link to={APP_HOME}>Open the app</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="text"
                color="neutral"
                size="sm"
                className={FOCUS_RING}
              >
                <Link to="/login">Log in</Link>
              </Button>
              <Button
                asChild
                variant="contained"
                color="accent"
                size="sm"
                className={FOCUS_RING}
              >
                <Link
                  to="/register"
                  onClick={trackCtaClick('nav', '/register')}
                >
                  Create an account
                </Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className={`lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-text ${FOCUS_RING}`}
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1" aria-hidden="true">
            <span className="block h-0.5 w-5 bg-text" />
            <span className="block h-0.5 w-5 bg-text" />
            <span className="block h-0.5 w-5 bg-text" />
          </div>
        </button>
      </nav>

      {open && (
        <div
          id="landing-mobile-menu"
          className="lg:hidden border-t border-border bg-background"
        >
          <ul className="flex flex-col gap-2 px-4 py-4 sm:px-6">
            {SECTION_LINKS.map((link) => (
              <li key={link.hash}>
                <Link
                  to="/"
                  hash={link.hash}
                  resetScroll={false}
                  activeOptions={{ includeHash: true }}
                  onClick={close}
                  className={MOBILE_LINK_CLASS}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/about" onClick={close} className={MOBILE_LINK_CLASS}>
                About
              </Link>
            </li>
            <li className="mt-2 flex flex-col gap-2">
              <ThemeToggle />
              {/* As on desktop, nothing is reserved: if the status arrives while
                  the menu is open (slow network), the two guest buttons become one.
                  Accepted: the menu usually opens after the status is known. */}
              {isAuthenticated ? (
                <Button
                  asChild
                  variant="contained"
                  color="accent"
                  size="md"
                  className={`w-full ${FOCUS_RING}`}
                >
                  <Link to={APP_HOME} onClick={close}>
                    Open the app
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outlined"
                    color="neutral"
                    size="md"
                    className={`w-full ${FOCUS_RING}`}
                  >
                    <Link to="/login" onClick={close}>
                      Log in
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="contained"
                    color="accent"
                    size="md"
                    className={`w-full ${FOCUS_RING}`}
                  >
                    <Link
                      to="/register"
                      onClick={() => {
                        trackCtaClick('nav', '/register')();
                        close();
                      }}
                    >
                      Create an account
                    </Link>
                  </Button>
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

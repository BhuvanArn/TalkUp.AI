import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
}

/**
 * Traps keyboard focus inside a container while `isActive`.
 *
 * The codebase has no focus-trap library and no other hand-rolled trap, so this
 * is the shared primitive: attach the returned ref to a dialog container.
 *
 * - Moves focus into the container on activate: `getInitialFocus()` when given,
 *   otherwise the first focusable child.
 * - Cycles Tab / Shift+Tab within the container.
 * - Restores focus to the previously focused element on deactivate.
 *
 * Roving selection *within* a radiogroup is the consumer's job — this hook only
 * owns the Tab boundary. Pass `getInitialFocus` when the first focusable child
 * is not where the user should land (e.g. a leading close button). It is a
 * getter, not a ref, so it resolves after children have mounted.
 *
 * @example
 * ```tsx
 * const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);
 * return isOpen ? <div ref={dialogRef} role="dialog">…</div> : null;
 * ```
 */
export function useFocusTrap<T extends HTMLElement>(
  isActive: boolean,
  options?: { getInitialFocus?: () => HTMLElement | null },
) {
  const containerRef = useRef<T | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  // Read through a ref so a caller's inline arrow does not re-run the effect
  // (and re-steal focus) on every render.
  const getInitialFocusRef = useRef(options?.getInitialFocus);
  getInitialFocusRef.current = options?.getInitialFocus;

  useEffect(() => {
    if (!isActive) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (container) {
      const focusable = getFocusable(container);
      (getInitialFocusRef.current?.() ?? focusable[0] ?? container).focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const currentContainer = containerRef.current;
      if (!currentContainer) return;

      const focusable = getFocusable(currentContainer);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isActive]);

  return containerRef;
}

export default useFocusTrap;

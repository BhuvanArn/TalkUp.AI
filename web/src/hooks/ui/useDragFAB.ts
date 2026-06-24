import { useCallback, useEffect, useRef, useState } from 'react';

/** FAB diameter in px (w-14 h-14). Used to keep the button inside the viewport. */
const FAB_SIZE = 56;
/** Resting gap from the anchored corner in px (bottom-24 / right-24). */
const ANCHOR_GAP = 24;
/**
 * Delay before clearing the drag flag after a press ends. A synthetic click
 * fires right after mouseup/touchend; keeping the flag set briefly lets the
 * FAB click handler tell a drag from a tap.
 */
const CLICK_GUARD_MS = 50;

/**
 * useDragFAB
 *
 * Encapsulates the drag behaviour of a floating action button.
 * Handles both mouse and touch input through a single code path,
 * tracks an offset position, and exposes an `isDragging` ref so a
 * click handler can distinguish a drag from a tap.
 *
 * Document-level listeners are registered only while a drag is active
 * and are always removed — both on drag end and on unmount — so they
 * never leak if the component unmounts mid-drag.
 *
 * @returns position (offset from the anchored corner), the press
 * handlers to spread onto the FAB, and the isDragging ref.
 *
 * @example
 * const { position, onMouseDown, onTouchStart, isDragging } = useDragFAB();
 */
export const useDragFAB = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cleanupRef = useRef<(() => void) | undefined>(undefined);
  const clearDragRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const beginDrag = useCallback(
    (clientX: number, clientY: number) => {
      isDragging.current = false;
      dragStart.current = {
        x: clientX - position.x,
        y: clientY - position.y,
      };
    },
    [position],
  );

  const moveTo = useCallback((clientX: number, clientY: number) => {
    isDragging.current = true;
    // The FAB is anchored to the bottom-right corner via `bottom: ANCHOR_GAP - y`
    // and `right: ANCHOR_GAP - x`. Clamp the offset so the button can never be
    // dragged outside the viewport (which would leave it unreachable).
    const rawX = clientX - dragStart.current.x;
    const rawY = clientY - dragStart.current.y;
    const minX = ANCHOR_GAP - (window.innerWidth - FAB_SIZE);
    const minY = ANCHOR_GAP - (window.innerHeight - FAB_SIZE);
    setPosition({
      x: Math.min(ANCHOR_GAP, Math.max(minX, rawX)),
      y: Math.min(ANCHOR_GAP, Math.max(minY, rawY)),
    });
  }, []);

  const endDrag = useCallback(() => {
    cleanupRef.current?.();
    // Defer clearing the drag flag so the synthetic click that fires after a
    // mouseup/touchend (tap-vs-drag detection) still sees isDragging === true.
    // Same path for mouse and touch so behaviour can't diverge by device.
    clearTimeout(clearDragRef.current);
    clearDragRef.current = setTimeout(() => {
      isDragging.current = false;
      clearDragRef.current = undefined;
    }, CLICK_GUARD_MS);
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Tear down any listeners still registered from a previous press that
      // never received its mouseup/touchend, otherwise the FAB keeps following
      // the pointer (overlapping-press listener leak).
      cleanupRef.current?.();
      beginDrag(e.clientX, e.clientY);

      const onMove = (ev: MouseEvent) => moveTo(ev.clientX, ev.clientY);
      const onUp = () => endDrag();

      cleanupRef.current = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        cleanupRef.current = undefined;
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [beginDrag, moveTo, endDrag],
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      cleanupRef.current?.();
      const touch = e.touches[0];
      beginDrag(touch.clientX, touch.clientY);

      const onMove = (ev: TouchEvent) => {
        ev.preventDefault();
        const t = ev.touches[0];
        moveTo(t.clientX, t.clientY);
      };
      const onEnd = () => endDrag();

      cleanupRef.current = () => {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        cleanupRef.current = undefined;
      };

      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    },
    [beginDrag, moveTo, endDrag],
  );

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      clearTimeout(clearDragRef.current);
    };
  }, []);

  return { position, onMouseDown, onTouchStart, isDragging };
};

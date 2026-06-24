import { useCallback, useEffect, useRef, useState } from 'react';

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
    setPosition({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y,
    });
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      beginDrag(e.clientX, e.clientY);

      const onMove = (ev: MouseEvent) => moveTo(ev.clientX, ev.clientY);
      const onUp = () => cleanupRef.current?.();

      cleanupRef.current = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        cleanupRef.current = undefined;
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [beginDrag, moveTo],
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      beginDrag(touch.clientX, touch.clientY);

      const onMove = (ev: TouchEvent) => {
        ev.preventDefault();
        const t = ev.touches[0];
        moveTo(t.clientX, t.clientY);
      };
      const onEnd = () => {
        cleanupRef.current?.();
        setTimeout(() => {
          isDragging.current = false;
        }, 10);
      };

      cleanupRef.current = () => {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        cleanupRef.current = undefined;
      };

      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    },
    [beginDrag, moveTo],
  );

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  return { position, onMouseDown, onTouchStart, isDragging };
};

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDragFAB } from './useDragFAB';

const FAB_SIZE = 56;
const ANCHOR_GAP = 24;

/** Build a minimal React.MouseEvent-ish object for the press handlers. */
const mouseEvent = (clientX: number, clientY: number) =>
  ({ clientX, clientY }) as unknown as React.MouseEvent;

/** Build a minimal React.TouchEvent-ish object for the press handlers. */
const touchEvent = (clientX: number, clientY: number) =>
  ({
    touches: [{ clientX, clientY }],
  }) as unknown as React.TouchEvent;

const fireMouseMove = (clientX: number, clientY: number) =>
  document.dispatchEvent(new MouseEvent('mousemove', { clientX, clientY }));

const fireMouseUp = () => document.dispatchEvent(new MouseEvent('mouseup'));

describe('useDragFAB', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom defaults to 1024x768; pin it so clamp math is deterministic.
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('starts anchored at the corner with no offset', () => {
    const { result } = renderHook(() => useDragFAB());
    expect(result.current.position).toEqual({ x: 0, y: 0 });
    expect(result.current.isDragging.current).toBe(false);
  });

  it('updates position as the pointer moves', () => {
    const { result } = renderHook(() => useDragFAB());

    act(() => result.current.onMouseDown(mouseEvent(100, 100)));
    act(() => fireMouseMove(90, 80));

    // offset = clientNow - (clientStart - prevOffset) = 90-100, 80-100
    expect(result.current.position).toEqual({ x: -10, y: -20 });
    expect(result.current.isDragging.current).toBe(true);
  });

  it('clamps the offset so the FAB cannot leave the viewport', () => {
    const { result } = renderHook(() => useDragFAB());

    // Drag far past the top-left corner.
    act(() => result.current.onMouseDown(mouseEvent(100, 100)));
    act(() => fireMouseMove(-5000, -5000));

    const minX = ANCHOR_GAP - (window.innerWidth - FAB_SIZE);
    const minY = ANCHOR_GAP - (window.innerHeight - FAB_SIZE);
    expect(result.current.position.x).toBe(minX);
    expect(result.current.position.y).toBe(minY);

    // Drag far past the bottom-right corner: capped at the resting gap.
    act(() => result.current.onMouseDown(mouseEvent(0, 0)));
    act(() => fireMouseMove(5000, 5000));
    expect(result.current.position.x).toBe(ANCHOR_GAP);
    expect(result.current.position.y).toBe(ANCHOR_GAP);
  });

  it('treats a press with no movement as a tap (isDragging stays false)', () => {
    const { result } = renderHook(() => useDragFAB());

    act(() => result.current.onMouseDown(mouseEvent(50, 50)));
    act(() => fireMouseUp());

    // The click guard timer has not yet cleared, but no move ever fired.
    expect(result.current.isDragging.current).toBe(false);
  });

  it('keeps isDragging true through the synthetic click after a drag, then clears it', () => {
    const { result } = renderHook(() => useDragFAB());

    act(() => result.current.onMouseDown(mouseEvent(100, 100)));
    act(() => fireMouseMove(40, 40));
    act(() => fireMouseUp());

    // Immediately after release the flag is still set so the click handler
    // can suppress the toggle.
    expect(result.current.isDragging.current).toBe(true);

    act(() => vi.advanceTimersByTime(60));
    expect(result.current.isDragging.current).toBe(false);
  });

  it('does not leak listeners when a second press starts before the first ends', () => {
    const { result } = renderHook(() => useDragFAB());

    const removeSpy = vi.spyOn(document, 'removeEventListener');

    // First press, no mouseup.
    act(() => result.current.onMouseDown(mouseEvent(100, 100)));
    // Second press while the first is still "held" must tear down the first.
    act(() => result.current.onMouseDown(mouseEvent(200, 200)));

    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

    // After the cleanup, the stale first listener must no longer move the FAB.
    // Only the second press's listener is live now.
    act(() => fireMouseMove(180, 180));
    // offset from the second press: 180-200 = -20 on both axes.
    expect(result.current.position).toEqual({ x: -20, y: -20 });

    removeSpy.mockRestore();
  });

  it('removes document listeners on unmount mid-drag', () => {
    const { result, unmount } = renderHook(() => useDragFAB());
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    act(() => result.current.onMouseDown(mouseEvent(10, 10)));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('supports touch input through the same code path', () => {
    const { result } = renderHook(() => useDragFAB());

    act(() => result.current.onTouchStart(touchEvent(100, 100)));
    act(() =>
      document.dispatchEvent(
        Object.assign(new Event('touchmove'), {
          touches: [{ clientX: 70, clientY: 60 }],
          preventDefault: () => {},
        }),
      ),
    );

    expect(result.current.position).toEqual({ x: -30, y: -40 });
    expect(result.current.isDragging.current).toBe(true);
  });
});

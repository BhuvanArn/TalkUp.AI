import { Button } from '@/components/atoms/button';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

/** When set, the dock is fixed to this viewport rectangle (e.g. main content column), not the full window. */
export interface UnsavedChangesCtaAnchorRect {
  left: number;
  width: number;
}

interface UnsavedChangesCtaProps {
  isVisible: boolean;
  isSaved: boolean;
  onSave: () => void;
  onReset: () => void;
  attentionTrigger?: number;
  /** Aligns the bar with a layout region (e.g. profile column inside `<main>`). Omit to span the viewport. */
  anchorRect?: UnsavedChangesCtaAnchorRect | null;
  message?: string;
  saveLabel?: string;
  savedLabel?: string;
  resetLabel?: string;
}

/**
 * Floating action CTA for unsaved form changes.
 * Keeps layout stable by staying mounted and animating visibility.
 */
export const UnsavedChangesCta = ({
  isVisible,
  isSaved,
  onSave,
  onReset,
  attentionTrigger = 0,
  anchorRect = null,
  message = 'You have unsaved changes',
  saveLabel = 'Save changes',
  savedLabel = 'Saved',
  resetLabel = 'Reset',
}: UnsavedChangesCtaProps) => {
  const [isAttentionActive, setIsAttentionActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const attentionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (attentionTrigger <= 0 || !isVisible) {
      return;
    }

    setIsAttentionActive(true);

    if (attentionTimeoutRef.current) {
      clearTimeout(attentionTimeoutRef.current);
    }
    attentionTimeoutRef.current = setTimeout(() => {
      setIsAttentionActive(false);
    }, 750);

    const y = isVisible ? '0' : '10px';
    const element = containerRef.current;
    if (element && typeof element.animate === 'function') {
      element.animate(
        [
          { transform: `translate3d(0, ${y}, 0)` },
          { transform: `translate3d(-6px, ${y}, 0)` },
          { transform: `translate3d(6px, ${y}, 0)` },
          { transform: `translate3d(-4px, ${y}, 0)` },
          { transform: `translate3d(4px, ${y}, 0)` },
          { transform: `translate3d(0, ${y}, 0)` },
        ],
        {
          duration: 360,
          easing: 'ease-out',
        },
      );
    }
  }, [attentionTrigger, isVisible]);

  useEffect(
    () => () => {
      if (attentionTimeoutRef.current) {
        clearTimeout(attentionTimeoutRef.current);
      }
    },
    [],
  );

  const dockPositionStyle: CSSProperties = anchorRect
    ? {
        left: anchorRect.left,
        width: anchorRect.width,
        right: 'auto',
        justifyContent: 'stretch',
        paddingLeft: 0,
        paddingRight: 0,
      }
    : {};

  return (
    <div style={{ ...dockStyle, ...dockPositionStyle }} aria-hidden={!isVisible}>
      <div
        ref={containerRef}
        style={{
          ...barStyle,
          ...(anchorRect ? { maxWidth: 'none' } : {}),
          borderColor: isAttentionActive
            ? 'var(--color-error)'
            : 'var(--color-border)',
          boxShadow: isAttentionActive
            ? '0 0 0 2px var(--color-error-weaker), 0 12px 32px rgba(0, 0, 0, 0.18)'
            : barStyle.boxShadow,
          opacity: isVisible ? 1 : 0,
          transform: `translateY(${isVisible ? '0' : '14px'})`,
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
        data-testid="floating-save-menu"
        data-attention={isAttentionActive ? 'true' : 'false'}
        aria-hidden={!isVisible}
      >
        <span style={labelStyle}>{message}</span>
        <div style={actionsStyle}>
          <Button
            type="button"
            variant="outlined"
            color="neutral"
            onClick={onReset}
            data-testid="reset-changes-button"
            className="min-h-10 rounded-[10px] border-border bg-background px-[18px] text-sm font-medium text-text"
          >
            {resetLabel}
          </Button>
          <Button
            type="button"
            variant="contained"
            color="accent"
            onClick={onSave}
            data-testid="save-button"
            className="min-h-10 rounded-[10px] px-5 text-sm font-semibold"
          >
            {isSaved ? savedLabel : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

/** Full-width dock: centers the bar and keeps side margins on narrow viewports. */
const dockStyle: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 120,
  display: 'flex',
  justifyContent: 'center',
  paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))',
  paddingRight: 'max(12px, env(safe-area-inset-right, 0px))',
  paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
  pointerEvents: 'none',
};

const barStyle: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  maxWidth: 720,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  background: 'var(--color-surface-raised)',
  border: '1px solid var(--color-border)',
  borderRadius: 14,
  padding: '14px 18px',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
  transition: 'opacity 180ms ease, transform 180ms ease, border-color 200ms ease, box-shadow 200ms ease',
};

const labelStyle: CSSProperties = {
  flex: '1 1 200px',
  minWidth: 0,
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.35,
  color: 'var(--color-text)',
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 10,
  flex: '0 1 auto',
};

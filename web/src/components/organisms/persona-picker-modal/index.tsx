import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import {
  DEFAULT_PERSONA,
  PERSONAS,
  type PersonaDifficulty,
  type RecruiterPersona,
} from '@/config/personas';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { cn } from '@/utils/cn';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { PersonaPickerModalProps } from './types';

/**
 * Difficulty is always carried by the level word — the gauge's width and
 * colour only reinforce it, so the meaning survives greyscale and
 * colour-blindness.
 */
const DIFFICULTY_META: Record<
  PersonaDifficulty,
  { label: string; width: string; barClass: string; textClass: string }
> = {
  easy: {
    label: 'EASY',
    width: '33%',
    barClass: 'bg-success',
    textClass: 'text-success',
  },
  medium: {
    label: 'MEDIUM',
    width: '66%',
    barClass: 'bg-warning',
    textClass: 'text-warning',
  },
  hard: {
    label: 'HARD',
    width: '100%',
    barClass: 'bg-error',
    textClass: 'text-error',
  },
};

/**
 * Modal for casting the AI recruiter before a simulation.
 *
 * Controlled component: `isOpen`/`onSelect`/`onDismiss` only — persistence is
 * the caller's job. Highlighting (roving radio) and committing (`onSelect`)
 * are deliberately separate steps so arrowing through the cast never starts
 * a simulation by accident.
 */
export function PersonaPickerModal({
  isOpen,
  initialHighlight = DEFAULT_PERSONA,
  onSelect,
  onDismiss,
}: PersonaPickerModalProps) {
  const [highlighted, setHighlighted] =
    useState<RecruiterPersona>(initialHighlight);
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);
  const radioRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onDismiss]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const move = (delta: number) => {
    const index = PERSONAS.findIndex(
      (persona) => persona.id === highlighted.id,
    );
    const next = (index + delta + PERSONAS.length) % PERSONAS.length;
    const persona = PERSONAS[next];
    setHighlighted(persona);
    // Roving tabindex: keyboard focus follows the checked radio.
    radioRefs.current[persona.id]?.focus();
  };

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(highlighted);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close persona picker"
        className="absolute inset-0 bg-scrim/50 transition-opacity"
        onClick={onDismiss}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="persona-picker-title"
        className="animate-fadeIn relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="persona-picker-title" className="text-h4 text-text">
              Choose your interviewer
            </h2>
            <p className="mt-1.5 max-w-prose text-body-m text-text-weaker">
              Difficulty changes how demanding the questions are — you always
              get to finish your answer.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onDismiss}
            className="-mr-1 -mt-1 shrink-0 rounded-md p-2 text-icon transition-colors hover:bg-surface-raised hover:text-icon-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon icon="times" className="h-5 w-5" />
          </button>
        </div>

        {/*
          onKeyDown lives on the group, not each radio: roving tabindex means
          only the checked radio is reachable, so the group is the one element
          guaranteed to receive the key event from any reachable focus point.
          This is the WAI-ARIA radiogroup pattern.
        */}
        <div
          role="radiogroup"
          aria-labelledby="persona-picker-title"
          onKeyDown={handleKeyDown}
          className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {PERSONAS.map((persona) => {
            const meta = DIFFICULTY_META[persona.difficulty];
            const isHighlighted = persona.id === highlighted.id;
            return (
              // Key events are handled by the radiogroup above (roving
              // tabindex), not per radio — see the comment on the group.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <div
                key={persona.id}
                ref={(element) => {
                  radioRefs.current[persona.id] = element;
                }}
                role="radio"
                aria-checked={isHighlighted}
                tabIndex={isHighlighted ? 0 : -1}
                onClick={() => setHighlighted(persona)}
                className={cn(
                  'flex cursor-pointer flex-col rounded-xl border p-4 transition-colors duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  isHighlighted
                    ? 'border-accent bg-accent-weaker ring-1 ring-accent'
                    : 'border-border bg-surface hover:border-border-hover hover:bg-surface-hover',
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-base font-semibold text-white',
                      persona.accentClass,
                    )}
                  >
                    {persona.initials}
                  </span>
                  <span className="min-w-0">
                    <p className="font-display text-base font-semibold leading-tight text-text">
                      {persona.name}
                    </p>
                    <p className="mt-0.5 text-body-s text-text-weaker">
                      {persona.role}
                    </p>
                  </span>
                </div>

                <p className="mb-4 mt-3 text-body-s text-text-weak">
                  {persona.description}
                </p>

                <div className="mt-auto border-t border-border pt-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-text-weakest">
                      Difficulty
                    </span>
                    <span
                      className={cn(
                        'font-display text-xs font-bold tracking-[0.08em]',
                        meta.textClass,
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border"
                  >
                    <div
                      className={cn('h-full rounded-full', meta.barClass)}
                      style={{ width: meta.width }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="text"
            color="neutral"
            onClick={onDismiss}
            className="font-display"
          >
            Skip — use Sophie
          </Button>
          <Button
            variant="contained"
            color="accent"
            onClick={() => onSelect(highlighted)}
            className="font-display"
          >
            Start with {highlighted.name}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PersonaPickerModal;

import { cn } from '@/utils/cn';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface TimeComboBoxProps {
  value: string;
  onChange: (val: string) => void;
}

const MINUTES_IN_DAY = 24 * 60;
const STEP_MINUTES = 15;
const MAX_VALID_MINUTES = MINUTES_IN_DAY - STEP_MINUTES;

const formatMinutes = (minutes: number): string => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const parseTypedTime = (rawValue: string): string | null => {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  const compact = value.replace(/\s+/g, '');
  let hour: number;
  let minute: number;

  if (compact.includes(':')) {
    const [rawHour = '', rawMinute = '0'] = compact.split(':');
    hour = Number.parseInt(rawHour, 10);
    minute = Number.parseInt(rawMinute, 10);
  } else {
    const digits = compact.replace(/\D/g, '');

    if (!digits) {
      return null;
    }

    if (digits.length <= 2) {
      hour = Number.parseInt(digits, 10);
      minute = 0;
    } else if (digits.length === 3) {
      hour = Number.parseInt(digits.slice(0, 1), 10);
      minute = Number.parseInt(digits.slice(1), 10);
    } else {
      hour = Number.parseInt(digits.slice(0, 2), 10);
      minute = Number.parseInt(digits.slice(2, 4), 10);
    }
  }

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  const clampedHour = Math.min(Math.max(hour, 0), 23);
  const clampedMinute = Math.min(Math.max(minute, 0), 59);
  const totalMinutes = clampedHour * 60 + clampedMinute;
  const roundedMinutes = Math.round(totalMinutes / STEP_MINUTES) * STEP_MINUTES;
  const snapped = Math.min(Math.max(roundedMinutes, 0), MAX_VALID_MINUTES);

  return formatMinutes(snapped);
};

export const TimeComboBox = ({ value, onChange }: TimeComboBoxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeOptionRef = useRef<HTMLLIElement>(null);

  const timeOptions = useMemo(
    () =>
      Array.from({ length: MINUTES_IN_DAY / STEP_MINUTES }, (_, index) =>
        formatMinutes(index * STEP_MINUTES),
      ),
    [],
  );

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      activeOptionRef.current?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [isOpen, value]);

  const commitInputValue = () => {
    const parsed = parseTypedTime(inputValue);
    const nextValue = parsed ?? value;

    setInputValue(nextValue);
    onChange(nextValue);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let raw = event.target.value;

    // 1. QoL swap: replace common typos like '.' or ';' with a ':'
    raw = raw.replace(/[.;]/g, ':');

    // 2. Strip absolutely everything except numbers and the colon
    raw = raw.replace(/[^0-9:]/g, '');

    // 3. Prevent multiple colons and restrict lengths
    const parts = raw.split(':');
    if (parts.length > 2) {
      // If they somehow paste multiple colons, keep only the first
      raw = `${parts[0]}:${parts.slice(1).join('').slice(0, 2)}`;
    }

    if (parts.length === 2) {
      // Max 2 digits before colon, max 2 digits after
      raw = `${parts[0].slice(0, 2)}:${parts[1].slice(0, 2)}`;
    } else {
      // If no colon yet, max 4 digits total (e.g., typing "1430")
      raw = raw.slice(0, 4);
    }

    setInputValue(raw);
    setIsOpen(true); // Keep dropdown open while typing
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={inputValue}
        onClick={() => setIsOpen(true)}
        onChange={handleInputChange}
        onBlur={commitInputValue}
        className="bg-surface border border-border rounded-[5px] p-2 w-full focus:outline-none focus:border-primary"
      />

      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-[5px] shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
          {timeOptions.map((time) => (
            <li
              key={time}
              ref={time === value ? activeOptionRef : null}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setInputValue(time);
                onChange(time);
                setIsOpen(false);
              }}
              className={cn(
                'px-3 py-2 text-body-s cursor-pointer hover:bg-surface-raised text-idle hover:text-active transition-colors',
                time === value && 'bg-primary/10',
              )}
            >
              {time}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

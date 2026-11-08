import { Bubble } from '@/components/atoms/bubble';
import { BubbleProps } from '@/components/atoms/bubble/types';
import { Button } from '@/components/atoms/button';
import type { ParseKeys } from 'i18next';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface ColorPickerProps {
  currentColor: BubbleProps['color'];
  onColorSelect: (color: BubbleProps['color']) => void;
  onClose: () => void;
  isOpen: boolean;
}

const AVAILABLE_COLORS: BubbleProps['color'][] = [
  'blue',
  'green',
  'red',
  'yellow',
];

const COLOR_LABEL_KEYS = {
  blue: 'colorPicker.select.blue',
  green: 'colorPicker.select.green',
  red: 'colorPicker.select.red',
  yellow: 'colorPicker.select.yellow',
} as const satisfies Record<
  NonNullable<BubbleProps['color']>,
  ParseKeys<'common'>
>;

/** ColorPicker component */
export const ColorPicker = ({
  currentColor,
  onColorSelect,
  onClose,
  isOpen,
}: ColorPickerProps) => {
  const { t } = useTranslation();
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg p-3 z-50 animate-fadeIn"
    >
      <p className="text-body-s text-text-weaker mb-2">
        {t('colorPicker.title')}
      </p>
      <div className="flex gap-2">
        {AVAILABLE_COLORS.map((color) => (
          <Button
            key={color}
            variant="text"
            color="neutral"
            onClick={() => onColorSelect(color)}
            className={`p-2 rounded-lg hover:bg-neutral-weaker transition-colors ${
              currentColor === color ? 'bg-accent/10 ring-2 ring-accent' : ''
            }`}
            title={color ? t(COLOR_LABEL_KEYS[color]) : undefined}
          >
            <Bubble size="sm" color={color} />
          </Button>
        ))}
      </div>
    </div>
  );
};

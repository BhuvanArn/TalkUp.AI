import { Badge } from '@/components/atoms/badge';
import { cn } from '@/utils/cn';

/**
 * @interface Language
 * @description Defines the structure for a language proficiency entry.
 */
interface Language {
  /** The display name of the language (e.g., "Anglais") */
  name: string;
  /** CEFR proficiency level (e.g., "B2", "Native") */
  level: string;
  /** Numeric progress percentage for the progress bar (0-100) */
  progress: number;
  /** Primary hex color used for labels and progress bar fill */
  color: string;
}

/**
 * @interface LanguageSettingsProps
 * @description Properties for the LanguageSettings component.
 */
interface LanguageSettingsProps {
  /** Array of language objects containing proficiency and progress data */
  languages: Language[];
}

/**
 * LanguageSettings Component
 * * Renders a dual-section interface for:
 * 1. **Language Tags**: Quick overview of native and learning languages.
 * 2. **Progression Bars**: Visual tracking of current learning goals and levels.
 * * @param {LanguageSettingsProps} props - Component properties.
 * @returns {JSX.Element} The rendered language management panel.
 */
export const LanguageSettings = ({ languages }: LanguageSettingsProps) => {
  return (
    <div className="flex flex-col gap-5">
      <div className={cardClass}>
        <div className="mb-3 text-sm font-semibold text-text">Langues</div>
        <div className="flex flex-wrap gap-2">
          <Badge color="accent">Français</Badge>
          <Badge color="success">Anglais</Badge>
          <Badge
            color="neutral"
            className="cursor-pointer border border-dashed border-border bg-transparent"
          >
            + Ajouter
          </Badge>
        </div>
      </div>

      <div className={cardClass}>
        <div className="mb-4 text-sm font-semibold text-text">Progression</div>
        {languages.map((lang) => (
          <div key={lang.name} className="mb-4 last:mb-0">
            <div className="mb-2 flex justify-between text-body-s">
              <span className="text-text-weaker">{lang.name}</span>
              <span className="font-bold" style={{ color: lang.color }}>
                {lang.level}
              </span>
            </div>
            <div className="mt-2 h-[5px] overflow-hidden rounded bg-surface-raised">
              <div
                className={cn(
                  'h-full rounded transition-[width] duration-300 ease-in-out',
                )}
                style={{
                  width: `${lang.progress}%`,
                  backgroundColor: lang.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const cardClass =
  'rounded-xl border border-border bg-surface px-5 py-5 md:px-[22px]';

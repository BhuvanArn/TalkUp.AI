import { LangTag } from '../../molecules/prof-customs/LangTag';
import { ProgressBar } from '../../molecules/prof-customs/ProgressBar';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Language Tags Section ── */}
      <div style={cardStyle}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 12,
          }}
        >
          Langues
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <LangTag label="Français" variant="native" />
          <LangTag label="Anglais" variant="learning" />
          <LangTag label="+ Ajouter" variant="add" />
        </div>
      </div>

      {/* ── Progression Details Section ── */}
      <div style={cardStyle}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 16,
          }}
        >
          Progression
        </div>
        {languages.map((lang) => (
          <div key={lang.name} style={{ marginBottom: 18 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                marginBottom: 8,
              }}
            >
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {lang.name}
              </span>
              <span style={{ color: lang.color, fontWeight: 700 }}>
                {lang.level}
              </span>
            </div>
            <ProgressBar progress={lang.progress} color={lang.color} />
          </div>
        ))}
      </div>
    </div>
  );
};

/** Base card styling for consistent layout within the settings panel */
const cardStyle: React.CSSProperties = {
  background: 'var(--color-background-primary, #FFF)',
  border: '0.5px solid var(--color-border-tertiary, #E5E7EB)',
  borderRadius: 12,
  padding: '20px 22px',
};

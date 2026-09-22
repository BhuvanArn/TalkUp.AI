/**
 * Recruiter personas offered before a simulation.
 *
 * Difficulty describes *what gets asked* — question depth, follow-ups, scrutiny.
 * It must never describe pacing: the speech-to-speech pipeline is strict
 * turn-taking (VAD trims silence only, no barge-in), so the AI cannot interrupt
 * the candidate. `personas.spec.ts` enforces this.
 *
 * Role labels are French on purpose: they belong to the French interview fiction
 * like the names themselves, and `Recruteuse IT` is the value already shipped.
 */
export type PersonaDifficulty = 'easy' | 'medium' | 'hard';

export interface RecruiterPersona {
  /** Stable slug persisted in sessionStorage. */
  id: string;
  name: string;
  /** Displayed under the name. French — see file header. */
  role: string;
  /** Card body copy. English. Must not claim interruption. */
  description: string;
  difficulty: PersonaDifficulty;
  /** Picker portrait initials. */
  initials: string;
  /**
   * Portrait background classes. Only resolves at runtime because
   * `tailwind.css:5-9` safelists these via `@source inline(...)` — the scanner
   * never sees this string. Keep within the safelisted set.
   */
  accentClass: string;
  /**
   * French system prompt, authored for the AI developer who will wire the
   * pipeline. Intentionally unconsumed by the web app today.
   */
  systemPrompt: string;
}

const BASE_PROMPT_RULES =
  'Tu parles de facon naturelle comme dans une vraie conversation. ' +
  'Tu dois repondre uniquement a la derniere prise de parole du candidat, ' +
  'en une seule reponse courte et naturelle. ' +
  "N'ecris jamais un dialogue multi-tours, n'imite jamais des balises comme system: ou user:, " +
  "et ne recopie jamais l'historique de conversation.";

export const PERSONAS: readonly RecruiterPersona[] = [
  {
    id: 'sophie-martin',
    name: 'Sophie Martin',
    role: 'Recruteuse IT',
    description:
      'Warm and encouraging. Broad questions, accepts an answer at face value.',
    difficulty: 'easy',
    initials: 'SM',
    accentClass: 'bg-primary',
    systemPrompt:
      'Tu es Sophie Martin, recruteuse senior IT chez une ESN francaise. ' +
      'Tu es chaleureuse, professionnelle, patiente et humaine. ' +
      BASE_PROMPT_RULES,
  },
  {
    id: 'thomas-leroy',
    name: 'Thomas Leroy',
    role: 'Tech Lead',
    description:
      'Technical depth. Follows up on vague answers and asks you to justify choices.',
    difficulty: 'medium',
    initials: 'TL',
    accentClass: 'bg-neutral',
    systemPrompt:
      'Tu es Thomas Leroy, tech lead dans une equipe produit francaise. ' +
      'Tu es direct et precis. Tu creuses la profondeur technique des reponses ' +
      'et tu demandes de justifier les choix techniques. ' +
      BASE_PROMPT_RULES,
  },
  {
    id: 'claire-dubois',
    name: 'Claire Dubois',
    role: 'DRH',
    description:
      'Structured behavioural questions on motivation and teamwork. Expects concrete examples.',
    difficulty: 'medium',
    initials: 'CD',
    accentClass: 'bg-success',
    systemPrompt:
      'Tu es Claire Dubois, directrice des ressources humaines. ' +
      'Tu poses des questions comportementales structurees sur la motivation ' +
      'et le travail en equipe, et tu attends des exemples concrets. ' +
      BASE_PROMPT_RULES,
  },
  {
    id: 'marc-bernard',
    name: 'Marc Bernard',
    role: 'Directeur',
    description:
      'Blunt and demanding. Challenges weak reasoning and pushes back on your answers.',
    difficulty: 'hard',
    initials: 'MB',
    accentClass: 'bg-error',
    systemPrompt:
      "Tu es Marc Bernard, directeur d'une entreprise francaise. " +
      'Tu es direct et exigeant. Tu remets en question les raisonnements faibles ' +
      'et tu challenges les reponses du candidat. ' +
      BASE_PROMPT_RULES,
  },
];

/** Sophie carries the values shipped before the picker existed. */
export const DEFAULT_PERSONA: RecruiterPersona = PERSONAS[0];

/** Resolves a persisted id, falling back to the default for null/unknown. */
export function getPersonaById(
  id: string | null | undefined,
): RecruiterPersona {
  return PERSONAS.find((persona) => persona.id === id) ?? DEFAULT_PERSONA;
}

import { describe, expect, it } from 'vitest';

import { DEFAULT_PERSONA, PERSONAS, getPersonaById } from './personas';

describe('personas', () => {
  it('exposes exactly four personas with unique ids', () => {
    expect(PERSONAS).toHaveLength(4);
    const ids = PERSONAS.map((persona) => persona.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('defaults to Sophie Martin with the values shipped today', () => {
    expect(DEFAULT_PERSONA.id).toBe('sophie-martin');
    expect(DEFAULT_PERSONA.name).toBe('Sophie Martin');
    expect(DEFAULT_PERSONA.role).toBe('Recruteuse IT');
  });

  it('returns the matching persona by id', () => {
    expect(getPersonaById('marc-bernard').name).toBe('Marc Bernard');
  });

  it('falls back to the default for null, undefined or unknown ids', () => {
    expect(getPersonaById(null)).toBe(DEFAULT_PERSONA);
    expect(getPersonaById(undefined)).toBe(DEFAULT_PERSONA);
    expect(getPersonaById('does-not-exist')).toBe(DEFAULT_PERSONA);
  });

  it('ranks Marc Bernard as the sole hard persona', () => {
    const hard = PERSONAS.filter((persona) => persona.difficulty === 'hard');
    expect(hard.map((persona) => persona.id)).toEqual(['marc-bernard']);
  });

  // The speech-to-speech pipeline is strict turn-taking: VAD only trims silence
  // (ai/microservices/speech-to-speech/engine/pipeline.py:99-102), there is no
  // barge-in. Copy promising interruption would describe behaviour the system
  // cannot produce.
  it('never claims a persona interrupts the candidate', () => {
    const forbidden =
      /interrupt|cut you off|cuts you off|talk over|talks over|rush/i;
    for (const persona of PERSONAS) {
      expect(persona.description).not.toMatch(forbidden);
    }
  });
});

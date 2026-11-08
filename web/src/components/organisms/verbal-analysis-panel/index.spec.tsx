import type {
  SessionAggregate,
  VerbalAnalysisPayload,
} from '@/hooks/simulation/useVerbalAnalysis';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import VerbalAnalysisPanel from './index';

const aggregate: SessionAggregate = {
  turn_count: 1,
  avg_overall_score: 80,
  avg_clarity_score: 80,
  avg_politeness_score: 80,
  avg_vocabulary_score: 80,
  total_filler_words: 0,
  total_tics: 0,
  total_informal: 0,
  total_impolite: 0,
  dominant_register: 'professional',
  top_tics: [],
  summary_advice: [],
};

const payload = (speechRegister: string): VerbalAnalysisPayload => ({
  interview_id: 'iv-1',
  turn_index: 3,
  turn: {
    speech_register: speechRegister,
    clarity_score: 80,
    politeness_score: 80,
    vocabulary_score: 80,
    overall_score: 80,
    metrics: {
      filler_word_count: 0,
      tic_count: 0,
      informal_count: 0,
      impolite_count: 0,
      overly_formal_count: 0,
      politeness_count: 0,
      professional_word_count: 0,
      job_keyword_count: 0,
      repeated_phrase_count: 0,
      word_count: 0,
      sentence_count: 0,
      avg_sentence_length: 0,
      lexical_richness: 0,
    },
    detected_tics: [],
    detected_fillers: [],
    warnings: [],
    advice: [],
  },
  aggregate,
});

const renderPanel = (speechRegister: string) =>
  render(
    <VerbalAnalysisPanel
      analysis={{
        latest: payload(speechRegister),
        aggregate,
        history: [],
      }}
    />,
  );

describe('VerbalAnalysisPanel', () => {
  it('shows the translated register in bold with the turn number', () => {
    const { container } = renderPanel('professional');
    expect(container.querySelector('strong')).toHaveTextContent('Professional');
    expect(screen.getByText(/· Turn 3/)).toBeInTheDocument();
  });

  it('renders an unknown server register as text, not markup', () => {
    const { container } = renderPanel('<strong>x</strong>');
    const strongs = container.querySelectorAll('strong');
    expect(strongs).toHaveLength(1);
    expect(strongs[0]).toHaveTextContent('<strong>x</strong>');
  });
});

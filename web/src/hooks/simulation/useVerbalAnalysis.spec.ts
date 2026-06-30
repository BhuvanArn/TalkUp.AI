import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useVerbalAnalysis } from './useVerbalAnalysis';

describe('useVerbalAnalysis', () => {
  it('ignores non-va_result messages', () => {
    const { result } = renderHook(() =>
      useVerbalAnalysis({
        message: { type: 'sts_result', data: '{}' },
      }),
    );

    expect(result.current.analysis.latest).toBeNull();
    expect(result.current.analysis.history).toHaveLength(0);
  });

  it('parses va_result with string data payload', () => {
    const payload = {
      interview_id: 'int-1',
      turn_index: 1,
      turn: {
        speech_register: 'professional',
        clarity_score: 80,
        politeness_score: 85,
        vocabulary_score: 75,
        overall_score: 80,
        metrics: {
          filler_word_count: 0,
          tic_count: 0,
          informal_count: 0,
          impolite_count: 0,
          overly_formal_count: 0,
          politeness_count: 1,
          professional_word_count: 2,
          job_keyword_count: 1,
          repeated_phrase_count: 0,
          word_count: 10,
          sentence_count: 1,
          avg_sentence_length: 10,
          lexical_richness: 0.9,
        },
        detected_tics: [],
        detected_fillers: [],
        warnings: [],
        advice: ['Bon registre.'],
      },
      aggregate: {
        turn_count: 1,
        avg_overall_score: 80,
        avg_clarity_score: 80,
        avg_politeness_score: 85,
        avg_vocabulary_score: 75,
        total_filler_words: 0,
        total_tics: 0,
        total_informal: 0,
        total_impolite: 0,
        dominant_register: 'professional',
        top_tics: [],
        summary_advice: [],
      },
    };

    const { result, rerender } = renderHook(
      ({ message }) => useVerbalAnalysis({ message }),
      {
        initialProps: {
          message: {
            type: 'va_result',
            data: JSON.stringify(payload),
          },
        },
      },
    );

    expect(result.current.analysis.latest?.turn_index).toBe(1);
    expect(result.current.analysis.aggregate?.avg_overall_score).toBe(80);

    act(() => {
      rerender({
        message: {
          type: 'va_result',
          data: JSON.stringify({ ...payload, turn_index: 2 }),
        },
      });
    });

    expect(result.current.analysis.history).toHaveLength(2);
  });

  it('parses verbal_analysis embedded inside an sts_result frame', () => {
    const payload = {
      interview_id: 'int-1',
      turn_index: 3,
      turn: {
        speech_register: 'casual',
        clarity_score: 60,
        politeness_score: 70,
        vocabulary_score: 65,
        overall_score: 65,
        metrics: {
          filler_word_count: 4,
          tic_count: 2,
          informal_count: 1,
          impolite_count: 0,
          overly_formal_count: 0,
          politeness_count: 0,
          professional_word_count: 1,
          job_keyword_count: 0,
          repeated_phrase_count: 1,
          word_count: 20,
          sentence_count: 2,
          avg_sentence_length: 10,
          lexical_richness: 0.7,
        },
        detected_tics: ['donc'],
        detected_fillers: ['euh'],
        warnings: ['Trop de tics de langage.'],
        advice: ['Faites des pauses.'],
      },
      aggregate: {
        turn_count: 1,
        avg_overall_score: 65,
        avg_clarity_score: 60,
        avg_politeness_score: 70,
        avg_vocabulary_score: 65,
        total_filler_words: 4,
        total_tics: 2,
        total_informal: 1,
        total_impolite: 0,
        dominant_register: 'casual',
        top_tics: ['donc'],
        summary_advice: ['Faites des pauses.'],
      },
    };

    const { result } = renderHook(() =>
      useVerbalAnalysis({
        message: {
          type: 'sts_result',
          data: JSON.stringify({
            type: 'sts_result',
            transcription: 'euh donc voilà',
            response: 'ok',
            audio_chunks: [],
            verbal_analysis: payload,
          }),
        },
      }),
    );

    expect(result.current.analysis.latest?.turn_index).toBe(3);
    expect(result.current.analysis.aggregate?.total_filler_words).toBe(4);
  });
});

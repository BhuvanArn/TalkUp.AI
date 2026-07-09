import { useEffect, useRef, useState } from 'react';

export interface TurnMetrics {
  filler_word_count: number;
  tic_count: number;
  informal_count: number;
  impolite_count: number;
  overly_formal_count: number;
  politeness_count: number;
  professional_word_count: number;
  job_keyword_count: number;
  repeated_phrase_count: number;
  word_count: number;
  sentence_count: number;
  avg_sentence_length: number;
  lexical_richness: number;
}

export interface TurnAnalysis {
  speech_register: string;
  clarity_score: number;
  politeness_score: number;
  vocabulary_score: number;
  overall_score: number;
  metrics: TurnMetrics;
  detected_tics: string[];
  detected_fillers: string[];
  warnings: string[];
  advice: string[];
}

export interface SessionAggregate {
  turn_count: number;
  avg_overall_score: number;
  avg_clarity_score: number;
  avg_politeness_score: number;
  avg_vocabulary_score: number;
  total_filler_words: number;
  total_tics: number;
  total_informal: number;
  total_impolite: number;
  dominant_register: string;
  top_tics: string[];
  summary_advice: string[];
}

export interface VerbalAnalysisPayload {
  interview_id: string;
  request_id?: number | string;
  turn_index: number;
  turn: TurnAnalysis;
  aggregate: SessionAggregate;
}

export interface VerbalAnalysisState {
  latest: VerbalAnalysisPayload | null;
  aggregate: SessionAggregate | null;
  history: VerbalAnalysisPayload[];
}

export interface UseVerbalAnalysisProps {
  message: unknown;
  /**
   * Current interview session id. When it changes to a new session, the
   * accumulated analysis is reset so a fresh simulation starts clean.
   */
  interviewID?: string | null;
}

export interface UseVerbalAnalysisReturn {
  analysis: VerbalAnalysisState;
}

function asPayload(value: unknown): VerbalAnalysisPayload | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (!candidate.turn || !candidate.aggregate) return null;
  return candidate as unknown as VerbalAnalysisPayload;
}

function parseVaResult(message: unknown): VerbalAnalysisPayload | null {
  if (!message || typeof message !== 'object') return null;
  const outer = message as Record<string, unknown>;

  // Legacy standalone va_result frame (kept for backward compatibility).
  if (outer.type === 'va_result') {
    const rawData = outer.data;
    if (typeof rawData === 'string') {
      try {
        return asPayload(JSON.parse(rawData));
      } catch {
        return null;
      }
    }
    return asPayload(rawData);
  }

  // Verbal analysis embedded inside sts_result. The C++ AI server forwards the
  // STS payload as a JSON string in `data`, so unwrap it then read
  // `verbal_analysis`.
  if (outer.type === 'sts_result') {
    let inner: Record<string, unknown> | null = null;
    const rawData = outer.data;
    if (typeof rawData === 'string') {
      try {
        inner = JSON.parse(rawData) as Record<string, unknown>;
      } catch {
        inner = null;
      }
    } else if (rawData && typeof rawData === 'object') {
      inner = rawData as Record<string, unknown>;
    } else {
      inner = outer;
    }
    if (inner && 'verbal_analysis' in inner) {
      return asPayload(inner.verbal_analysis);
    }
  }

  return null;
}

export function useVerbalAnalysis({
  message,
  interviewID,
}: UseVerbalAnalysisProps): UseVerbalAnalysisReturn {
  const [analysis, setAnalysis] = useState<VerbalAnalysisState>({
    latest: null,
    aggregate: null,
    history: [],
  });
  const lastHandledRef = useRef<unknown>(null);

  useEffect(() => {
    if (!interviewID) return;
    lastHandledRef.current = null;
    setAnalysis({ latest: null, aggregate: null, history: [] });
  }, [interviewID]);

  useEffect(() => {
    if (!message || message === lastHandledRef.current) return;
    lastHandledRef.current = message;

    const payload = parseVaResult(message);
    if (!payload) return;

    if (interviewID && payload.interview_id !== interviewID) return;

    setAnalysis((prev) => ({
      latest: payload,
      aggregate: payload.aggregate,
      history: [...prev.history, payload],
    }));
  }, [message, interviewID]);

  return { analysis };
}

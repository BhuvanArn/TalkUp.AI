/**
 * Data Transfer Object for creating a new AI interview.
 */
export interface CreateAiInterviewDto {
  /** The type of interview (e.g., 'technical', 'behavioral') */
  type: string;
  /** The language in which the interview will be conducted */
  language: string;
  /** Optional initial status of the interview */
  status?: string;
  /** CV / job offer / preparation notes for the AI persona */
  jobContext?: string;
}

export type SimulationSessionPhase = 'ready' | 'queued' | 'active';

/**
 * Response object returned when an AI interview is created.
 */
export interface AiInterviewResponse {
  /** Unique identifier for the created interview */
  interviewID: string;
  /** Whether the session can connect immediately or must wait in queue */
  status: SimulationSessionPhase;
  /** WebSocket endpoint URL when status is ready */
  entrypoint?: string | null;
  /** 0 when ready; 1-based position when queued */
  queuePosition: number;
  /** Rough wait estimate in seconds when queued */
  estimatedWaitSec?: number;
}

export interface InterviewSessionResponse {
  interviewID: string;
  dbStatus: string;
  sessionStatus: 'ready' | 'queued' | 'active' | 'ended';
  queuePosition: number;
  entrypoint?: string | null;
  estimatedWaitSec?: number;
}

export interface SimulationCapacityResponse {
  active: number;
  max: number;
  queueLength: number;
  accepting: boolean;
}

/**
 * Data Transfer Object for updating an existing AI interview.
 */
export interface UpdateAiInterviewDto {
  /** Updated status of the interview */
  status?:
    | 'asked'
    | 'queued'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'expired';
  /** Score assigned to the interview (if applicable) */
  score?: number;
  /** Feedback text for the interview */
  feedback?: string;
  /** URL link to the recorded video of the interview */
  videoLink?: string;
}

export interface VerbalAnalysisResponse {
  analysis_id: string;
  interview_id: string;
  overall_score: number | null;
  aggregate: Record<string, unknown>;
  turns: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

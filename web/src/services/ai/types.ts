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
  /**
   * Application to train on. The server loads CV + job offer from the owned
   * application row and injects them into the AI prompt.
   */
  applicationId?: string;
  /** Legacy free-text context (ignored when applicationId is set). */
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

/** Role of a chatbot conversation turn. */
export type ChatRole = 'user' | 'assistant';

/** A single prior turn in the chatbot conversation. */
export interface ChatHistoryItem {
  role: ChatRole;
  content: string;
}

/** The page a chat was opened from. Drives server-side context grounding. */
export type ChatSurface = 'roadmap' | 'simulation' | 'agenda' | 'notes' | 'cv';

/**
 * The current page's context — identifiers only. The server resolves the actual
 * data from these ids under the caller's ownership; the client never sends a
 * data blob.
 */
export interface ChatContext {
  surface: ChatSurface;
  applicationId?: string;
  interviewId?: string;
  noteId?: string;
}

/** Payload sent to the chatbot endpoint. */
export interface ChatRequest {
  /** The user's message. */
  message: string;
  /** Prior conversation turns, oldest first, excluding the current message. */
  history?: ChatHistoryItem[];
  /** The current page's surface + owned id(s), for grounded answers. */
  context?: ChatContext;
}

/** Response returned by the chatbot endpoint. */
export interface ChatResponse {
  /** The assistant's generated reply. */
  reply: string;
}

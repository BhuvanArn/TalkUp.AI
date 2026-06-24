export enum AiInterviewStatus {
  QUEUED = "queued",
  ASKED = "asked",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

/** Statuses that block starting another simulation for the same user. */
export const ACTIVE_SIMULATION_STATUSES: AiInterviewStatus[] = [
  AiInterviewStatus.QUEUED,
  AiInterviewStatus.ASKED,
  AiInterviewStatus.IN_PROGRESS,
];

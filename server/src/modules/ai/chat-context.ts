import type { RoadmapExtraction } from "@common/utils/groqExtraction";
import type { agenda_event } from "@entities/agenda.entity";

/**
 * Compact grounding blocks for the chatbot. Each formatter turns owned rows the
 * server already resolved into a short, plain-text section for the system
 * prompt — never raw JSON, always length-capped so a big roadmap or a long
 * notes list can't blow the context window or the token budget.
 *
 * These are pure functions of already-owned data: ownership and loading happen
 * upstream (in the resolver), mirroring the #154 pattern.
 */

/** Hard cap per context block, matching the simulation context builder. */
export const MAX_CHAT_CONTEXT_CHARS = 6000;

const truncate = (text: string): string =>
  text.length <= MAX_CHAT_CONTEXT_CHARS
    ? text
    : `${text.slice(0, MAX_CHAT_CONTEXT_CHARS)}\n…(truncated)`;

const applicationHeading = (app: {
  company_name?: string | null;
  job_title?: string | null;
}): string => {
  const parts = [app.job_title, app.company_name].filter(Boolean);
  return parts.length ? parts.join(" at ") : "this application";
};

/** Roadmap (F6 preparation path) block: score, summary, gap topics, talking points. */
export const formatRoadmapContext = (
  app: { company_name?: string | null; job_title?: string | null },
  roadmap: RoadmapExtraction,
): string => {
  const lines: string[] = [
    `The user is viewing the preparation roadmap for ${applicationHeading(app)}.`,
    `Match score: ${roadmap.match_score}/100.`,
  ];
  if (roadmap.summary) lines.push(`Summary: ${roadmap.summary}`);

  if (roadmap.topics.length) {
    lines.push("Preparation topics (priority — title — why):");
    for (const t of roadmap.topics) {
      const gap = t.gap ? " [gap]" : "";
      lines.push(`- ${t.priority}${gap} — ${t.title}: ${t.rationale}`);
    }
  }

  if (roadmap.talking_points.length) {
    lines.push("Talking points to bring to the interview (mission — angle):");
    for (const p of roadmap.talking_points) {
      lines.push(`- ${p.mission}: ${p.angle}`);
    }
  }

  return truncate(lines.join("\n"));
};

/** Simulation debrief block: the interview's score/feedback + transcript turns. */
export const formatSimulationContext = (
  app: { company_name?: string | null; job_title?: string | null } | null,
  interview: {
    status?: string | null;
    score?: number | null;
    feedback?: string | null;
  },
  transcripts: { who_stated?: string | null; content?: string | null }[],
  overallScore?: number | null,
): string => {
  const lines: string[] = [
    `The user is reviewing a simulation${
      app ? ` for ${applicationHeading(app)}` : ""
    }.`,
  ];
  if (interview.status) lines.push(`Session status: ${interview.status}.`);
  if (typeof interview.score === "number")
    lines.push(`Score: ${interview.score}/100.`);
  if (interview.feedback) lines.push(`Feedback: ${interview.feedback}`);
  if (typeof overallScore === "number")
    lines.push(`Verbal analysis overall score: ${overallScore}/100.`);

  if (transcripts.length) {
    lines.push("Transcript (most recent turns):");
    // Keep the tail — the end of the interview is the most useful to debrief.
    for (const t of transcripts.slice(-12)) {
      const who = t.who_stated === "ai" ? "Interviewer" : "Candidate";
      if (t.content) lines.push(`${who}: ${t.content}`);
    }
  }

  return truncate(lines.join("\n"));
};

/** Agenda block: the user's upcoming events, next one first. */
export const formatAgendaContext = (events: agenda_event[]): string => {
  if (!events.length) {
    return "The user's agenda has no upcoming events.";
  }
  const lines = ["The user's upcoming agenda events (soonest first):"];
  for (const e of events) {
    const when = e.start_at
      ? new Date(e.start_at).toISOString()
      : "unknown time";
    const loc = e.location ? ` @ ${e.location}` : "";
    lines.push(`- ${when}: ${e.title}${loc}`);
  }
  return truncate(lines.join("\n"));
};

const stripHtml = (html: string | null | undefined): string =>
  (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Notes block: the notes in view (titles + short previews). */
export const formatNotesContext = (
  notes: { title: string; content?: string | null }[],
  scope: "application" | "all",
): string => {
  if (!notes.length) {
    return scope === "application"
      ? "The user has no notes for this application yet."
      : "The user has no notes yet.";
  }
  const lines = [
    scope === "application"
      ? "The user's notes for this application:"
      : "The user's notes:",
  ];
  for (const n of notes.slice(0, 20)) {
    const preview = stripHtml(n.content).slice(0, 200);
    lines.push(`- ${n.title}${preview ? `: ${preview}` : ""}`);
  }
  return truncate(lines.join("\n"));
};

/** Wrap a resolved block as a system-prompt suffix, or empty when none. */
export const wrapContextForPrompt = (block: string | null): string =>
  block
    ? `\n\n## Current page context\nUse the following real data about what the user is looking at to ground your answers. If the user asks about something not covered here, say so briefly.\n\n${block}`
    : "";

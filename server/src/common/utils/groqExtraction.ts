import { InternalServerErrorException, Logger } from "@nestjs/common";
import Groq from "groq-sdk";

// Cap raw text sent to the LLM to bound token cost on large documents.
export const MAX_LLM_INPUT_CHARS = 8000;

// Fail fast if Groq hangs — every other outbound call in this flow pins a
// timeout, and unbounded LLM calls would tie up request handlers indefinitely.
const GROQ_TIMEOUT_MS = 30000;

/** Shape returned by the CV extraction prompt. All fields optional — the model
 * may omit any of them; defaults are applied at persistence time. */
export interface CvExtraction {
  desired_job?: string | null;
  resume?: string | null;
  experiences?: unknown[];
  education?: unknown[];
  technical_skills?: string[];
  languages?: unknown[];
}

/** Minimum extractable PDF text length before we reject low-quality scans. */
export const MIN_CV_EXTRACTABLE_TEXT_CHARS = 80;

export const CV_UNREADABLE_PDF_MESSAGE =
  "Could not extract text from your CV. Use a good-quality PDF with selectable text (not a blurry scan or a photo).";

export const CV_LOW_QUALITY_MESSAGE =
  "Could not analyze your CV. The document is unreadable or low quality. Use a digitally exported PDF (Word, LinkedIn, etc.) with selectable text.";

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNonEmptyListItem(item: unknown): boolean {
  if (item === null || item === undefined) return false;
  if (typeof item === "string") return item.trim().length > 0;
  if (typeof item === "object") {
    return Object.values(item as Record<string, unknown>).some(
      hasNonEmptyString,
    );
  }
  return false;
}

/** True when Groq returned no usable CV fields (typical of unreadable PDFs). */
export function isCvExtractionEmpty(data: CvExtraction): boolean {
  if (hasNonEmptyString(data.desired_job) || hasNonEmptyString(data.resume)) {
    return false;
  }
  if ((data.experiences ?? []).some(hasNonEmptyListItem)) return false;
  if ((data.education ?? []).some(hasNonEmptyListItem)) return false;
  if ((data.technical_skills ?? []).some(hasNonEmptyString)) return false;
  if ((data.languages ?? []).some(hasNonEmptyListItem)) return false;
  return true;
}

/** Shape returned by the job-offer extraction prompt. */
export interface JobOfferExtraction {
  job_title?: string | null;
  company_name?: string | null;
  company_description?: string | null;
  sector?: string | null;
  contract_type?: string | null;
  location?: string | null;
  required_skills?: string[];
  preferred_skills?: string[];
  required_experience?: string | null;
  required_education?: string | null;
  missions?: string[];
  soft_skills?: string[];
  languages_required?: string[];
  salary_range?: string | null;
  company_values?: string[];
  team_description?: string | null;
}

/** One step on the F6 preparation path. */
export interface RoadmapTopic {
  title: string;
  priority: "HIGH" | "MED" | "LOW";
  rationale: string;
  gap: boolean;
}

/**
 * One forward-looking interview talking point: a real responsibility from the
 * offer plus the candidate's own angle on it, grounded in their CV skills. Fuels
 * the "Bring these to your interview" section — distinct from `topics`, which
 * are gap-driven prep items.
 */
export interface RoadmapTalkingPoint {
  mission: string;
  angle: string;
}

/** Shape returned by the roadmap generation prompt (F6 preparation path). */
export interface RoadmapExtraction {
  match_score: number;
  summary: string;
  topics: RoadmapTopic[];
  /** Forward-looking talking points; empty when the offer lists no missions. */
  talking_points: RoadmapTalkingPoint[];
}

const logger = new Logger("GroqExtraction");

// Groq retires model ids without notice (llama-3.3-70b-versatile 404'd in prod
// once Meta's Llama line was pulled from the platform). Read the id from the
// env at call time so a decommission is a config change, not a redeploy.
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

/** Chat-completion model id used by every Groq call in the server. */
export function getGroqModel(): string {
  return process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
}

// Lazily built so a missing GROQ_API_KEY does not crash app bootstrap — the
// groq-sdk constructor throws on an empty key. Only the extraction callers
// need it; they surface the failure as a 500 instead of taking the server down.
let groqClient: Groq | undefined;
function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: GROQ_TIMEOUT_MS,
    });
  }
  return groqClient;
}

/**
 * Normalises a model reply into parseable JSON. Reasoning models (the default
 * openai/gpt-oss-120b included) usually return their chain of thought in a
 * separate `reasoning` field, but the format is model-dependent — a swap via
 * GROQ_MODEL can put a <think> block or a sentence of prose in `content`. So
 * strip the known wrappers, then fall back to the outermost {...} span.
 */
export function cleanJsonReply(responseText: string): string {
  // Strip only a leading/trailing markdown code fence — a global strip would
  // also delete backticks that appear inside JSON string values (e.g. a code
  // snippet echoed into a description field), corrupting otherwise-valid JSON.
  const cleaned = responseText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // Last resort for prose around the object ("Here is the JSON: {...}"). Only
  // used when the cleaned text is not already valid JSON, so a well-behaved
  // reply is never reshaped.
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    return start !== -1 && end > start
      ? cleaned.slice(start, end + 1)
      : cleaned;
  }
}

/**
 * Sends a prompt to Groq, strips any markdown fences from the reply, and parses
 * it as JSON. Throws InternalServerErrorException on empty or unparsable output.
 */
export async function extractWithGroq<T>(prompt: string): Promise<T> {
  const completion = await getGroq().chat.completions.create({
    model: getGroqModel(),
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  const responseText = completion.choices[0]?.message?.content;

  if (!responseText) {
    logger.error("Empty response from Groq");
    throw new InternalServerErrorException("Empty response from AI.");
  }

  try {
    return JSON.parse(cleanJsonReply(responseText)) as T;
  } catch (parseError) {
    logger.error(`JSON parse error: ${parseError}`);
    throw new InternalServerErrorException("Failed to parse extracted data.");
  }
}

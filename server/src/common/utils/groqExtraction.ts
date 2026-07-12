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
  "Impossible d'extraire le texte de votre CV. Utilisez un PDF de bonne qualité avec du texte sélectionnable (pas un scan flou ou une photo).";

export const CV_LOW_QUALITY_MESSAGE =
  "Impossible d'analyser votre CV. Le document est illisible ou de mauvaise qualité — utilisez un PDF exporté numériquement (Word, LinkedIn, etc.) avec du texte sélectionnable.";

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

const logger = new Logger("GroqExtraction");

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
 * Sends a prompt to Groq, strips any markdown fences from the reply, and parses
 * it as JSON. Throws InternalServerErrorException on empty or unparsable output.
 */
export async function extractWithGroq<T>(prompt: string): Promise<T> {
  const completion = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  const responseText = completion.choices[0]?.message?.content;

  if (!responseText) {
    logger.error("Empty response from Groq");
    throw new InternalServerErrorException("Empty response from AI.");
  }

  try {
    // Strip only a leading/trailing markdown code fence — a global strip would
    // also delete backticks that appear inside JSON string values (e.g. a code
    // snippet echoed into a description field), corrupting otherwise-valid JSON.
    const cleaned = responseText
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch (parseError) {
    logger.error(`JSON parse error: ${parseError}`);
    throw new InternalServerErrorException("Failed to parse extracted data.");
  }
}

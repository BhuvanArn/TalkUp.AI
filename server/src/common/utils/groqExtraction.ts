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
    const cleaned = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch (parseError) {
    logger.error(`JSON parse error: ${parseError}`);
    throw new InternalServerErrorException("Failed to parse extracted data.");
  }
}

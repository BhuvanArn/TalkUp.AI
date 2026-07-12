import type { application } from "@entities/application.entity";
import type {
  CvExtraction,
  JobOfferExtraction,
} from "@common/utils/groqExtraction";

/** Must stay aligned with CreateAiInterviewDto.jobContext @MaxLength(8000). */
export const MAX_SIMULATION_CONTEXT_CHARS = 8000;

function appendLine(sections: string[], label: string, value: unknown): void {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    const items = value
      .map((item) => formatListItem(item))
      .filter((item): item is string => Boolean(item));
    if (items.length === 0) return;
    sections.push(`${label}: ${items.join("; ")}`);
    return;
  }

  const text = String(value).trim();
  if (!text) return;
  sections.push(`${label}: ${text}`);
}

function formatListItem(item: unknown): string | null {
  if (item === null || item === undefined) return null;
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed || null;
  }
  if (typeof item === "object") {
    const record = item as Record<string, unknown>;
    const title = [record.title, record.role, record.position, record.degree]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .find(Boolean);
    const org = [record.company, record.school, record.institution]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .find(Boolean);
    const period = [
      record.start_date,
      record.end_date,
      record.period,
      record.year,
    ]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean)
      .join(" - ");

    const parts = [title, org, period].filter(Boolean);
    if (parts.length > 0) return parts.join(" @ ");

    // Fallback for unrecognized object shapes: join the non-empty string values
    // so no raw JSON leaks into the STS system prompt.
    const values = Object.values(record)
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean);
    return values.length > 0 ? values.join(" - ") : null;
  }
  return String(item).trim() || null;
}

function appendOfferSection(
  sections: string[],
  offer: JobOfferExtraction,
): void {
  sections.push("\n## Détails de l'offre");
  appendLine(sections, "Description entreprise", offer.company_description);
  appendLine(sections, "Secteur", offer.sector);
  appendLine(sections, "Type de contrat", offer.contract_type);
  appendLine(sections, "Localisation", offer.location);
  appendLine(sections, "Expérience requise", offer.required_experience);
  appendLine(sections, "Formation requise", offer.required_education);
  appendLine(sections, "Compétences requises", offer.required_skills);
  appendLine(sections, "Compétences souhaitées", offer.preferred_skills);
  appendLine(sections, "Missions", offer.missions);
  appendLine(sections, "Soft skills", offer.soft_skills);
  appendLine(sections, "Langues requises", offer.languages_required);
  appendLine(sections, "Fourchette salariale", offer.salary_range);
  appendLine(sections, "Valeurs entreprise", offer.company_values);
  appendLine(sections, "Équipe", offer.team_description);
}

function appendCvSection(sections: string[], cv: CvExtraction): void {
  sections.push("\n## CV du candidat");
  appendLine(sections, "Poste recherché", cv.desired_job);
  appendLine(sections, "Résumé", cv.resume);
  appendLine(sections, "Expériences", cv.experiences);
  appendLine(sections, "Formation", cv.education);
  appendLine(sections, "Compétences techniques", cv.technical_skills);
  appendLine(sections, "Langues", cv.languages);
}

/**
 * Builds a structured free-text brief from an owned application row.
 * Used server-side only — never trust client-supplied jobContext when applicationId is set.
 */
export function buildSimulationContextFromApplication(
  app: application,
): string {
  const sections: string[] = [];

  const companyName = app.company_name ?? app.offer_details?.company_name;
  const jobTitle = app.job_title ?? app.offer_details?.job_title;

  if (companyName || jobTitle || app.offer_url) {
    sections.push("## Poste visé");
    appendLine(sections, "Intitulé", jobTitle);
    appendLine(sections, "Entreprise", companyName);
    appendLine(sections, "URL", app.offer_url);
  }

  if (app.offer_details) {
    appendOfferSection(sections, app.offer_details);
  }

  if (app.cv_details) {
    appendCvSection(sections, app.cv_details);
  }

  let result = sections.join("\n").trim();
  if (!result) return "";

  if (result.length > MAX_SIMULATION_CONTEXT_CHARS) {
    const suffix = "\n[... contexte tronqué pour respecter la limite]";
    result =
      result.slice(0, MAX_SIMULATION_CONTEXT_CHARS - suffix.length) + suffix;
  }

  return result;
}

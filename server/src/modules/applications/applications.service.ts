import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { application } from "@entities/application.entity";
import { user_cv } from "@entities/userCV.entity";
import { ApplicationStatus } from "@common/enums/ApplicationStatus";
import {
  JobOfferExtraction,
  MAX_LLM_INPUT_CHARS,
  RoadmapExtraction,
  RoadmapTalkingPoint,
  RoadmapTopic,
  extractWithGroq,
  isCvExtractionEmpty,
} from "../../common/utils/groqExtraction";
import {
  scrapeLinkedin,
  scrapeAxios,
} from "../../common/utils/JobOfferExtraction";
import {
  canonicalizeOfferUrl,
  isSafeFetchUrl,
} from "../../common/utils/urlGuard";

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(application)
    private readonly applicationRepo: Repository<application>,
    @InjectRepository(user_cv)
    private readonly userCvRepo: Repository<user_cv>,
  ) {}

  async createFromUrl(
    userId: string,
    url: string,
    interviewAt?: string,
  ): Promise<application> {
    try {
      new URL(url);
    } catch {
      throw new BadRequestException("Invalid URL format.");
    }

    // SSRF guard: reject non-http(s) schemes and private/loopback/link-local
    // targets (cloud metadata, localhost, internal services).
    if (!isSafeFetchUrl(url)) {
      throw new BadRequestException("This URL target is not allowed.");
    }

    // Dedup/store on the CANONICAL url (query + fragment stripped) so the same
    // posting maps to one application even when the link carries per-visit
    // tracking params (LinkedIn's trackingId/refId/eBP, etc.) — otherwise a
    // re-analysis of the same offer would create a duplicate training path.
    const canonicalUrl = canonicalizeOfferUrl(url);

    // Per-user dedup: a repeated submission of the same job URL (double-submit,
    // or a retry after a request that actually succeeded) reuses the existing
    // application instead of creating a duplicate card. Checked before scraping
    // so a known URL also skips the scrape + LLM cost. On a hit we still refresh
    // the CV snapshot and interview date, because the primary flow re-uploads
    // the CV right before this call — returning the row untouched would show a
    // stale snapshot and drop the date the user just set.
    const existing = await this.applicationRepo.findOne({
      where: { user_id: userId, offer_url: canonicalUrl },
    });
    if (existing) {
      existing.cv_details = await this.buildCvSnapshot(userId);
      if (interviewAt !== undefined) {
        existing.interview_at = interviewAt ? new Date(interviewAt) : null;
      }
      return this.applicationRepo.save(existing);
    }

    let pageText = "";
    const isLinkedIn = url.toLowerCase().includes("linkedin.com/jobs");

    if (isLinkedIn) pageText = await scrapeLinkedin(url);
    if (!pageText) pageText = await scrapeAxios(url);

    if (!pageText) {
      throw new BadRequestException(
        "Could not extract content from this URL. The page may require JavaScript to render or be too protected.",
      );
    }

    pageText = pageText.substring(0, MAX_LLM_INPUT_CHARS);

    const data = await extractWithGroq<JobOfferExtraction>(
      this.buildOfferPrompt(pageText),
    );

    const row = this.applicationRepo.create({
      user_id: userId,
      company_name: data.company_name ?? null,
      job_title: data.job_title ?? null,
      status: ApplicationStatus.SENT,
      offer_url: canonicalUrl,
      interview_at: interviewAt ? new Date(interviewAt) : null,
      offer_details: {
        job_title: data.job_title ?? null,
        company_name: data.company_name ?? null,
        company_description: data.company_description ?? null,
        sector: data.sector ?? null,
        contract_type: data.contract_type ?? null,
        location: data.location ?? null,
        required_skills: data.required_skills ?? [],
        preferred_skills: data.preferred_skills ?? [],
        required_experience: data.required_experience ?? null,
        required_education: data.required_education ?? null,
        missions: data.missions ?? [],
        soft_skills: data.soft_skills ?? [],
        languages_required: data.languages_required ?? [],
        salary_range: data.salary_range ?? null,
        company_values: data.company_values ?? [],
        team_description: data.team_description ?? null,
      },
      cv_details: await this.buildCvSnapshot(userId),
    } as Partial<application>);

    const saved = await this.applicationRepo.save(row);
    this.logger.log(`Application created for user ID: ${userId}`);
    return saved;
  }

  /** Snapshot the user's current profile CV for storage on an application. */
  private async buildCvSnapshot(
    userId: string,
  ): Promise<application["cv_details"]> {
    const cv = await this.userCvRepo.findOne({ where: { user_id: userId } });
    return cv
      ? {
          desired_job: cv.desired_job,
          resume: cv.resume,
          experiences: cv.experiences,
          education: cv.education,
          technical_skills: cv.technical_skills,
          languages: cv.languages,
        }
      : null;
  }

  private hasCvDetails(cv: application["cv_details"]): boolean {
    if (!cv) return false;
    // Use the same meaningful-content check as the upload path so placeholder
    // entries (empty strings, blank experience objects) do not count as a
    // populated snapshot and correctly trigger a backfill from the profile CV.
    return !isCvExtractionEmpty(cv);
  }

  /**
   * Ensures application.cv_details is populated. If the snapshot is missing,
   * copies the current profile CV (user_cv) and persists it on the application.
   */
  async ensureCvSnapshot(
    userId: string,
    applicationId: string,
  ): Promise<application> {
    const row = await this.findOwned(userId, applicationId);
    if (this.hasCvDetails(row.cv_details)) {
      return row;
    }

    const snapshot = await this.buildCvSnapshot(userId);
    if (!snapshot || !this.hasCvDetails(snapshot)) {
      this.logger.warn(
        `No usable profile CV to snapshot for application ${applicationId} (user ${userId})`,
      );
      return row;
    }

    row.cv_details = snapshot;
    const saved = await this.applicationRepo.save(row);
    this.logger.log(
      `Backfilled cv_details on application ${applicationId} from profile CV`,
    );
    return saved;
  }

  async listForUser(userId: string): Promise<application[]> {
    return this.applicationRepo.find({
      where: { user_id: userId },
      order: { updated_at: "DESC" },
    });
  }

  async updateApplication(
    userId: string,
    applicationId: string,
    changes: { status?: ApplicationStatus; interviewAt?: string | null },
  ): Promise<application> {
    const row = await this.findOwned(userId, applicationId);
    if (changes.status !== undefined) {
      row.status = changes.status;
    }
    if (changes.interviewAt !== undefined) {
      row.interview_at = changes.interviewAt
        ? new Date(changes.interviewAt)
        : null;
    }
    return this.applicationRepo.save(row);
  }

  async remove(userId: string, applicationId: string): Promise<void> {
    const row = await this.findOwned(userId, applicationId);
    await this.applicationRepo.remove(row);
  }

  /**
   * Lazily builds the F6 preparation roadmap. Cached on the row after the
   * first generation; both-null offer/cv short-circuits to an empty roadmap
   * so we never spend an LLM call on nothing.
   */
  async getRoadmap(
    userId: string,
    applicationId: string,
  ): Promise<RoadmapExtraction> {
    const row = await this.findOwned(userId, applicationId);
    if (row.roadmap) return row.roadmap;
    if (!row.offer_details && !row.cv_details) return this.emptyRoadmap();
    return this.generateAndSaveRoadmap(row);
  }

  /**
   * Owner-guarded forced rebuild: always re-runs the LLM and overwrites the
   * cached roadmap. Throttled at the controller (LLM-cost endpoint).
   */
  async regenerateRoadmap(
    userId: string,
    applicationId: string,
  ): Promise<RoadmapExtraction> {
    const row = await this.findOwned(userId, applicationId);
    return this.generateAndSaveRoadmap(row);
  }

  /** Valid-but-empty roadmap; fresh object each time so callers cannot share state. */
  private emptyRoadmap(): RoadmapExtraction {
    return { match_score: 0, summary: "", topics: [], talking_points: [] };
  }

  private async generateAndSaveRoadmap(
    row: application,
  ): Promise<RoadmapExtraction> {
    const raw = await extractWithGroq<RoadmapExtraction>(
      this.buildRoadmapPrompt(row.offer_details, row.cv_details),
    );
    row.roadmap = this.normalizeRoadmap(raw);
    await this.applicationRepo.save(row);
    this.logger.log(`Roadmap generated for application ${row.application_id}`);
    return row.roadmap;
  }

  /** Defensive shape-fixing on LLM output: clamp the score, default the rest. */
  private normalizeRoadmap(raw: RoadmapExtraction): RoadmapExtraction {
    const score = Number(raw.match_score);
    return {
      match_score: Number.isFinite(score)
        ? Math.min(100, Math.max(0, Math.round(score)))
        : 0,
      summary: typeof raw.summary === "string" ? raw.summary : "",
      topics: Array.isArray(raw.topics)
        ? (raw.topics as unknown[])
            .filter(
              (topic): topic is Record<string, unknown> =>
                typeof topic === "object" && topic !== null,
            )
            .map((topic) => this.normalizeRoadmapTopic(topic))
        : [],
      talking_points: Array.isArray(raw.talking_points)
        ? (raw.talking_points as unknown[])
            .filter(
              (tp): tp is Record<string, unknown> =>
                typeof tp === "object" && tp !== null,
            )
            .map((tp) => this.normalizeTalkingPoint(tp))
            // Drop entries the LLM left blank so the section only shows real ones.
            .filter((tp) => tp.mission !== "" && tp.angle !== "")
        : [],
    };
  }

  /** Defensive shape-fixing on a single LLM-provided topic entry. */
  private normalizeRoadmapTopic(t: Record<string, unknown>): RoadmapTopic {
    return {
      title: String(t?.title ?? ""),
      rationale: String(t?.rationale ?? ""),
      priority:
        t?.priority === "HIGH" || t?.priority === "MED" || t?.priority === "LOW"
          ? t.priority
          : "LOW",
      gap: Boolean(t?.gap),
    };
  }

  /** Defensive shape-fixing on a single LLM-provided talking point. */
  private normalizeTalkingPoint(
    t: Record<string, unknown>,
  ): RoadmapTalkingPoint {
    return {
      mission: String(t?.mission ?? "").trim(),
      angle: String(t?.angle ?? "").trim(),
    };
  }

  /** Strict-JSON roadmap prompt, same style as buildOfferPrompt below. */
  private buildRoadmapPrompt(
    offer: application["offer_details"],
    cv: application["cv_details"],
  ): string {
    return `You are a career-preparation coach speaking DIRECTLY to the candidate, who is the reader. Compare the JOB OFFER and the reader's CV below and return ONLY a valid JSON object (no markdown, no backticks, no comments) with exactly this structure:
      {
        "match_score": 0,
        "summary": "string",
        "topics": [
          {
            "title": "string",
            "priority": "HIGH",
            "rationale": "string",
            "gap": true
          }
        ],
        "talking_points": [
          {
            "mission": "string",
            "angle": "string"
          }
        ]
      }

      Rules:
      - Always return valid JSON, even if the offer or the CV is missing or incomplete
      - Voice: address the reader in the SECOND PERSON ("you", "your") in every "summary", "rationale" and "angle". Never write "the candidate", "the candidate's CV", "the applicant", or any third-person reference to the reader — say "you" and "your CV" instead.
      - "match_score" is an integer from 0 to 100 estimating how well your CV matches the offer; use 0 when there is not enough data
      - "summary" is one short sentence describing your readiness for this offer (e.g. "You're well-prepared for this role, with a few areas to sharpen.")
      - "topics" is the ordered preparation plan (most important first, 3 to 8 items); each topic is one subject to revise or practice before the interview
      - "rationale" is one short sentence, addressed to you, explaining why this topic matters (e.g. "The offer requires GraphQL, which your CV doesn't mention yet.")
      - "priority" is exactly one of "HIGH", "MED", "LOW": "HIGH" for topics the offer requires and your CV lacks, "MED" for topics to strengthen, "LOW" for topics to refresh
      - "gap" is true when the offer requires the topic and your CV shows no evidence of it
      - "talking_points" are forward-looking interview talking points drawn from the offer's "missions" (the responsibilities you would take on if hired), most important first, 3 to 5 items. For each, "mission" restates one responsibility from the offer, and "angle" is ONE short sentence, addressed to you, on how you would approach or assess that responsibility — and it MUST explicitly draw on a concrete skill or experience from YOUR CV (e.g. mission "Maintain legacy C services", angle "You've stabilised code with characterization tests before, so you'd start by mapping the C modules and adding tests around them."). Do NOT invent missions the offer does not mention. If the offer lists no missions (or there is no offer), return "talking_points": []
      - If one input is null, build the plan from the other; if both are null, return {"match_score": 0, "summary": "", "topics": [], "talking_points": []}

      JOB OFFER:
      ${JSON.stringify(offer)}

      YOUR CV:
      ${JSON.stringify(cv)}`;
  }

  // 404 (not 403) when the row exists but belongs to someone else: do not leak
  // other users' application ids.
  private async findOwned(
    userId: string,
    applicationId: string,
  ): Promise<application> {
    const row = await this.applicationRepo.findOne({
      where: { application_id: applicationId, user_id: userId },
    });
    if (!row) throw new NotFoundException("Application not found.");
    return row;
  }

  /** Same prompt as the former users.service uploadJobOffer flow. */
  private buildOfferPrompt(pageText: string): string {
    return `You are a specialized job offer analysis assistant. Analyze the following text extracted from a job offer page and return ONLY a valid JSON object (no markdown, no backticks, no comments) with exactly this structure:
      {
        "job_title": "string or null",
        "company_name": "string or null",
        "company_description": "string or null",
        "sector": "string or null",
        "contract_type": "string or null",
        "location": "string or null",
        "required_skills": ["string"],
        "preferred_skills": ["string"],
        "required_experience": "string or null",
        "required_education": "string or null",
        "missions": ["string"],
        "soft_skills": ["string"],
        "languages_required": ["string"],
        "salary_range": "string or null",
        "company_values": ["string"],
        "team_description": "string or null"
      }

      Rules:
      - Always return valid JSON, even if the job offer is incomplete or poorly formatted
      - Use null for missing string fields
      - Use an empty array [] if no entries are found for a list field
      - Extract all relevant information you can find
      - For missions and skills, extract each item as a separate string in the array

      Job offer text:
      ${pageText}`;
  }
}

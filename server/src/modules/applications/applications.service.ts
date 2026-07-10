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
  extractWithGroq,
} from "../../common/utils/groqExtraction";
import {
  scrapeLinkedin,
  scrapeAxios,
} from "../../common/utils/JobOfferExtraction";
import { isSafeFetchUrl } from "../../common/utils/urlGuard";

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

    // Per-user dedup: a repeated submission of the same job URL (double-submit,
    // or a retry after a request that actually succeeded) returns the existing
    // application instead of creating a duplicate card. Checked before scraping
    // so a known URL also skips the scrape + LLM cost.
    const existing = await this.applicationRepo.findOne({
      where: { user_id: userId, offer_url: url },
    });
    if (existing) return existing;

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

    const cv = await this.userCvRepo.findOne({ where: { user_id: userId } });

    const row = this.applicationRepo.create({
      user_id: userId,
      company_name: data.company_name ?? null,
      job_title: data.job_title ?? null,
      status: ApplicationStatus.SENT,
      offer_url: url,
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
      cv_details: cv
        ? {
            desired_job: cv.desired_job,
            resume: cv.resume,
            experiences: cv.experiences,
            education: cv.education,
            technical_skills: cv.technical_skills,
            languages: cv.languages,
          }
        : null,
    } as Partial<application>);

    const saved = await this.applicationRepo.save(row);
    this.logger.log(`Application created for user ID: ${userId}`);
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

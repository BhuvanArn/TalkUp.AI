import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ProfileVisibility } from "@common/enums/ProfileVisibility";
import {
  user,
  user_email,
  user_phone_number,
  user_profile,
} from "@entities/user.entity";

import { UpdateProfileDto } from "./dto/updateProfile.dto";
import { GetProfileDto } from "./dto/getProfile.dto";
import { type Request, type Response } from "express";
import { user_cv } from "@entities/userCV.entity";
import { user_job_offer } from "@entities/userJobOffer.entity";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(user)
    private readonly userRepo: Repository<user>,
    @InjectRepository(user_profile)
    private readonly profileRepo: Repository<user_profile>,
    @InjectRepository(user_email)
    private readonly userEmailRepo: Repository<user_email>,
    @InjectRepository(user_phone_number)
    private readonly phoneRepo: Repository<user_phone_number>,

    @InjectRepository(user_cv)
    private user_cvRepo: Repository<user_cv>,
    @InjectRepository(user_job_offer)
    private user_job_offerRepo: Repository<user_job_offer>,
  ) {}

  async getProfile(user: user): Promise<GetProfileDto> {
    const p = await this.profileRepo.findOne({
      where: { user_id: user.user_id },
    });
    return this.assembleProfileView(user, p);
  }

  async updateProfile(
    userEntity: user,
    dto: UpdateProfileDto,
  ): Promise<GetProfileDto> {
    const profile = await this.ensureProfile(userEntity.user_id);

    if (dto.username !== undefined) {
      Object.assign(userEntity, { username: dto.username });
    }
    this.applyProfileDto(profile, dto);

    try {
      await this.userRepo.save(userEntity);
      await this.profileRepo.save(profile);
      return this.assembleProfileView(userEntity, profile);
    } catch (error) {
      this.logger.error(
        `updateProfile failed for ${userEntity.user_id}: ${error}`,
      );
      throw new InternalServerErrorException(
        "Internal server error while updating profile.",
      );
    }
  }

  async deleteAccount(userEntity: user): Promise<void> {
    try {
      const result = await this.userRepo.delete({
        user_id: userEntity.user_id,
      });
      if (!result.affected) {
        throw new NotFoundException("User not found.");
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `deleteAccount failed for ${userEntity.user_id}: ${error}`,
      );
      throw new InternalServerErrorException(
        "Internal server error while deleting account.",
      );
    }
  }

  private applyProfileDto(profile: user_profile, dto: UpdateProfileDto): void {
    const strOrNull = (v: string | undefined) =>
      v === undefined ? undefined : v.trim() === "" ? null : v;

    if (dto.profilePicture !== undefined) {
      profile.profile_picture =
        dto.profilePicture === "" ? null : dto.profilePicture;
    }
    if (dto.firstName !== undefined) {
      profile.first_name = strOrNull(dto.firstName) ?? null;
    }
    if (dto.lastName !== undefined) {
      profile.last_name = strOrNull(dto.lastName) ?? null;
    }
    if (dto.bio !== undefined) {
      profile.bio = strOrNull(dto.bio) ?? null;
    }
    if (dto.jobTitle !== undefined) {
      profile.job_title = strOrNull(dto.jobTitle) ?? null;
    }
    if (dto.linkedinUrl !== undefined) {
      profile.linkedin_url = strOrNull(dto.linkedinUrl) ?? null;
    }
    if (dto.avatarAccentColor !== undefined) {
      profile.avatar_accent_color =
        dto.avatarAccentColor === "" ? null : dto.avatarAccentColor;
    }
    if (dto.bannerGradient !== undefined) {
      profile.banner_gradient =
        dto.bannerGradient === "" ? null : dto.bannerGradient;
    }
    if (dto.profileVisibility !== undefined) {
      profile.profile_visibility = dto.profileVisibility;
    }
    if (dto.notificationPrefs !== undefined) {
      profile.notification_prefs = dto.notificationPrefs;
    }
  }

  private async ensureProfile(userId: string): Promise<user_profile> {
    let p = await this.profileRepo.findOne({ where: { user_id: userId } });

    if (!p) {
      p = this.profileRepo.create({
        user_id: userId,
        profile_visibility: ProfileVisibility.PUBLIC,
      });

      await this.profileRepo.save(p);
    }

    return p;
  }

  private async assembleProfileView(
    u: user,
    p: user_profile | null,
  ): Promise<GetProfileDto> {
    const emailRow = await this.userEmailRepo.findOne({
      where: { user_id: u.user_id },
    });
    const phoneRow = await this.phoneRepo.findOne({
      where: { user_id: u.user_id },
    });

    return {
      userId: u.user_id,
      username: u.username,
      email: emailRow?.email ?? null,
      phone: phoneRow?.phone_number ?? null,
      firstName: p?.first_name ?? null,
      lastName: p?.last_name ?? null,
      bio: p?.bio ?? null,
      jobTitle: p?.job_title ?? null,
      linkedinUrl: p?.linkedin_url ?? null,
      profilePicture: p?.profile_picture ?? null,
      avatarAccentColor: p?.avatar_accent_color ?? null,
      bannerGradient: p?.banner_gradient ?? null,
      profileVisibility: p?.profile_visibility ?? ProfileVisibility.PUBLIC,
      notificationPrefs: p?.notification_prefs ?? null,
    };
  }

  async uploadCV(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Upload a PDF file." });
      }

      const userId = (req as any).userId;
      const pdf = require("pdf-parse-debugging-disabled");
      const pdfData = await pdf(req.file.buffer);
      const rawText = pdfData.text;

      if (rawText.length === 0 || !rawText) {
        console.log("The file is empty!!!");
        return res
          .status(400)
          .json({ message: "The PDF file is empty or could not be parsed." });
      }

      const prompt = `You are a specialized CV analysis assistant. Analyze the following text extracted from a CV and return ONLY a valid JSON object (no markdown, no backticks, no comments) with exactly this structure:
      {
        "desired_job": "string or null",
        "resume": "string or null - candidate profile/summary",
        "experiences": [
          {
            "company": "string",
            "title": "string",
            "description": "string",
            "duration": "string"
          }
        ],
        "education": [
          {
            "degree": "string",
            "school_name": "string",
            "duration": "string"
          }
        ],
        "technical_skills": ["string"],
        "languages": [
          {
            "language": "string",
            "level": "string"
          }
        ]
      }

      Rules:
      - Always return valid JSON, even if the CV is incomplete or poorly formatted
      - Use null for missing fields
      - Use an empty array [] if no entries are found for a list field
      - Extract all experiences, education, skills and languages you can find
      - For durations, keep the original format from the CV (e.g. "Jan 2022 - Mar 2024")

      CV text:
      ${rawText}`;

      const Groq = require("groq-sdk");
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      });

      const responseText = completion.choices[0]?.message?.content;

      if (!responseText) {
        console.error("Empty response from Groq");
        return res.status(500).json({ message: "Empty response from AI." });
      }

      let extractedData;
      try {
        const cleaned = responseText.replace(/```json|```/g, "").trim();
        extractedData = JSON.parse(cleaned);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return res
          .status(500)
          .json({ message: "Failed to parse extracted CV data." });
      }

      const existingCV = await this.user_cvRepo.findOne({
        where: { user_id: userId },
      });

      if (existingCV) {
        await this.user_cvRepo.update(
          { user_id: userId },
          {
            desired_job: extractedData.desired_job ?? null,
            resume: extractedData.resume ?? null,
            experiences: extractedData.experiences ?? [],
            education: extractedData.education ?? [],
            technical_skills: extractedData.technical_skills ?? [],
            languages: extractedData.languages ?? [],
          },
        );
        console.log("CV updated for user ID:", userId);
        return res.status(200).json({ message: "CV updated successfully" });
      } else {
        const newCV = this.user_cvRepo.create({
          user_id: userId,
          desired_job: extractedData.desired_job ?? null,
          resume: extractedData.resume ?? null,
          experiences: extractedData.experiences ?? [],
          education: extractedData.education ?? [],
          technical_skills: extractedData.technical_skills ?? [],
          languages: extractedData.languages ?? [],
        });
        console.log("CV created for user ID:", userId);
        await this.user_cvRepo.save(newCV);
        return res.status(200).json({ message: "CV uploaded successfully" });
      }
    } catch (error) {
      console.error("Parsing error:", error);
      res.status(500).json({ message: "Error processing the CV file." });
    }
  }

  async uploadJobOffer(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ message: "Please provide a job offer URL." });
      }

      try {
        new URL(url);
      } catch {
        return res.status(400).json({ message: "Invalid URL format." });
      }

      console.log("Fetching job offer from URL:", url);

      let pageText: string = "";
      const axios = require("axios");
      const cheerio = require("cheerio");

      const isWTTJ = url.includes("welcometothejungle.com");
      const isLinkedIn = url.includes("linkedin.com/jobs");

      // ─── STRATÉGIE LINKEDIN (si URL contient linkedin.com/jobs) ──────────────────
      if (isLinkedIn && !pageText) {
        try {
          // Extraire le job ID depuis l'URL
          // Formats possibles :
          // https://www.linkedin.com/jobs/view/3812345678
          // https://www.linkedin.com/jobs/view/titre-du-poste-3812345678
          const jobIdMatch = url.match(/(\d{8,})/);

          if (!jobIdMatch) {
            throw new Error("Could not extract LinkedIn job ID from URL");
          }

          const jobId = jobIdMatch[1];
          console.log(`LinkedIn detected - job ID: ${jobId}`);

          const guestApiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;

          const response = await axios.get(guestApiUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8",
              "Referer": "https://www.linkedin.com/",
            },
            timeout: 10000,
          });

          const cheerio = require("cheerio");
          const $ = cheerio.load(response.data);

          // Extraire les champs structurés exposés par LinkedIn guest API
          const jobTitle = $("h2.top-card-layout__title, h1.top-card-layout__title").text().trim();
          const companyName = $("a.topcard__org-name-link, span.topcard__org-name-link").text().trim();
          const location = $("span.topcard__flavor--bullet").first().text().trim();
          const description = $("div.show-more-less-html__markup").text().replace(/\s+/g, " ").trim();

          // Critères structurés (type de contrat, niveau d'expérience, etc.)
          const criteria: Record<string, string> = {};
          $("li.description__job-criteria-item").each((_: number, el: any) => {
            const label = $(el).find("h3").text().trim();
            const value = $(el).find("span").text().trim();
            if (label && value) criteria[label] = value;
          });

          pageText = `
            Job Title: ${jobTitle}
            Company: ${companyName}
            Location: ${location}
            Contract Type: ${criteria["Type de poste"] || criteria["Employment type"] || ""}
            Seniority Level: ${criteria["Niveau hiérarchique"] || criteria["Seniority level"] || ""}
            Industry: ${criteria["Secteur"] || criteria["Industries"] || ""}
            Job Function: ${criteria["Fonction"] || criteria["Job function"] || ""}
            Description: ${description}
          `.replace(/\s+/g, " ").trim();

          if (pageText.length >= 100) {
            console.log("Strategy LinkedIn (guest API) succeeded");
          } else {
            throw new Error("Extracted content too short");
          }

        } catch (err) {
          console.log("Strategy LinkedIn failed:", err);
        }
      }

      if (!pageText) {
        // STRATÉGIE axios
        try {
          const response = await axios.get(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
              "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
              "Accept-Encoding": "gzip, deflate, br",
              "Connection": "keep-alive",
              "Upgrade-Insecure-Requests": "1",
              "Sec-Fetch-Dest": "document",
              "Sec-Fetch-Mode": "navigate",
              "Sec-Fetch-Site": "none",
              "Cache-Control": "max-age=0",
            },
            timeout: 10000,
            maxRedirects: 5,
          });

          const temp = cheerio.load(response.data);
          temp("script, style, nav, footer, header, iframe, noscript, [aria-hidden='true']").remove();
          const extracted = temp("body").text().replace(/\s+/g, " ").trim();

          if (extracted.length >= 300) {
            pageText = extracted;
            console.log("Strategy 1 (axios) succeeded");
          }
        } catch (err) {
          console.log("Strategy 1 (axios) failed, trying next...");
        }
      }

      // STRATÉGIE Puppeteer
      if (!pageText) {
        try {
          const puppeteer = require("puppeteer");

          const browser = await puppeteer.launch({
            headless: true,
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-blink-features=AutomationControlled",
              "--disable-infobars",
              "--window-size=1920,1080",
            ],
          });

          const page = await browser.newPage();

          await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, "webdriver", { get: () => false });
            (window as any).chrome = { runtime: {} };
          });

          await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          );

          await page.setViewport({ width: 1920, height: 1080 });
          await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const html = await page.content();
          await browser.close();

          const temp = cheerio.load(html);
          temp("script, style, nav, footer, header, iframe, noscript").remove();
          const extracted = temp("body").text().replace(/\s+/g, " ").trim();

          if (extracted.length >= 300) {
            pageText = extracted;
            console.log("Strategy 2 (puppeteer) succeeded");
          }
        } catch (err) {
          console.log("Strategy 2 (puppeteer) failed, trying next...");
        }
      }

      if (!pageText) {
        return res.status(400).json({
          message: "Could not extract content from this URL. The website may be too protected.",
        });
      }

      pageText = pageText.substring(0, 8000);

      console.log("Final extracted page text length:", pageText.length);

      const prompt = `You are a specialized job offer analysis assistant. Analyze the following text extracted from a job offer page and return ONLY a valid JSON object (no markdown, no backticks, no comments) with exactly this structure:
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

      const Groq = require("groq-sdk");
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      console.log("Sending job offer analysis prompt to Groq...");

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      });

      const responseText = completion.choices[0]?.message?.content;

      console.log("Raw response from Groq:", responseText);

      if (!responseText) {
        console.error("Empty response from Groq");
        return res.status(500).json({ message: "Empty response from AI." });
      }

      let extractedData;
      try {
        const cleaned = responseText.replace(/```json|```/g, "").trim();
        extractedData = JSON.parse(cleaned);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return res.status(500).json({ message: "Failed to parse extracted job offer data." });
      }

      const existingJobOffer = await this.user_job_offerRepo.findOne({
        where: { user_id: userId },
      });

      if (existingJobOffer) {
        await this.user_job_offerRepo.update(
          { user_id: userId },
          {
            job_title: extractedData.job_title ?? null,
            company_name: extractedData.company_name ?? null,
            company_description: extractedData.company_description ?? null,
            sector: extractedData.sector ?? null,
            contract_type: extractedData.contract_type ?? null,
            location: extractedData.location ?? null,
            required_skills: extractedData.required_skills ?? [],
            preferred_skills: extractedData.preferred_skills ?? [],
            required_experience: extractedData.required_experience ?? null,
            required_education: extractedData.required_education ?? null,
            missions: extractedData.missions ?? [],
            soft_skills: extractedData.soft_skills ?? [],
            languages_required: extractedData.languages_required ?? [],
            salary_range: extractedData.salary_range ?? null,
            company_values: extractedData.company_values ?? [],
            team_description: extractedData.team_description ?? null,
            offer_url: url,
          }
        );
        console.log("Job offer updated for user ID:", userId);
        return res.status(200).json({
          message: "Job offer updated successfully",
        });
      } else {
        const newJobOffer = this.user_job_offerRepo.create({
          user_id: userId,
          job_title: extractedData.job_title ?? null,
          company_name: extractedData.company_name ?? null,
          company_description: extractedData.company_description ?? null,
          sector: extractedData.sector ?? null,
          contract_type: extractedData.contract_type ?? null,
          location: extractedData.location ?? null,
          required_skills: extractedData.required_skills ?? [],
          preferred_skills: extractedData.preferred_skills ?? [],
          required_experience: extractedData.required_experience ?? null,
          required_education: extractedData.required_education ?? null,
          missions: extractedData.missions ?? [],
          soft_skills: extractedData.soft_skills ?? [],
          languages_required: extractedData.languages_required ?? [],
          salary_range: extractedData.salary_range ?? null,
          company_values: extractedData.company_values ?? [],
          team_description: extractedData.team_description ?? null,
          offer_url: url,
        });
        await this.user_job_offerRepo.save(newJobOffer);
        console.log("Job offer created for user ID:", userId);
        return res.status(200).json({
          message: "Job offer parsed successfully",
        });
      }

    } catch (error) {
      console.error("Error processing job offer:", error);
      res.status(500).json({ message: "Error processing the job offer." });
    }
  }
}

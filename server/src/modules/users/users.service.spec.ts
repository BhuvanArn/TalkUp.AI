import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { InternalServerErrorException } from "@nestjs/common";

import { ProfileVisibility } from "@common/enums/ProfileVisibility";
import { UserStatus } from "@common/enums/UserStatus";
import {
  user,
  user_email,
  user_phone_number,
  user_profile,
} from "@entities/user.entity";
import { user_cv } from "@entities/userCV.entity";
import { user_job_offer } from "@entities/userJobOffer.entity";

import { UsersService } from "./users.service";

// ─── Mocks modules externes ───────────────────────────────────────────────────

jest.mock("pdf-parse-debugging-disabled", () => jest.fn());

jest.mock("groq-sdk", () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockGroqCreate } },
  }));
});

jest.mock("../../common/utils/JobOfferExtraction", () => ({
  scrapeLinkedin: jest.fn(),
  scrapeAxios: jest.fn(),
  scrapePuppeteer: jest.fn(),
}));

import {
  scrapeLinkedin,
  scrapeAxios,
  scrapePuppeteer,
} from "../../common/utils/JobOfferExtraction";

const mockGroqCreate = jest.fn();
const mockScrapeLinkedin = scrapeLinkedin as jest.Mock;
const mockScrapeAxios = scrapeAxios as jest.Mock;
const mockScrapePuppeteer = scrapePuppeteer as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides: Record<string, any> = {}): any => ({
  userId: "uid-1",
  body: {},
  ...overrides,
});

const validJobOfferGroqResponse = JSON.stringify({
  job_title: "Backend Developer",
  company_name: "TechCorp",
  company_description: "A tech company",
  sector: "IT",
  contract_type: "CDI",
  location: "Paris",
  required_skills: ["Node.js"],
  preferred_skills: ["Docker"],
  required_experience: "3 years",
  required_education: "BSc",
  missions: ["Build APIs"],
  soft_skills: ["Teamwork"],
  languages_required: ["English"],
  salary_range: "50k-60k",
  company_values: ["Innovation"],
  team_description: "Small agile team",
});

// ─── Suite principale ─────────────────────────────────────────────────────────

describe("UsersService", () => {
  let service: UsersService;

  let userRepo: { save: jest.Mock; delete: jest.Mock };
  let profileRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let emailRepo: { findOne: jest.Mock };
  let phoneRepo: { findOne: jest.Mock };
  let cvRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let jobOfferRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };

  const baseUser = {
    user_id: "uid-1",
    username: "alice",
    created_at: new Date(),
    last_accessed_at: new Date(),
    updated_at: new Date(),
    tokenVersion: 1,
    status: UserStatus.ACTIVE,
    provider: "manual",
    organization_id: null,
    user_role: "none",
  } as user;

  const baseProfile = {
    user_id: "uid-1",
    first_name: "Alice",
    last_name: "Bee",
    bio: null,
    job_title: null,
    linkedin_url: null,
    profile_picture: null,
    avatar_accent_color: "#2B70C9",
    banner_gradient: null,
    profile_visibility: ProfileVisibility.PUBLIC,
    notification_prefs: null,
  } as user_profile;

  const emailRow: user_email = {
    email_id: 1,
    user_id: "uid-1",
    email: "alice@example.com",
    is_verified: true,
    user: undefined as never,
  };

  beforeEach(async () => {
    userRepo = {
      save: jest.fn((u: user) => Promise.resolve(u)),
      delete: jest.fn(),
    };
    profileRepo = {
      findOne: jest.fn(),
      create: jest.fn((p: Partial<user_profile>) => p as user_profile),
      save: jest.fn((p: user_profile) => Promise.resolve(p)),
    };
    emailRepo = { findOne: jest.fn() };
    phoneRepo = { findOne: jest.fn() };
    cvRepo = {
      findOne: jest.fn(),
      create: jest.fn((cv) => cv),
      save: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    };
    jobOfferRepo = {
      findOne: jest.fn(),
      create: jest.fn((jo) => jo),
      save: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(user), useValue: userRepo },
        { provide: getRepositoryToken(user_profile), useValue: profileRepo },
        { provide: getRepositoryToken(user_email), useValue: emailRepo },
        { provide: getRepositoryToken(user_phone_number), useValue: phoneRepo },
        { provide: getRepositoryToken(user_cv), useValue: cvRepo },
        { provide: getRepositoryToken(user_job_offer), useValue: jobOfferRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    mockGroqCreate.mockReset();
    mockScrapeLinkedin.mockReset();
    mockScrapeAxios.mockReset();
    mockScrapePuppeteer.mockReset();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ─── getProfile ─────────────────────────────────────────────────────────────

  describe("getProfile", () => {
    it("returns assembled camelCase view", async () => {
      profileRepo.findOne.mockResolvedValue({ ...baseProfile });
      emailRepo.findOne.mockResolvedValue(emailRow);
      phoneRepo.findOne.mockResolvedValue(null);

      const v = await service.getProfile(baseUser);
      expect(v.userId).toBe("uid-1");
      expect(v.email).toBe("alice@example.com");
      expect(v.firstName).toBe("Alice");
      expect(v.profilePicture).toBeNull();
    });
  });

  // ─── updateProfile ──────────────────────────────────────────────────────────

  describe("updateProfile", () => {
    it("creates profile when missing and updates first name", async () => {
      profileRepo.findOne.mockResolvedValueOnce(null);
      emailRepo.findOne.mockResolvedValue(emailRow);
      phoneRepo.findOne.mockResolvedValue(null);

      const v = await service.updateProfile(baseUser, { firstName: "Zed" });
      expect(profileRepo.create).toHaveBeenCalled();
      expect(profileRepo.save).toHaveBeenCalled();
      expect(v.firstName).toBe("Zed");
    });

    it("updates existing profile", async () => {
      profileRepo.findOne.mockResolvedValue({ ...baseProfile });
      emailRepo.findOne.mockResolvedValue(emailRow);
      phoneRepo.findOne.mockResolvedValue(null);

      const v = await service.updateProfile(baseUser, { firstName: "Zed" });
      expect(userRepo.save).toHaveBeenCalled();
      expect(profileRepo.save).toHaveBeenCalled();
      expect(v.firstName).toBe("Zed");
    });

    it("maps profilePicture to profile_picture", async () => {
      profileRepo.findOne.mockResolvedValue({ ...baseProfile });
      emailRepo.findOne.mockResolvedValue(emailRow);
      phoneRepo.findOne.mockResolvedValue(null);

      const dataUrl = "data:image/jpeg;base64,abcd";
      await service.updateProfile(baseUser, { profilePicture: dataUrl });

      expect(profileRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ profile_picture: dataUrl }),
      );
    });

    it("wraps unexpected errors", async () => {
      profileRepo.findOne.mockResolvedValue({ ...baseProfile });
      userRepo.save.mockRejectedValue(new Error("db"));

      await expect(
        service.updateProfile(baseUser, { bio: "x" }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── deleteAccount ──────────────────────────────────────────────────────────

  describe("deleteAccount", () => {
    it("deletes existing account", async () => {
      userRepo.delete.mockResolvedValue({ affected: 1 });
      await expect(service.deleteAccount(baseUser)).resolves.toBeUndefined();
      expect(userRepo.delete).toHaveBeenCalledWith({
        user_id: baseUser.user_id,
      });
    });

    it("throws when account does not exist", async () => {
      userRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.deleteAccount(baseUser)).rejects.toThrow(
        "User not found.",
      );
    });
  });

  // ─── uploadJobOffer ─────────────────────────────────────────────────────────

  describe("uploadJobOffer", () => {
    it("retourne 400 si aucune URL n'est fournie", async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await service.uploadJobOffer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Please provide a job offer URL.",
      });
    });

    it("retourne 400 si l'URL est invalide", async () => {
      const req = mockReq({ body: { url: "not-a-url" } });
      const res = mockRes();

      await service.uploadJobOffer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid URL format." });
    });

    it("retourne 400 si aucun scraper ne retourne du contenu", async () => {
      mockScrapeLinkedin.mockResolvedValue("");
      mockScrapeAxios.mockResolvedValue("");
      mockScrapePuppeteer.mockResolvedValue("");

      const req = mockReq({ body: { url: "https://example.com/job/123" } });
      const res = mockRes();

      await service.uploadJobOffer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "Could not extract content from this URL. The website may be too protected.",
      });
    });

    it("utilise scrapeLinkedin pour les URLs LinkedIn", async () => {
      mockScrapeLinkedin.mockResolvedValue("linkedin job content");
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validJobOfferGroqResponse } }],
      });
      jobOfferRepo.findOne.mockResolvedValue(null);

      const req = mockReq({
        body: { url: "https://linkedin.com/jobs/view/123" },
      });
      const res = mockRes();

      await service.uploadJobOffer(req, res);

      expect(mockScrapeLinkedin).toHaveBeenCalledWith(
        "https://linkedin.com/jobs/view/123",
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("retourne 500 si Groq retourne une réponse vide", async () => {
      mockScrapeAxios.mockResolvedValue("some job content");
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const req = mockReq({ body: { url: "https://example.com/job/123" } });
      const res = mockRes();

      await service.uploadJobOffer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Empty response from AI.",
      });
    });

    it("retourne 500 si Groq retourne un JSON invalide", async () => {
      mockScrapeAxios.mockResolvedValue("some job content");
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: "}{invalid json" } }],
      });

      const req = mockReq({ body: { url: "https://example.com/job/123" } });
      const res = mockRes();

      await service.uploadJobOffer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to parse extracted job offer data.",
      });
    });

    it("crée une nouvelle offre et retourne 200 si aucune n'existe", async () => {
      mockScrapeAxios.mockResolvedValue("some job content");
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validJobOfferGroqResponse } }],
      });
      jobOfferRepo.findOne.mockResolvedValue(null);

      const req = mockReq({ body: { url: "https://example.com/job/123" } });
      const res = mockRes();

      await service.uploadJobOffer(req, res);

      expect(jobOfferRepo.create).toHaveBeenCalled();
      expect(jobOfferRepo.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Job offer parsed successfully",
      });
    });

    it("met à jour l'offre existante et retourne 200", async () => {
      mockScrapeAxios.mockResolvedValue("some job content");
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validJobOfferGroqResponse } }],
      });
      jobOfferRepo.findOne.mockResolvedValue({
        user_id: "uid-1",
        job_title: "old job",
      });

      const req = mockReq({ body: { url: "https://example.com/job/123" } });
      const res = mockRes();

      await service.uploadJobOffer(req, res);

      expect(jobOfferRepo.update).toHaveBeenCalledWith(
        { user_id: "uid-1" },
        expect.objectContaining({ job_title: "Backend Developer" }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Job offer updated successfully",
      });
    });

    it("nettoie les backticks markdown avant de parser le JSON", async () => {
      mockScrapeAxios.mockResolvedValue("some job content");
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: "```json\n" + validJobOfferGroqResponse + "\n```",
            },
          },
        ],
      });
      jobOfferRepo.findOne.mockResolvedValue(null);

      const req = mockReq({ body: { url: "https://example.com/job/123" } });
      const res = mockRes();

      await service.uploadJobOffer(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("retourne 500 en cas d'erreur inattendue", async () => {
      mockScrapeAxios.mockRejectedValue(new Error("network crash"));

      const req = mockReq({ body: { url: "https://example.com/job/123" } });
      const res = mockRes();

      await service.uploadJobOffer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error processing the job offer.",
      });
    });
  });
});

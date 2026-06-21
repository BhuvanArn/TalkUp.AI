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

const mockPdfParse = jest.fn();
// Lazy wrappers: the service now imports these at module-load time, so the mock
// factory must not touch the `mock*` consts until call time (avoids TDZ).
jest.mock("pdf-parse-debugging-disabled", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockPdfParse(...args),
}));

jest.mock("groq-sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: { create: (...args: unknown[]) => mockGroqCreate(...args) },
    },
  })),
}));

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

const mockReqWithFile = (overrides: Record<string, any> = {}): any => ({
  userId: "uid-1",
  file: {
    buffer: Buffer.from("fake pdf content"),
    mimetype: "application/pdf",
    originalname: "cv.pdf",
  },
  ...overrides,
});

const validCvGroqResponse = JSON.stringify({
  desired_job: "Software Engineer",
  resume: "Experienced developer",
  experiences: [
    {
      company: "Acme",
      title: "Dev",
      description: "stuff",
      duration: "2020-2022",
    },
  ],
  education: [{ degree: "BSc", school_name: "MIT", duration: "2016-2020" }],
  technical_skills: ["TypeScript", "Node.js"],
  languages: [{ language: "English", level: "C2" }],
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

    mockPdfParse.mockReset();
    mockGroqCreate.mockReset();
    mockScrapeLinkedin.mockReset();
    mockScrapeAxios.mockReset();
    mockScrapePuppeteer.mockReset();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

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

  // ─── uploadCV ───────────────────────────────────────────────────────────────

  describe("uploadCV", () => {
    it("retourne 400 si aucun fichier n'est fourni", async () => {
      const req = mockReqWithFile({ file: undefined });
      const res = mockRes();

      await service.uploadCV(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Upload a PDF file." });
    });

    it("retourne 400 si le texte extrait du PDF est vide", async () => {
      mockPdfParse.mockResolvedValue({ text: "" });

      const req = mockReqWithFile();
      const res = mockRes();

      await service.uploadCV(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "The PDF file is empty or could not be parsed.",
      });
    });

    it("retourne 500 si Groq retourne une réponse vide", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const req = mockReqWithFile();
      const res = mockRes();

      await service.uploadCV(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Empty response from AI.",
      });
    });

    it("retourne 500 si Groq retourne un JSON invalide", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: "not valid json }{" } }],
      });

      const req = mockReqWithFile();
      const res = mockRes();

      await service.uploadCV(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to parse extracted CV data.",
      });
    });

    it("crée un nouveau CV et retourne 200 si aucun CV n'existe", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validCvGroqResponse } }],
      });
      cvRepo.findOne.mockResolvedValue(null);

      const req = mockReqWithFile();
      const res = mockRes();

      await service.uploadCV(req, res);

      expect(cvRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: "uid-1" },
      });
      expect(cvRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ desired_job: "Software Engineer" }),
      );
      expect(cvRepo.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "CV uploaded successfully",
      });
    });

    it("met à jour le CV existant et retourne 200", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validCvGroqResponse } }],
      });
      cvRepo.findOne.mockResolvedValue({
        user_id: "uid-1",
        desired_job: "old job",
      });

      const req = mockReqWithFile();
      const res = mockRes();

      await service.uploadCV(req, res);

      expect(cvRepo.update).toHaveBeenCalledWith(
        { user_id: "uid-1" },
        expect.objectContaining({ desired_job: "Software Engineer" }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "CV updated successfully",
      });
    });

    it("nettoie les backticks markdown avant de parser le JSON", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: "```json\n" + validCvGroqResponse + "\n```",
            },
          },
        ],
      });
      cvRepo.findOne.mockResolvedValue(null);

      const req = mockReqWithFile();
      const res = mockRes();

      await service.uploadCV(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("applique les valeurs par défaut quand des champs sont absents", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      // Empty object → every field falls back to its `?? null` / `?? []` default.
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: "{}" } }],
      });
      cvRepo.findOne.mockResolvedValue(null);

      const req = mockReqWithFile();
      const res = mockRes();

      await service.uploadCV(req, res);

      expect(cvRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          desired_job: null,
          resume: null,
          experiences: [],
          education: [],
          technical_skills: [],
          languages: [],
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("tronque le texte du CV avant l'envoi au LLM", async () => {
      const longText = "a".repeat(20000);
      mockPdfParse.mockResolvedValue({ text: longText });
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validCvGroqResponse } }],
      });
      cvRepo.findOne.mockResolvedValue(null);

      await service.uploadCV(mockReqWithFile(), mockRes());

      const promptSent = mockGroqCreate.mock.calls[0][0].messages[0].content;
      // Raw CV text is capped at 8000 chars: prompt = boilerplate + <=8000,
      // far below the un-truncated 20000-char input.
      expect(promptSent).not.toContain("a".repeat(8001));
      expect(promptSent).toContain("a".repeat(8000));
      expect(promptSent.length).toBeLessThan(12000);
    });

    it("retourne 500 en cas d'erreur inattendue", async () => {
      mockPdfParse.mockRejectedValue(new Error("unexpected crash"));

      const req = mockReqWithFile();
      const res = mockRes();

      await service.uploadCV(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error processing the CV file.",
      });
    });
  });

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

    it("retourne 400 et ne scrape pas une cible SSRF (loopback/privée)", async () => {
      const req = mockReq({ body: { url: "http://169.254.169.254/latest/" } });
      const res = mockRes();

      await service.uploadJobOffer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "This URL target is not allowed.",
      });
      // Guard runs before any scraping is attempted.
      expect(mockScrapeLinkedin).not.toHaveBeenCalled();
      expect(mockScrapeAxios).not.toHaveBeenCalled();
      expect(mockScrapePuppeteer).not.toHaveBeenCalled();
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

    it("applique les valeurs par défaut quand des champs sont absents", async () => {
      mockScrapeAxios.mockResolvedValue("some job content");
      // Empty object → every field falls back to its `?? null` / `?? []` default.
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: "{}" } }],
      });
      jobOfferRepo.findOne.mockResolvedValue(null);

      const req = mockReq({ body: { url: "https://example.com/job/123" } });
      const res = mockRes();

      await service.uploadJobOffer(req, res);

      expect(jobOfferRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          job_title: null,
          company_name: null,
          required_skills: [],
          missions: [],
          soft_skills: [],
          offer_url: "https://example.com/job/123",
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
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

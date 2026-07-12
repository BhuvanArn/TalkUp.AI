import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, getMetadataArgsStorage } from "typeorm";

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
}));

import {
  scrapeLinkedin,
  scrapeAxios,
} from "../../common/utils/JobOfferExtraction";
import { ApplicationStatus } from "@common/enums/ApplicationStatus";
import { application } from "@entities/application.entity";
import { user_cv } from "@entities/userCV.entity";
import { ApplicationsService } from "./applications.service";

const mockGroqCreate = jest.fn();
const mockScrapeLinkedin = scrapeLinkedin as jest.Mock;
const mockScrapeAxios = scrapeAxios as jest.Mock;

const validOfferResponse = JSON.stringify({
  job_title: "DevOps Engineer",
  company_name: "Datadog",
  sector: "Tech",
});

const validRoadmapResponse = JSON.stringify({
  match_score: 62,
  summary:
    "Solid backend profile; close the Kubernetes gap before interviewing.",
  topics: [
    {
      title: "Kubernetes fundamentals",
      priority: "HIGH",
      rationale: "Required by the offer, absent from the CV.",
      gap: true,
    },
  ],
});

describe("ApplicationsService", () => {
  let service: ApplicationsService;
  let applicationRepo: jest.Mocked<Partial<Repository<application>>>;
  let cvRepo: jest.Mocked<Partial<Repository<user_cv>>>;

  beforeEach(async () => {
    mockGroqCreate.mockReset();
    mockScrapeLinkedin.mockReset();
    mockScrapeAxios.mockReset();

    applicationRepo = {
      create: jest.fn(
        (v) => v as application,
      ) as unknown as Repository<application>["create"],
      save: jest.fn(
        async (v) => v as application,
      ) as unknown as Repository<application>["save"],
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    cvRepo = { findOne: jest.fn().mockResolvedValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: getRepositoryToken(application), useValue: applicationRepo },
        { provide: getRepositoryToken(user_cv), useValue: cvRepo },
      ],
    }).compile();

    service = module.get(ApplicationsService);
  });

  describe("createFromUrl", () => {
    it("rejects a malformed URL", async () => {
      await expect(
        service.createFromUrl("u1", "not-a-url"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects an unsafe URL target", async () => {
      await expect(
        service.createFromUrl("u1", "http://127.0.0.1/admin"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects when the page yields no content", async () => {
      mockScrapeAxios.mockResolvedValue("");
      await expect(
        service.createFromUrl("u1", "https://example.com/job"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("creates an application with extracted offer and no CV snapshot", async () => {
      mockScrapeAxios.mockResolvedValue("some job offer text");
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validOfferResponse } }],
      });

      const row = await service.createFromUrl("u1", "https://example.com/job");

      expect(row.user_id).toBe("u1");
      expect(row.company_name).toBe("Datadog");
      expect(row.job_title).toBe("DevOps Engineer");
      expect(row.status).toBe(ApplicationStatus.SENT);
      expect(row.offer_url).toBe("https://example.com/job");
      expect(row.offer_details?.sector).toBe("Tech");
      expect(row.cv_details).toBeNull();
      expect(applicationRepo.save).toHaveBeenCalled();
    });

    it("snapshots the profile CV into cv_details when one exists", async () => {
      cvRepo.findOne = jest.fn().mockResolvedValue({
        desired_job: "SRE",
        resume: "profile",
        experiences: [],
        education: [],
        technical_skills: ["docker"],
        languages: [],
      });
      mockScrapeAxios.mockResolvedValue("text");
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validOfferResponse } }],
      });

      const row = await service.createFromUrl("u1", "https://example.com/job");

      expect(row.cv_details).toEqual({
        desired_job: "SRE",
        resume: "profile",
        experiences: [],
        education: [],
        technical_skills: ["docker"],
        languages: [],
      });
    });

    it("reuses a duplicate URL without re-scraping but refreshes CV and interview date", async () => {
      const existing = {
        application_id: "a1",
        user_id: "u1",
        offer_url: "https://example.com/job",
        interview_at: null,
        cv_details: { desired_job: "old role" },
      } as unknown as application;
      applicationRepo.findOne = jest.fn().mockResolvedValue(existing);
      cvRepo.findOne = jest.fn().mockResolvedValue({
        desired_job: "new role",
        resume: "r",
        experiences: [],
        education: [],
        technical_skills: [],
        languages: [],
      });

      const row = await service.createFromUrl(
        "u1",
        "https://example.com/job",
        "2026-07-15T00:00:00.000Z",
      );

      // No scrape / LLM cost on a dedup hit.
      expect(mockScrapeAxios).not.toHaveBeenCalled();
      expect(mockScrapeLinkedin).not.toHaveBeenCalled();
      // But the stale snapshot and interview date are refreshed and saved.
      expect(row.cv_details).toEqual(
        expect.objectContaining({ desired_job: "new role" }),
      );
      expect(row.interview_at).toEqual(new Date("2026-07-15T00:00:00.000Z"));
      expect(applicationRepo.save).toHaveBeenCalledWith(existing);
    });

    it("leaves the interview date untouched on dedup when none is provided", async () => {
      const existing = {
        application_id: "a1",
        user_id: "u1",
        offer_url: "https://example.com/job",
        interview_at: new Date("2026-01-01T00:00:00.000Z"),
      } as unknown as application;
      applicationRepo.findOne = jest.fn().mockResolvedValue(existing);

      const row = await service.createFromUrl("u1", "https://example.com/job");

      expect(row.interview_at).toEqual(new Date("2026-01-01T00:00:00.000Z"));
    });

    it("prefers the LinkedIn scraper for linkedin job URLs", async () => {
      mockScrapeLinkedin.mockResolvedValue("linkedin text");
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validOfferResponse } }],
      });

      await service.createFromUrl(
        "u1",
        "https://www.linkedin.com/jobs/view/123",
      );

      expect(mockScrapeLinkedin).toHaveBeenCalled();
      expect(mockScrapeAxios).not.toHaveBeenCalled();
    });
  });

  describe("listForUser", () => {
    it("lists the user's applications sorted by updated_at desc", async () => {
      const rows = [{ application_id: "a1" }] as application[];
      applicationRepo.find = jest.fn().mockResolvedValue(rows);

      await expect(service.listForUser("u1")).resolves.toBe(rows);
      expect(applicationRepo.find).toHaveBeenCalledWith({
        where: { user_id: "u1" },
        order: { updated_at: "DESC" },
      });
    });
  });

  describe("updateApplication", () => {
    it("updates the status of an owned application", async () => {
      const row = {
        application_id: "a1",
        user_id: "u1",
        status: ApplicationStatus.SENT,
      } as application;
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);

      const updated = await service.updateApplication("u1", "a1", {
        status: ApplicationStatus.INTERVIEW,
      });

      expect(applicationRepo.findOne).toHaveBeenCalledWith({
        where: { application_id: "a1", user_id: "u1" },
      });
      expect(updated.status).toBe(ApplicationStatus.INTERVIEW);
      expect(applicationRepo.save).toHaveBeenCalledWith(row);
    });

    it("sets the interview date and can clear it", async () => {
      const row = {
        application_id: "a1",
        user_id: "u1",
        status: ApplicationStatus.SENT,
        interview_at: null,
      } as application;
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);

      const set = await service.updateApplication("u1", "a1", {
        interviewAt: "2026-07-15T14:00:00.000Z",
      });
      expect(set.interview_at).toEqual(new Date("2026-07-15T14:00:00.000Z"));

      const cleared = await service.updateApplication("u1", "a1", {
        interviewAt: null,
      });
      expect(cleared.interview_at).toBeNull();
    });

    it("throws NotFound for an application owned by someone else", async () => {
      applicationRepo.findOne = jest.fn().mockResolvedValue(null);
      await expect(
        service.updateApplication("u1", "a1", {
          status: ApplicationStatus.ACCEPTED,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("remove", () => {
    it("removes an owned application", async () => {
      const row = { application_id: "a1", user_id: "u1" } as application;
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);

      await service.remove("u1", "a1");
      expect(applicationRepo.remove).toHaveBeenCalledWith(row);
    });

    it("throws NotFound for an unknown application", async () => {
      applicationRepo.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.remove("u1", "nope")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("ensureCvSnapshot", () => {
    it("returns the application unchanged when cv_details is already populated", async () => {
      const row = {
        application_id: "a1",
        user_id: "u1",
        cv_details: { resume: "Existing CV" },
      } as application;
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);

      const result = await service.ensureCvSnapshot("u1", "a1");

      expect(result).toBe(row);
      expect(applicationRepo.save).not.toHaveBeenCalled();
      expect(cvRepo.findOne).not.toHaveBeenCalled();
    });

    it("backfills when cv_details holds only placeholder entries", async () => {
      const row = {
        application_id: "a1",
        user_id: "u1",
        cv_details: {
          desired_job: "   ",
          resume: "",
          experiences: [{}],
          technical_skills: [""],
        },
      } as unknown as application;
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);
      cvRepo.findOne = jest.fn().mockResolvedValue({
        user_id: "u1",
        resume: "Profil réel",
        technical_skills: ["React"],
      });

      const result = await service.ensureCvSnapshot("u1", "a1");

      expect(result.cv_details).toEqual(
        expect.objectContaining({ resume: "Profil réel" }),
      );
      expect(applicationRepo.save).toHaveBeenCalled();
    });

    it("backfills cv_details from the profile CV when the snapshot is missing", async () => {
      const row = {
        application_id: "a1",
        user_id: "u1",
        cv_details: null,
      } as application;
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);
      cvRepo.findOne = jest.fn().mockResolvedValue({
        user_id: "u1",
        resume: "Profil actuel",
        technical_skills: ["React"],
      });

      const result = await service.ensureCvSnapshot("u1", "a1");

      expect(result.cv_details).toEqual({
        desired_job: undefined,
        resume: "Profil actuel",
        experiences: undefined,
        education: undefined,
        technical_skills: ["React"],
        languages: undefined,
      });
      expect(applicationRepo.save).toHaveBeenCalled();
    });

    it("returns the row without saving when there is no profile CV", async () => {
      const row = {
        application_id: "a1",
        user_id: "u1",
        cv_details: null,
      } as application;
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);
      cvRepo.findOne = jest.fn().mockResolvedValue(null);

      const result = await service.ensureCvSnapshot("u1", "a1");

      expect(result).toBe(row);
      expect(applicationRepo.save).not.toHaveBeenCalled();
    });

    it("returns the row without saving when the profile CV is empty", async () => {
      const row = {
        application_id: "a1",
        user_id: "u1",
        cv_details: null,
      } as application;
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);
      cvRepo.findOne = jest.fn().mockResolvedValue({
        user_id: "u1",
        desired_job: null,
        resume: null,
        experiences: [],
        education: [],
        technical_skills: [],
        languages: [],
      });

      const result = await service.ensureCvSnapshot("u1", "a1");

      expect(result).toBe(row);
      expect(applicationRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("getRoadmap", () => {
    const ownedRow = () =>
      ({
        application_id: "a1",
        user_id: "u1",
        offer_details: { job_title: "SRE", required_skills: ["kubernetes"] },
        cv_details: { desired_job: "Backend dev", technical_skills: ["node"] },
        roadmap: null,
      }) as unknown as application;

    it("returns the cached roadmap without calling Groq", async () => {
      const row = ownedRow();
      row.roadmap = { match_score: 80, summary: "cached", topics: [] };
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);

      const result = await service.getRoadmap("u1", "a1");

      expect(result).toEqual({
        match_score: 80,
        summary: "cached",
        topics: [],
      });
      expect(mockGroqCreate).not.toHaveBeenCalled();
      expect(applicationRepo.save).not.toHaveBeenCalled();
    });

    it("returns an empty roadmap without Groq when offer and cv are both null", async () => {
      const row = ownedRow();
      row.offer_details = null;
      row.cv_details = null;
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);

      const result = await service.getRoadmap("u1", "a1");

      expect(result).toEqual({ match_score: 0, summary: "", topics: [] });
      expect(mockGroqCreate).not.toHaveBeenCalled();
      expect(applicationRepo.save).not.toHaveBeenCalled();
    });

    it("generates, persists and returns the roadmap on first call", async () => {
      const row = ownedRow();
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validRoadmapResponse } }],
      });

      const result = await service.getRoadmap("u1", "a1");

      expect(result.match_score).toBe(62);
      expect(result.topics).toHaveLength(1);
      expect(result.topics[0].priority).toBe("HIGH");
      expect(row.roadmap).toEqual(result);
      expect(applicationRepo.save).toHaveBeenCalledWith(row);
    });

    it("sends both the offer and the cv to the LLM prompt", async () => {
      const row = ownedRow();
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validRoadmapResponse } }],
      });

      await service.getRoadmap("u1", "a1");

      const callArg = mockGroqCreate.mock.calls[0][0] as {
        messages: { content: string }[];
      };
      const prompt = callArg.messages[0].content;
      expect(prompt).toContain('"required_skills":["kubernetes"]');
      expect(prompt).toContain('"technical_skills":["node"]');
    });

    it("clamps an out-of-range match_score into 0-100", async () => {
      const row = ownedRow();
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                match_score: 250,
                summary: "s",
                topics: [],
              }),
            },
          },
        ],
      });

      const result = await service.getRoadmap("u1", "a1");

      expect(result.match_score).toBe(100);
    });

    it("normalizes a malformed payload (bad score, missing summary and topics)", async () => {
      const row = ownedRow();
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);
      mockGroqCreate.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify({ match_score: "high" }) } },
        ],
      });

      const result = await service.getRoadmap("u1", "a1");

      expect(result).toEqual({ match_score: 0, summary: "", topics: [] });
    });

    it("throws NotFound for an application owned by someone else", async () => {
      applicationRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.getRoadmap("u1", "a1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockGroqCreate).not.toHaveBeenCalled();
    });

    it("propagates a Groq failure without persisting a half-written roadmap", async () => {
      const row = ownedRow();
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: "not json {{" } }],
      });

      await expect(service.getRoadmap("u1", "a1")).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(applicationRepo.save).not.toHaveBeenCalled();
      expect(row.roadmap).toBeNull();
    });
  });

  describe("regenerateRoadmap", () => {
    it("always calls Groq and overwrites the cached roadmap", async () => {
      const row = {
        application_id: "a1",
        user_id: "u1",
        offer_details: { job_title: "SRE" },
        cv_details: null,
        roadmap: { match_score: 10, summary: "stale", topics: [] },
      } as unknown as application;
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validRoadmapResponse } }],
      });

      const result = await service.regenerateRoadmap("u1", "a1");

      expect(mockGroqCreate).toHaveBeenCalledTimes(1);
      expect(result.summary).toBe(
        "Solid backend profile; close the Kubernetes gap before interviewing.",
      );
      expect(row.roadmap).toEqual(result);
      expect(applicationRepo.save).toHaveBeenCalledWith(row);
    });

    it("throws NotFound for an unknown application", async () => {
      applicationRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.regenerateRoadmap("u1", "nope"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockGroqCreate).not.toHaveBeenCalled();
    });
  });
});

describe("application entity roadmap column", () => {
  it("registers a nullable json roadmap column on the application entity", () => {
    const column = getMetadataArgsStorage().columns.find(
      (col) => col.target === application && col.propertyName === "roadmap",
    );
    expect(column).toBeDefined();
    expect(column?.options.type).toBe("json");
    expect(column?.options.nullable).toBe(true);
  });
});

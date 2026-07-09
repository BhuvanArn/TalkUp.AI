import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";

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

    it("returns the existing application for a duplicate URL without re-scraping", async () => {
      const existing = {
        application_id: "a1",
        user_id: "u1",
        offer_url: "https://example.com/job",
      } as application;
      applicationRepo.findOne = jest.fn().mockResolvedValue(existing);

      const row = await service.createFromUrl("u1", "https://example.com/job");

      expect(row).toBe(existing);
      expect(applicationRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: "u1", offer_url: "https://example.com/job" },
      });
      expect(mockScrapeAxios).not.toHaveBeenCalled();
      expect(mockScrapeLinkedin).not.toHaveBeenCalled();
      expect(applicationRepo.save).not.toHaveBeenCalled();
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

  describe("updateStatus", () => {
    it("updates the status of an owned application", async () => {
      const row = {
        application_id: "a1",
        user_id: "u1",
        status: ApplicationStatus.SENT,
      } as application;
      applicationRepo.findOne = jest.fn().mockResolvedValue(row);

      const updated = await service.updateStatus(
        "u1",
        "a1",
        ApplicationStatus.INTERVIEW,
      );

      expect(applicationRepo.findOne).toHaveBeenCalledWith({
        where: { application_id: "a1", user_id: "u1" },
      });
      expect(updated.status).toBe(ApplicationStatus.INTERVIEW);
      expect(applicationRepo.save).toHaveBeenCalledWith(row);
    });

    it("throws NotFound for an application owned by someone else", async () => {
      applicationRepo.findOne = jest.fn().mockResolvedValue(null);
      await expect(
        service.updateStatus("u1", "a1", ApplicationStatus.ACCEPTED),
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
});

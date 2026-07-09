import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";

import { QueryFailedError } from "typeorm";

import { ProfileVisibility } from "@common/enums/ProfileVisibility";
import { UserStatus } from "@common/enums/UserStatus";
import {
  user,
  user_email,
  user_phone_number,
  user_profile,
} from "@entities/user.entity";
import { user_cv } from "@entities/userCV.entity";

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

const mockGroqCreate = jest.fn();

const USER_ID = "uid-1";
const pdfFile = () => ({ buffer: Buffer.from("fake pdf content") });

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(user), useValue: userRepo },
        { provide: getRepositoryToken(user_profile), useValue: profileRepo },
        { provide: getRepositoryToken(user_email), useValue: emailRepo },
        { provide: getRepositoryToken(user_phone_number), useValue: phoneRepo },
        { provide: getRepositoryToken(user_cv), useValue: cvRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    mockPdfParse.mockReset();
    mockGroqCreate.mockReset();
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
    it("throws BadRequest when no file is provided", async () => {
      await expect(service.uploadCV(USER_ID, undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws BadRequest when the PDF text is empty", async () => {
      mockPdfParse.mockResolvedValue({ text: "" });

      await expect(service.uploadCV(USER_ID, pdfFile())).rejects.toThrow(
        "The PDF file is empty or could not be parsed.",
      );
    });

    it("throws InternalServerError on an empty AI response", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(service.uploadCV(USER_ID, pdfFile())).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it("throws InternalServerError on invalid JSON", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: "not valid json }{" } }],
      });

      await expect(service.uploadCV(USER_ID, pdfFile())).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it("creates a new CV and returns the created message", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validCvGroqResponse } }],
      });
      cvRepo.findOne.mockResolvedValue(null);

      const result = await service.uploadCV(USER_ID, pdfFile());

      expect(cvRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: USER_ID },
      });
      expect(cvRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ desired_job: "Software Engineer" }),
      );
      expect(cvRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ message: "CV uploaded successfully" });
    });

    it("updates an existing CV and returns the updated message", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validCvGroqResponse } }],
      });
      cvRepo.findOne.mockResolvedValue({ user_id: USER_ID });

      const result = await service.uploadCV(USER_ID, pdfFile());

      expect(cvRepo.update).toHaveBeenCalledWith(
        { user_id: USER_ID },
        expect.objectContaining({ desired_job: "Software Engineer" }),
      );
      expect(result).toEqual({ message: "CV updated successfully" });
    });

    it("falls back to update when a concurrent insert wins the unique race", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validCvGroqResponse } }],
      });
      // No row at findOne time, but the concurrent upload's insert lands first,
      // so our save hits the user_id unique violation (Postgres 23505).
      cvRepo.findOne.mockResolvedValue(null);
      const uniqueViolation = new QueryFailedError("insert", [], new Error());
      (
        uniqueViolation as unknown as { driverError: { code: string } }
      ).driverError = { code: "23505" };
      cvRepo.save.mockRejectedValueOnce(uniqueViolation);

      const result = await service.uploadCV(USER_ID, pdfFile());

      expect(cvRepo.update).toHaveBeenCalledWith(
        { user_id: USER_ID },
        expect.objectContaining({ desired_job: "Software Engineer" }),
      );
      expect(result).toEqual({ message: "CV updated successfully" });
    });

    it("rethrows non-unique-violation save errors", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validCvGroqResponse } }],
      });
      cvRepo.findOne.mockResolvedValue(null);
      cvRepo.save.mockRejectedValueOnce(new Error("db down"));

      await expect(service.uploadCV(USER_ID, pdfFile())).rejects.toThrow(
        "db down",
      );
    });

    it("strips markdown fences before parsing JSON", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      mockGroqCreate.mockResolvedValue({
        choices: [
          { message: { content: "```json\n" + validCvGroqResponse + "\n```" } },
        ],
      });
      cvRepo.findOne.mockResolvedValue(null);

      const result = await service.uploadCV(USER_ID, pdfFile());

      expect(result).toEqual({ message: "CV uploaded successfully" });
    });

    it("applies defaults when fields are absent", async () => {
      mockPdfParse.mockResolvedValue({ text: "some cv text" });
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: "{}" } }],
      });
      cvRepo.findOne.mockResolvedValue(null);

      await service.uploadCV(USER_ID, pdfFile());

      expect(cvRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: USER_ID,
          desired_job: null,
          resume: null,
          experiences: [],
          education: [],
          technical_skills: [],
          languages: [],
        }),
      );
    });

    it("truncates the CV text before sending it to the LLM", async () => {
      mockPdfParse.mockResolvedValue({ text: "a".repeat(20000) });
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: validCvGroqResponse } }],
      });
      cvRepo.findOne.mockResolvedValue(null);

      await service.uploadCV(USER_ID, pdfFile());

      const promptSent = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(promptSent).toContain("a".repeat(8000));
      expect(promptSent).not.toContain("a".repeat(8001));
      expect(promptSent.length).toBeLessThan(12000);
    });

    it("lets unexpected errors bubble up", async () => {
      mockPdfParse.mockRejectedValue(new Error("unexpected crash"));

      await expect(service.uploadCV(USER_ID, pdfFile())).rejects.toThrow(
        "unexpected crash",
      );
    });
  });
});

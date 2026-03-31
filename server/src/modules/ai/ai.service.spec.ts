import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { HttpService } from "@nestjs/axios";

import { ai_interview } from "@entities/aiInterview.entity";
import { ai_transcript } from "@entities/aiTranscript.entity";

import { AiInterviewStatus } from "@common/enums/AiInterviewStatus";

import { AiService } from "./ai.service";

describe("AiService", () => {
  let service: AiService;

  const mockInterview = {
    interview_id: "i1",
    user_id: "user-1",
    type: "Technical",
    language: "English",
    status: AiInterviewStatus.ASKED,
    created_at: new Date(),
    updated_at: new Date(),
  } as any;

  let mockAiInterviewRepo: any;
  let mockAiTranscriptRepo: any;
  let mockHttpService: any;

  beforeEach(async () => {
    mockAiInterviewRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ interview_id: "new-id", ...dto })),
      save: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
    };

    mockAiTranscriptRepo = {
      create: jest.fn((t) => t),
      save: jest.fn(),
      find: jest.fn(),
    };

    mockHttpService = {
      axiosRef: {
        post: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: getRepositoryToken(ai_interview),
          useValue: mockAiInterviewRepo,
        },
        {
          provide: getRepositoryToken(ai_transcript),
          useValue: mockAiTranscriptRepo,
        },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createInterview", () => {
    it("creates an interview and returns entrypoint on success", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(null);
      mockHttpService.axiosRef.post.mockResolvedValueOnce({
        status: 200,
        data: { data: "entry" },
      });
      mockAiInterviewRepo.save.mockResolvedValueOnce({
        interview_id: "new-id",
      });

      const res = await service.createInterview(
        { type: "Technical" } as any,
        "user-1",
      );

      expect(mockAiInterviewRepo.findOne).toHaveBeenCalled();
      expect(mockHttpService.axiosRef.post).toHaveBeenCalled();
      expect(mockAiInterviewRepo.create).toHaveBeenCalled();
      expect(mockAiInterviewRepo.save).toHaveBeenCalled();
      expect(res).toEqual({ interviewID: "new-id", entrypoint: "entry" });
    });

    it("throws ConflictException when interview already exists", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce({
        interview_id: "exists",
      });

      await expect(
        service.createInterview({} as any, "user-1"),
      ).rejects.toThrow(ConflictException);
    });

    it("throws InternalServerErrorException when AI server returns non-200", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(null);
      mockHttpService.axiosRef.post.mockResolvedValueOnce({
        status: 500,
        data: {},
      });

      await expect(
        service.createInterview({} as any, "user-1"),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("throws InternalServerErrorException when http call fails", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(null);
      mockHttpService.axiosRef.post.mockRejectedValueOnce(new Error("network"));

      await expect(
        service.createInterview({} as any, "user-1"),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("includes response data in log when axios error has response body", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(null);
      const axiosLike: any = new Error("bad request");
      axiosLike.response = { data: { detail: "invalid payload" } };
      mockHttpService.axiosRef.post.mockRejectedValueOnce(axiosLike);

      await expect(
        service.createInterview({} as any, "user-1"),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("throws InternalServerErrorException when save fails", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(null);
      mockHttpService.axiosRef.post.mockResolvedValueOnce({
        status: 200,
        data: { data: "entry" },
      });
      mockAiInterviewRepo.save.mockRejectedValueOnce(new Error("db"));

      await expect(
        service.createInterview({} as any, "user-1"),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("throws InternalServerErrorException when findOne throws", async () => {
      mockAiInterviewRepo.findOne.mockRejectedValueOnce(new Error("boomfind"));
      await expect(
        service.createInterview({} as any, "user-1"),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("editAiInterview", () => {
    it("throws NotFoundException when interview not found", async () => {
      jest
        .spyOn(service, "getInterviewById")
        .mockRejectedValueOnce(new NotFoundException());

      await expect(
        service.editAiInterview("nope", "" as any, "user-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("updates interview and returns true when successful", async () => {
      const existing = {
        ...mockInterview,
        status: AiInterviewStatus.ASKED,
      } as any;
      jest.spyOn(service, "getInterviewById").mockResolvedValueOnce(existing);
      mockAiInterviewRepo.save.mockResolvedValueOnce(true);

      const res = await service.editAiInterview(
        "i1",
        { status: AiInterviewStatus.COMPLETED } as any,
        "user-1",
      );

      expect(mockAiInterviewRepo.save).toHaveBeenCalled();
      expect(res).toEqual(true);
    });

    it("throws InternalServerErrorException when save fails on edit", async () => {
      const existing = {
        ...mockInterview,
        status: AiInterviewStatus.ASKED,
      } as any;
      jest.spyOn(service, "getInterviewById").mockResolvedValueOnce(existing);
      mockAiInterviewRepo.save.mockRejectedValueOnce(new Error("savefail"));

      await expect(
        service.editAiInterview(
          "i1",
          { status: AiInterviewStatus.COMPLETED } as any,
          "user-1",
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("getUserInterviews", () => {
    it("returns all interviews when no pagination provided", async () => {
      mockAiInterviewRepo.find.mockResolvedValueOnce([mockInterview]);

      const res = await service.getUserInterviews({} as any, "user-1");

      expect(mockAiInterviewRepo.find).toHaveBeenCalled();
      expect(res).toEqual({ data: [mockInterview], meta: { total: 1 } });
    });

    it("throws InternalServerErrorException when find throws", async () => {
      mockAiInterviewRepo.find.mockRejectedValueOnce(new Error("finderr"));
      await expect(
        service.getUserInterviews({} as any, "user-1"),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("returns paginated interviews when page/limit provided", async () => {
      mockAiInterviewRepo.findAndCount.mockResolvedValueOnce([
        [mockInterview],
        10,
      ]);

      const res = await service.getUserInterviews(
        { page: 2, limit: 5 } as any,
        "user-1",
      );

      expect(mockAiInterviewRepo.findAndCount).toHaveBeenCalled();
      expect(res).toEqual({
        data: [mockInterview],
        meta: { total: 10, page: 2, limit: 5 },
      });
    });

    it("defaults limit to 20 when only page is provided", async () => {
      mockAiInterviewRepo.findAndCount.mockResolvedValueOnce([[], 0]);

      await service.getUserInterviews({ page: 3 } as any, "user-1");

      expect(mockAiInterviewRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 40,
        }),
      );
    });

    it("defaults page to 1 when only limit is provided", async () => {
      mockAiInterviewRepo.findAndCount.mockResolvedValueOnce([[], 0]);

      await service.getUserInterviews({ limit: 15 } as any, "user-1");

      expect(mockAiInterviewRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 15,
          skip: 0,
        }),
      );
    });

    it("throws InternalServerErrorException when findAndCount throws", async () => {
      mockAiInterviewRepo.findAndCount.mockRejectedValueOnce(
        new Error("counterr"),
      );
      await expect(
        service.getUserInterviews({ page: 1, limit: 10 } as any, "user-1"),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("addTranscripts", () => {
    it("throws NotFoundException when interview not found", async () => {
      jest
        .spyOn(service, "getInterviewById")
        .mockRejectedValueOnce(new NotFoundException());

      await expect(
        service.addTranscripts("i1", { transcripts: [] } as any, "user-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("saves transcripts and returns inserted count", async () => {
      jest
        .spyOn(service, "getInterviewById")
        .mockResolvedValueOnce({ interview_id: "i1" } as any);
      mockAiTranscriptRepo.save.mockResolvedValueOnce([{ id: 1 }]);

      const res = await service.addTranscripts(
        "i1",
        { transcripts: [{ content: "hi", who_stated: "user" }] } as any,
        "user-1",
      );

      expect(mockAiTranscriptRepo.save).toHaveBeenCalled();
      expect(res).toEqual({ inserted: 1, data: [{ id: 1 }] });
    });

    it("throws InternalServerErrorException when transcript save fails", async () => {
      jest
        .spyOn(service, "getInterviewById")
        .mockResolvedValueOnce({ interview_id: "i1" } as any);
      mockAiTranscriptRepo.save.mockRejectedValueOnce(new Error("saveerr"));
      await expect(
        service.addTranscripts(
          "i1",
          { transcripts: [{ content: "hi", who_stated: "user" }] } as any,
          "user-1",
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("getInterviewById", () => {
    it("throws NotFoundException when no interviewId provided", async () => {
      await expect(service.getInterviewById("", "user-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws NotFoundException when interview not found", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.getInterviewById("i100", "user-1")).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAiInterviewRepo.findOne).toHaveBeenCalled();
    });

    it("returns interview with transcripts when requested", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce({
        interview_id: "i1",
        user_id: "user-1",
      });
      mockAiTranscriptRepo.find.mockResolvedValueOnce([
        { id: 1, content: "t1" },
      ]);

      const res = await service.getInterviewById("i1", "user-1", true);
      expect(mockAiInterviewRepo.findOne).toHaveBeenCalled();
      expect(mockAiTranscriptRepo.find).toHaveBeenCalled();
      expect(res).toEqual({
        interview_id: "i1",
        user_id: "user-1",
        transcripts: [{ id: 1, content: "t1" }],
      });
    });

    it("throws InternalServerErrorException when repo errors", async () => {
      mockAiInterviewRepo.findOne.mockRejectedValueOnce(new Error("boom"));
      await expect(service.getInterviewById("i1", "user-1")).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});

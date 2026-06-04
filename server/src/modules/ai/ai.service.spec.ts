import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { ai_interview } from "@entities/aiInterview.entity";
import { ai_transcript } from "@entities/aiTranscript.entity";

import { AiInterviewStatus } from "@common/enums/AiInterviewStatus";

import { AiService } from "./ai.service";
import { SimulationCapacityService } from "../simulation/simulation-capacity.service";
import { SimulationContextService } from "../simulation/simulation-context.service";
import { SimulationPromotionService } from "../simulation/simulation-promotion.service";

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
  let mockCapacity: any;
  let mockPromotion: any;
  let mockContext: any;

  beforeEach(async () => {
    mockAiInterviewRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ interview_id: "new-id", ...dto })),
      save: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    mockAiTranscriptRepo = {
      create: jest.fn((t) => t),
      save: jest.fn(),
      find: jest.fn(),
    };

    mockCapacity = {
      tryAcquireSlot: jest.fn().mockResolvedValue({ acquired: true }),
      enqueue: jest.fn().mockResolvedValue({ ok: true }),
      getQueuePosition: jest.fn().mockResolvedValue(1),
      releaseSlot: jest.fn(),
      removeFromQueue: jest.fn(),
      touchHeartbeat: jest.fn(),
      getSnapshot: jest.fn().mockResolvedValue({
        active: 0,
        max: 2,
        queueLength: 0,
        accepting: true,
      }),
    };

    mockPromotion = {
      prepareReadySession: jest
        .fn()
        .mockResolvedValue({ entrypoint: "ws://test/ws?token=abc" }),
      getReadyPayload: jest.fn(),
      promoteNextFromQueue: jest.fn(),
      clearReady: jest.fn(),
    };

    mockContext = {
      deleteContext: jest.fn(),
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
        { provide: SimulationCapacityService, useValue: mockCapacity },
        { provide: SimulationContextService, useValue: mockContext },
        { provide: SimulationPromotionService, useValue: mockPromotion },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createInterview", () => {
    it("creates a ready interview when a slot is available", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(null);
      mockAiInterviewRepo.save.mockResolvedValueOnce({
        interview_id: "new-id",
      });

      const res = await service.createInterview(
        { type: "Technical", language: "French" } as any,
        "user-1",
      );

      expect(mockCapacity.tryAcquireSlot).toHaveBeenCalledWith(
        "new-id",
        "user-1",
      );
      expect(mockPromotion.prepareReadySession).toHaveBeenCalled();
      expect(res).toEqual({
        interviewID: "new-id",
        status: "ready",
        entrypoint: "ws://test/ws?token=abc",
        queuePosition: 0,
      });
    });

    it("returns queued when no slot is available", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(null);
      mockCapacity.tryAcquireSlot.mockResolvedValueOnce({
        acquired: false,
        reason: "capacity",
      });
      mockAiInterviewRepo.save.mockResolvedValueOnce({
        interview_id: "new-id",
      });

      const res = await service.createInterview(
        { type: "Technical", language: "French" } as any,
        "user-1",
      );

      expect(mockCapacity.enqueue).toHaveBeenCalledWith("new-id");
      expect(res.status).toBe("queued");
      expect(res.entrypoint).toBeNull();
      expect(res.queuePosition).toBe(1);
    });

    it("throws ConflictException when interview already exists", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce({
        interview_id: "exists",
      });

      await expect(
        service.createInterview({ type: "x", language: "fr" } as any, "user-1"),
      ).rejects.toThrow(ConflictException);
    });

    it("throws ServiceUnavailableException when queue is full", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(null);
      mockCapacity.tryAcquireSlot.mockResolvedValueOnce({
        acquired: false,
        reason: "capacity",
      });
      mockCapacity.enqueue.mockResolvedValueOnce({ ok: false });
      mockAiInterviewRepo.save.mockResolvedValueOnce({
        interview_id: "new-id",
      });

      await expect(
        service.createInterview({ type: "x", language: "fr" } as any, "user-1"),
      ).rejects.toThrow(ServiceUnavailableException);
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

    it("releases slot when interview is completed", async () => {
      const existing = {
        ...mockInterview,
        status: AiInterviewStatus.IN_PROGRESS,
      } as any;
      jest.spyOn(service, "getInterviewById").mockResolvedValueOnce(existing);
      mockAiInterviewRepo.save.mockResolvedValueOnce(true);

      await service.editAiInterview(
        "i1",
        { status: AiInterviewStatus.COMPLETED } as any,
        "user-1",
      );

      expect(mockCapacity.releaseSlot).toHaveBeenCalledWith("i1", "user-1");
      expect(mockPromotion.promoteNextFromQueue).toHaveBeenCalled();
    });
  });

  describe("getUserInterviews", () => {
    it("returns all interviews when no pagination provided", async () => {
      mockAiInterviewRepo.find.mockResolvedValueOnce([mockInterview]);

      const res = await service.getUserInterviews({} as any, "user-1");

      expect(res).toEqual({ data: [mockInterview], meta: { total: 1 } });
    });
  });

  describe("addTranscripts", () => {
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

      expect(res).toEqual({ inserted: 1, data: [{ id: 1 }] });
    });
  });

  describe("getInterviewById", () => {
    it("throws NotFoundException when interview not found", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.getInterviewById("i100", "user-1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

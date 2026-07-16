import { InternalServerErrorException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { HttpService } from "@nestjs/axios";

import { REDIS_CLIENT } from "@common/redis/redis.constants";
import { ai_interview } from "@entities/aiInterview.entity";
import { AiInterviewStatus } from "@common/enums/AiInterviewStatus";

import { SimulationPromotionService } from "./simulation-promotion.service";
import { SimulationCapacityService } from "./simulation-capacity.service";
import { SimulationContextService } from "./simulation-context.service";
import { SimulationWsTokenService } from "./simulation-ws-token.service";

describe("SimulationPromotionService", () => {
  let service: SimulationPromotionService;

  const mockInterview = {
    interview_id: "queued-1",
    user_id: "user-1",
    type: "technical",
    language: "French",
    job_context: "CV summary and job offer details",
    status: AiInterviewStatus.QUEUED,
  } as ai_interview;

  let mockCapacity: {
    dequeueNext: jest.Mock;
    tryAcquireSlot: jest.Mock;
    enqueue: jest.Mock;
    requeueFront: jest.Mock;
    releaseSlot: jest.Mock;
  };
  let mockContext: {
    deleteContext: jest.Mock;
    buildSystemPrompt: jest.Mock;
    storeContext: jest.Mock;
  };
  let mockWsToken: { buildEntrypoint: jest.Mock };
  let mockHttp: { axiosRef: { post: jest.Mock } };
  let mockRedis: { set: jest.Mock; get: jest.Mock; del: jest.Mock };
  let mockRepo: { findOne: jest.Mock; update: jest.Mock };

  const ORIGINAL_ENV = { ...process.env };

  beforeEach(async () => {
    process.env.AI_SERVER_URL = "http://ai.local:9000";

    mockCapacity = {
      dequeueNext: jest.fn().mockResolvedValue("queued-1"),
      tryAcquireSlot: jest.fn().mockResolvedValue({ acquired: true }),
      enqueue: jest.fn(),
      requeueFront: jest.fn(),
      releaseSlot: jest.fn(),
    };
    mockContext = {
      deleteContext: jest.fn(),
      buildSystemPrompt: jest.fn().mockReturnValue("SYSTEM"),
      storeContext: jest.fn(),
    };
    mockWsToken = {
      buildEntrypoint: jest.fn().mockReturnValue("wss://ai/ws?token=abc"),
    };
    mockHttp = {
      axiosRef: { post: jest.fn().mockResolvedValue({ status: 200 }) },
    };
    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };
    mockRepo = {
      findOne: jest.fn().mockResolvedValue(mockInterview),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationPromotionService,
        { provide: REDIS_CLIENT, useValue: mockRedis },
        { provide: HttpService, useValue: mockHttp },
        { provide: SimulationCapacityService, useValue: mockCapacity },
        { provide: SimulationContextService, useValue: mockContext },
        { provide: SimulationWsTokenService, useValue: mockWsToken },
        { provide: getRepositoryToken(ai_interview), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(SimulationPromotionService);
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.restoreAllMocks();
  });

  describe("prepareReadySession", () => {
    it("builds prompt, stores context, calls AI init, writes ready key and updates status", async () => {
      const result = await service.prepareReadySession(mockInterview, {
        type: "technical",
        language: "French",
      } as any);

      expect(mockContext.buildSystemPrompt).toHaveBeenCalled();
      expect(mockContext.storeContext).toHaveBeenCalledWith(
        "queued-1",
        "user-1",
        "SYSTEM",
      );
      expect(mockHttp.axiosRef.post).toHaveBeenCalledWith(
        "http://ai.local:9000/process/initialization",
        expect.objectContaining({ type: "initialization" }),
      );
      expect(mockWsToken.buildEntrypoint).toHaveBeenCalledWith(
        "queued-1",
        "user-1",
      );
      expect(mockRedis.set).toHaveBeenCalledWith(
        "talkup:sim:ctx:queued-1:ready",
        JSON.stringify({ entrypoint: "wss://ai/ws?token=abc" }),
        "EX",
        expect.any(Number),
      );
      expect(mockRepo.update).toHaveBeenCalledWith(
        { interview_id: "queued-1" },
        { status: AiInterviewStatus.ASKED },
      );
      expect(result).toEqual({ entrypoint: "wss://ai/ws?token=abc" });
    });

    it("throws InternalServerErrorException when AI init returns non-200", async () => {
      mockHttp.axiosRef.post.mockResolvedValueOnce({ status: 500 });

      await expect(
        service.prepareReadySession(mockInterview, {} as any),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("throws InternalServerErrorException when AI init request rejects", async () => {
      mockHttp.axiosRef.post.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      await expect(
        service.prepareReadySession(mockInterview, {} as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("getReadyPayload", () => {
    it("returns null when no ready key is stored", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      expect(await service.getReadyPayload("queued-1")).toBeNull();
    });

    it("parses and returns the ready payload", async () => {
      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({ entrypoint: "wss://x/ws" }),
      );
      expect(await service.getReadyPayload("queued-1")).toEqual({
        entrypoint: "wss://x/ws",
      });
    });
  });

  describe("clearReady", () => {
    it("deletes the ready key", async () => {
      await service.clearReady("queued-1");
      expect(mockRedis.del).toHaveBeenCalledWith(
        "talkup:sim:ctx:queued-1:ready",
      );
    });
  });

  describe("rollbackPreparedSession", () => {
    it("releases slot, deletes context and clears ready key", async () => {
      await service.rollbackPreparedSession("queued-1", "user-1");

      expect(mockCapacity.releaseSlot).toHaveBeenCalledWith(
        "queued-1",
        "user-1",
      );
      expect(mockContext.deleteContext).toHaveBeenCalledWith("queued-1");
      expect(mockRedis.del).toHaveBeenCalledWith(
        "talkup:sim:ctx:queued-1:ready",
      );
    });
  });

  describe("promoteNextFromQueue", () => {
    it("returns null when the queue is empty", async () => {
      mockCapacity.dequeueNext.mockResolvedValueOnce(null);

      expect(await service.promoteNextFromQueue()).toBeNull();
    });

    it("skips a dequeued id that is no longer QUEUED then drains to null", async () => {
      mockCapacity.dequeueNext
        .mockResolvedValueOnce("stale-1")
        .mockResolvedValueOnce(null);
      mockRepo.findOne.mockResolvedValueOnce(null);

      expect(await service.promoteNextFromQueue()).toBeNull();
      expect(mockCapacity.tryAcquireSlot).not.toHaveBeenCalled();
    });

    it("requeues to FRONT (not enqueue) and returns null when no slot is free", async () => {
      mockCapacity.dequeueNext.mockResolvedValueOnce("queued-1");
      mockRepo.findOne.mockResolvedValueOnce(mockInterview);
      mockCapacity.tryAcquireSlot.mockResolvedValueOnce({
        acquired: false,
        reason: "capacity",
      });

      const result = await service.promoteNextFromQueue();

      expect(result).toBeNull();
      expect(mockCapacity.requeueFront).toHaveBeenCalledWith("queued-1");
      expect(mockCapacity.enqueue).not.toHaveBeenCalled();
    });

    it("promotes the interview and passes persisted jobContext", async () => {
      const spy = jest
        .spyOn(service, "prepareReadySession")
        .mockResolvedValue({ entrypoint: "wss://ai/ws" });

      const promotedId = await service.promoteNextFromQueue();

      expect(promotedId).toBe("queued-1");
      expect(spy).toHaveBeenCalledWith(
        mockInterview,
        expect.objectContaining({
          type: "technical",
          language: "French",
          jobContext: "CV summary and job offer details",
        }),
      );
    });

    it("rolls back, marks EXPIRED and continues when prepare fails", async () => {
      mockCapacity.dequeueNext
        .mockResolvedValueOnce("queued-1")
        .mockResolvedValueOnce(null);
      mockRepo.findOne.mockResolvedValueOnce(mockInterview);
      jest
        .spyOn(service, "prepareReadySession")
        .mockRejectedValueOnce(new Error("AI down"));
      const rollbackSpy = jest
        .spyOn(service, "rollbackPreparedSession")
        .mockResolvedValue();

      const result = await service.promoteNextFromQueue();

      expect(result).toBeNull();
      expect(rollbackSpy).toHaveBeenCalledWith("queued-1", "user-1");
      expect(mockRepo.update).toHaveBeenCalledWith(
        { interview_id: "queued-1" },
        { status: AiInterviewStatus.EXPIRED },
      );
    });
  });
});

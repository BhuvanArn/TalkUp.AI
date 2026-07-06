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
import { ChatRole } from "./dto/chat.dto";

const mockGroqCreate = jest.fn();

jest.mock("groq-sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockGroqCreate } },
  })),
}));

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
    mockGroqCreate.mockReset();

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
      getUserActiveInterviewId: jest.fn().mockResolvedValue(null),
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
      rollbackPreparedSession: jest.fn(),
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

    it("persists jobContext when interview is queued", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(null);
      mockCapacity.tryAcquireSlot.mockResolvedValueOnce({
        acquired: false,
        reason: "capacity",
      });
      mockAiInterviewRepo.save.mockResolvedValueOnce({
        interview_id: "new-id",
      });

      await service.createInterview(
        {
          type: "Technical",
          language: "French",
          jobContext: "Backend role at Acme",
        } as any,
        "user-1",
      );

      expect(mockAiInterviewRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          job_context: "Backend role at Acme",
        }),
      );
    });

    it("releases slot and marks interview expired when prepareReadySession fails", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(null);
      mockAiInterviewRepo.save.mockResolvedValueOnce({
        interview_id: "new-id",
      });
      mockPromotion.prepareReadySession.mockRejectedValueOnce(
        new Error("AI init failed"),
      );
      mockAiInterviewRepo.update.mockResolvedValueOnce(undefined);

      await expect(
        service.createInterview(
          { type: "Technical", language: "French" } as any,
          "user-1",
        ),
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockPromotion.rollbackPreparedSession).toHaveBeenCalledWith(
        "new-id",
        "user-1",
      );
      expect(mockAiInterviewRepo.update).toHaveBeenCalledWith(
        { interview_id: "new-id" },
        { status: AiInterviewStatus.EXPIRED },
      );
      expect(mockPromotion.promoteNextFromQueue).toHaveBeenCalled();
    });

    it("throws ConflictException when interview already exists", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce({
        interview_id: "exists",
      });

      await expect(
        service.createInterview({ type: "x", language: "fr" } as any, "user-1"),
      ).rejects.toThrow(ConflictException);
    });

    it("throws ConflictException from the Redis active-interview pre-check before hitting the DB", async () => {
      mockCapacity.getUserActiveInterviewId.mockResolvedValueOnce("active-id");

      await expect(
        service.createInterview({ type: "x", language: "fr" } as any, "user-1"),
      ).rejects.toThrow(ConflictException);

      expect(mockAiInterviewRepo.findOne).not.toHaveBeenCalled();
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

  describe("getCapacity", () => {
    it("delegates to the capacity service snapshot", async () => {
      const res = await service.getCapacity();
      expect(res).toEqual({
        active: 0,
        max: 2,
        queueLength: 0,
        accepting: true,
      });
      expect(mockCapacity.getSnapshot).toHaveBeenCalled();
    });
  });

  describe("getInterviewSession", () => {
    const mockSession = (status: AiInterviewStatus) =>
      jest
        .spyOn(service, "getInterviewById")
        .mockResolvedValueOnce({ ...mockInterview, status } as any);

    it("returns ended session for completed interviews", async () => {
      mockSession(AiInterviewStatus.COMPLETED);

      const res = await service.getInterviewSession("i1", "user-1");

      expect(res.sessionStatus).toBe("ended");
      expect(res.entrypoint).toBeNull();
    });

    it("returns ended session for cancelled interviews", async () => {
      mockSession(AiInterviewStatus.CANCELLED);
      const res = await service.getInterviewSession("i1", "user-1");
      expect(res.sessionStatus).toBe("ended");
    });

    it("returns ended session for expired interviews", async () => {
      mockSession(AiInterviewStatus.EXPIRED);
      const res = await service.getInterviewSession("i1", "user-1");
      expect(res.sessionStatus).toBe("ended");
    });

    it("returns active session with ready entrypoint when in progress", async () => {
      mockSession(AiInterviewStatus.IN_PROGRESS);
      mockPromotion.getReadyPayload.mockResolvedValueOnce({
        entrypoint: "wss://x/ws",
      });

      const res = await service.getInterviewSession("i1", "user-1");

      expect(res.sessionStatus).toBe("active");
      expect(res.entrypoint).toBe("wss://x/ws");
    });

    it("returns active session with null entrypoint when no ready payload", async () => {
      mockSession(AiInterviewStatus.IN_PROGRESS);
      mockPromotion.getReadyPayload.mockResolvedValueOnce(null);

      const res = await service.getInterviewSession("i1", "user-1");

      expect(res.entrypoint).toBeNull();
    });

    it("returns queued session with position and wait estimate", async () => {
      mockSession(AiInterviewStatus.QUEUED);
      mockCapacity.getQueuePosition.mockResolvedValueOnce(3);

      const res = await service.getInterviewSession("i1", "user-1");

      expect(res.sessionStatus).toBe("queued");
      expect(res.queuePosition).toBe(3);
      expect(res.estimatedWaitSec).toBe(3 * 90);
    });

    it("returns ready session for ASKED interviews", async () => {
      mockSession(AiInterviewStatus.ASKED);
      mockPromotion.getReadyPayload.mockResolvedValueOnce({
        entrypoint: "wss://ready/ws",
      });

      const res = await service.getInterviewSession("i1", "user-1");

      expect(res.sessionStatus).toBe("ready");
      expect(res.entrypoint).toBe("wss://ready/ws");
    });
  });

  describe("heartbeatSimulation", () => {
    it("touches the heartbeat for an ASKED interview", async () => {
      jest.spyOn(service, "getInterviewById").mockResolvedValueOnce({
        ...mockInterview,
        status: AiInterviewStatus.ASKED,
      } as any);

      const res = await service.heartbeatSimulation("i1", "user-1");

      expect(res).toEqual({ ok: true });
      expect(mockCapacity.touchHeartbeat).toHaveBeenCalledWith("i1", "user-1");
    });

    it("touches the heartbeat for an IN_PROGRESS interview", async () => {
      jest.spyOn(service, "getInterviewById").mockResolvedValueOnce({
        ...mockInterview,
        status: AiInterviewStatus.IN_PROGRESS,
      } as any);

      await service.heartbeatSimulation("i1", "user-1");
      expect(mockCapacity.touchHeartbeat).toHaveBeenCalled();
    });

    it("throws ConflictException for non-active statuses", async () => {
      jest.spyOn(service, "getInterviewById").mockResolvedValueOnce({
        ...mockInterview,
        status: AiInterviewStatus.QUEUED,
      } as any);

      await expect(service.heartbeatSimulation("i1", "user-1")).rejects.toThrow(
        ConflictException,
      );
      expect(mockCapacity.touchHeartbeat).not.toHaveBeenCalled();
    });
  });

  describe("cancelInterview", () => {
    it("is a no-op (returns true) when already completed", async () => {
      jest.spyOn(service, "getInterviewById").mockResolvedValueOnce({
        ...mockInterview,
        status: AiInterviewStatus.COMPLETED,
      } as any);

      expect(await service.cancelInterview("i1", "user-1")).toBe(true);
      expect(mockAiInterviewRepo.save).not.toHaveBeenCalled();
    });

    it("removes from queue when interview is queued", async () => {
      const existing = {
        ...mockInterview,
        status: AiInterviewStatus.QUEUED,
      } as any;
      jest.spyOn(service, "getInterviewById").mockResolvedValueOnce(existing);
      mockAiInterviewRepo.save.mockResolvedValueOnce(existing);

      await service.cancelInterview("i1", "user-1");

      expect(mockCapacity.removeFromQueue).toHaveBeenCalledWith("i1");
      expect(mockCapacity.releaseSlot).not.toHaveBeenCalled();
      expect(existing.status).toBe(AiInterviewStatus.CANCELLED);
      expect(existing.ended_at).toBeInstanceOf(Date);
    });

    it("releases slot and promotes next when interview is active", async () => {
      const existing = {
        ...mockInterview,
        status: AiInterviewStatus.IN_PROGRESS,
      } as any;
      jest.spyOn(service, "getInterviewById").mockResolvedValueOnce(existing);
      mockAiInterviewRepo.save.mockResolvedValueOnce(existing);

      await service.cancelInterview("i1", "user-1");

      expect(mockCapacity.releaseSlot).toHaveBeenCalledWith("i1", "user-1");
      expect(mockPromotion.promoteNextFromQueue).toHaveBeenCalled();
      expect(mockContext.deleteContext).toHaveBeenCalledWith("i1");
      expect(mockPromotion.clearReady).toHaveBeenCalledWith("i1");
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
      expect(existing.ended_at).toBeInstanceOf(Date);
    });

    it("does not set ended_at when transitioning to COMPLETED from an already completed state", async () => {
      const existing = {
        ...mockInterview,
        status: AiInterviewStatus.COMPLETED,
        ended_at: undefined,
      } as any;
      jest.spyOn(service, "getInterviewById").mockResolvedValueOnce(existing);
      mockAiInterviewRepo.save.mockResolvedValueOnce(true);

      await service.editAiInterview(
        "i1",
        { status: AiInterviewStatus.COMPLETED } as any,
        "user-1",
      );

      expect(existing.ended_at).toBeUndefined();
    });

    it("finalizes on CANCELLED status", async () => {
      const existing = {
        ...mockInterview,
        status: AiInterviewStatus.IN_PROGRESS,
      } as any;
      jest.spyOn(service, "getInterviewById").mockResolvedValueOnce(existing);
      mockAiInterviewRepo.save.mockResolvedValueOnce(true);

      await service.editAiInterview(
        "i1",
        { status: AiInterviewStatus.CANCELLED } as any,
        "user-1",
      );

      expect(mockCapacity.releaseSlot).toHaveBeenCalledWith("i1", "user-1");
      expect(mockContext.deleteContext).toHaveBeenCalledWith("i1");
    });

    it("touches heartbeat when transitioning to IN_PROGRESS", async () => {
      const existing = {
        ...mockInterview,
        status: AiInterviewStatus.ASKED,
      } as any;
      jest.spyOn(service, "getInterviewById").mockResolvedValueOnce(existing);
      mockAiInterviewRepo.save.mockResolvedValueOnce(true);

      await service.editAiInterview(
        "i1",
        { status: AiInterviewStatus.IN_PROGRESS } as any,
        "user-1",
      );

      expect(mockCapacity.touchHeartbeat).toHaveBeenCalledWith("i1", "user-1");
      expect(mockPromotion.promoteNextFromQueue).not.toHaveBeenCalled();
    });

    it("wraps save failures in InternalServerErrorException", async () => {
      const existing = {
        ...mockInterview,
        status: AiInterviewStatus.ASKED,
      } as any;
      jest.spyOn(service, "getInterviewById").mockResolvedValueOnce(existing);
      mockAiInterviewRepo.save.mockRejectedValueOnce(new Error("db down"));

      await expect(
        service.editAiInterview("i1", {} as any, "user-1"),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("getUserInterviews", () => {
    it("returns all interviews when no pagination provided", async () => {
      mockAiInterviewRepo.find.mockResolvedValueOnce([mockInterview]);

      const res = await service.getUserInterviews({} as any, "user-1");

      expect(res).toEqual({ data: [mockInterview], meta: { total: 1 } });
    });

    it("wraps unpaginated find failures in InternalServerErrorException", async () => {
      mockAiInterviewRepo.find.mockRejectedValueOnce(new Error("db down"));

      await expect(
        service.getUserInterviews({} as any, "user-1"),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("returns paginated results with meta", async () => {
      mockAiInterviewRepo.findAndCount.mockResolvedValueOnce([
        [mockInterview],
        7,
      ]);

      const res = await service.getUserInterviews(
        { page: 2, limit: 3, sort: "created_at", order: "ASC" } as any,
        "user-1",
      );

      expect(mockAiInterviewRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3, skip: 3 }),
      );
      expect(res).toEqual({
        data: [mockInterview],
        meta: { total: 7, page: 2, limit: 3 },
      });
    });

    it("defaults page/limit when only one pagination field is provided", async () => {
      mockAiInterviewRepo.findAndCount.mockResolvedValueOnce([[], 0]);

      await service.getUserInterviews({ page: 1 } as any, "user-1");

      expect(mockAiInterviewRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20, skip: 0 }),
      );
    });

    it("wraps paginated find failures in InternalServerErrorException", async () => {
      mockAiInterviewRepo.findAndCount.mockRejectedValueOnce(
        new Error("db down"),
      );

      await expect(
        service.getUserInterviews({ page: 1, limit: 5 } as any, "user-1"),
      ).rejects.toThrow(InternalServerErrorException);
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

    it("wraps save failures in InternalServerErrorException", async () => {
      jest
        .spyOn(service, "getInterviewById")
        .mockResolvedValueOnce({ interview_id: "i1" } as any);
      mockAiTranscriptRepo.save.mockRejectedValueOnce(new Error("db down"));

      await expect(
        service.addTranscripts(
          "i1",
          { transcripts: [{ content: "hi", who_stated: "user" }] } as any,
          "user-1",
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("chat", () => {
    it("returns the assistant reply and passes system + history + user turns", async () => {
      mockGroqCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "  Use the STAR method.  " } }],
      });

      const res = await service.chat({
        message: "How do I answer behavioral questions?",
        history: [
          { role: ChatRole.USER, content: "hi" },
          { role: ChatRole.ASSISTANT, content: "hello" },
        ],
      });

      expect(res).toEqual({ reply: "Use the STAR method." });

      const callArg = mockGroqCreate.mock.calls[0][0];
      expect(callArg.model).toBe("llama-3.3-70b-versatile");
      expect(callArg.messages[0].role).toBe("system");
      expect(callArg.messages).toHaveLength(4);
      expect(callArg.messages[callArg.messages.length - 1]).toEqual({
        role: "user",
        content: "How do I answer behavioral questions?",
      });
    });

    it("works with no history provided", async () => {
      mockGroqCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "Sure!" } }],
      });

      const res = await service.chat({ message: "help" });

      expect(res).toEqual({ reply: "Sure!" });
      expect(mockGroqCreate.mock.calls[0][0].messages).toHaveLength(2);
    });

    it("throws InternalServerErrorException when the LLM call fails", async () => {
      mockGroqCreate.mockRejectedValueOnce(new Error("provider down"));

      await expect(service.chat({ message: "help" })).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it("throws InternalServerErrorException when the completion is empty", async () => {
      mockGroqCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "   " } }],
      });

      await expect(service.chat({ message: "help" })).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("getInterviewById", () => {
    it("throws NotFoundException when interview not found", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.getInterviewById("i100", "user-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns the interview with an empty transcripts array by default", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(mockInterview);

      const res = await service.getInterviewById("i1", "user-1");

      expect(res.transcripts).toEqual([]);
      expect(mockAiTranscriptRepo.find).not.toHaveBeenCalled();
    });

    it("loads transcripts when requested", async () => {
      mockAiInterviewRepo.findOne.mockResolvedValueOnce(mockInterview);
      mockAiTranscriptRepo.find.mockResolvedValueOnce([{ content: "hi" }]);

      const res = await service.getInterviewById("i1", "user-1", true);

      expect(res.transcripts).toEqual([{ content: "hi" }]);
      expect(mockAiTranscriptRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { interview_id: "i1" } }),
      );
    });

    it("wraps unexpected repository errors in InternalServerErrorException", async () => {
      mockAiInterviewRepo.findOne.mockRejectedValueOnce(new Error("db down"));

      await expect(service.getInterviewById("i1", "user-1")).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});

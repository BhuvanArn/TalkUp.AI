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
    releaseSlot: jest.Mock;
  };
  let mockContext: { deleteContext: jest.Mock };
  let prepareReadySessionSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockCapacity = {
      dequeueNext: jest.fn().mockResolvedValue("queued-1"),
      tryAcquireSlot: jest.fn().mockResolvedValue({ acquired: true }),
      enqueue: jest.fn(),
      releaseSlot: jest.fn(),
    };
    mockContext = { deleteContext: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationPromotionService,
        { provide: REDIS_CLIENT, useValue: { set: jest.fn(), del: jest.fn() } },
        { provide: HttpService, useValue: { axiosRef: { post: jest.fn() } } },
        { provide: SimulationCapacityService, useValue: mockCapacity },
        { provide: SimulationContextService, useValue: mockContext },
        {
          provide: SimulationWsTokenService,
          useValue: { buildEntrypoint: jest.fn() },
        },
        {
          provide: getRepositoryToken(ai_interview),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockInterview),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SimulationPromotionService);
    prepareReadySessionSpy = jest
      .spyOn(service, "prepareReadySession")
      .mockResolvedValue({ entrypoint: "ws://test" });
  });

  it("passes persisted jobContext when promoting a queued interview", async () => {
    const promotedId = await service.promoteNextFromQueue();

    expect(promotedId).toBe("queued-1");
    expect(prepareReadySessionSpy).toHaveBeenCalledWith(
      mockInterview,
      expect.objectContaining({
        type: "technical",
        language: "French",
        jobContext: "CV summary and job offer details",
      }),
    );
  });
});

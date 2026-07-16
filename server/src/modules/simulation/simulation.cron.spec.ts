import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { ai_interview } from "@entities/aiInterview.entity";
import { AiInterviewStatus } from "@common/enums/AiInterviewStatus";

import { SimulationCronService } from "./simulation.cron";
import { SimulationCapacityService } from "./simulation-capacity.service";
import { SimulationContextService } from "./simulation-context.service";
import { SimulationPromotionService } from "./simulation-promotion.service";

describe("SimulationCronService", () => {
  let service: SimulationCronService;
  let capacity: {
    listActiveInterviewIds: jest.Mock;
    getActiveMeta: jest.Mock;
    releaseSlot: jest.Mock;
  };
  let context: { deleteContext: jest.Mock };
  let promotion: { promoteNextFromQueue: jest.Mock };
  let repo: { update: jest.Mock };

  const ORIGINAL_ENV = { ...process.env };

  beforeEach(async () => {
    process.env.SIM_SLOT_TTL_SEC = "900";

    capacity = {
      listActiveInterviewIds: jest.fn().mockResolvedValue([]),
      getActiveMeta: jest.fn(),
      releaseSlot: jest.fn(),
    };
    context = { deleteContext: jest.fn() };
    promotion = { promoteNextFromQueue: jest.fn() };
    repo = { update: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationCronService,
        { provide: SimulationCapacityService, useValue: capacity },
        { provide: SimulationContextService, useValue: context },
        { provide: SimulationPromotionService, useValue: promotion },
        { provide: getRepositoryToken(ai_interview), useValue: repo },
      ],
    }).compile();

    service = module.get(SimulationCronService);
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.restoreAllMocks();
  });

  it("does nothing when there are no active interviews", async () => {
    capacity.listActiveInterviewIds.mockResolvedValueOnce([]);

    await service.expireStaleSlots();

    expect(capacity.releaseSlot).not.toHaveBeenCalled();
  });

  it("skips interviews with no meta", async () => {
    capacity.listActiveInterviewIds.mockResolvedValueOnce(["int-1"]);
    capacity.getActiveMeta.mockResolvedValueOnce(null);

    await service.expireStaleSlots();

    expect(capacity.releaseSlot).not.toHaveBeenCalled();
  });

  it("skips interviews whose heartbeat is within the TTL window", async () => {
    const now = Math.floor(Date.now() / 1000);
    capacity.listActiveInterviewIds.mockResolvedValueOnce(["int-1"]);
    capacity.getActiveMeta.mockResolvedValueOnce({
      userId: "user-1",
      lastHeartbeat: now, // fresh
    });

    await service.expireStaleSlots();

    expect(capacity.releaseSlot).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("expires, cleans up and promotes the next when heartbeat is stale", async () => {
    const stale = Math.floor(Date.now() / 1000) - 5000; // older than 900s
    capacity.listActiveInterviewIds.mockResolvedValueOnce(["int-1"]);
    capacity.getActiveMeta.mockResolvedValueOnce({
      userId: "user-1",
      lastHeartbeat: stale,
    });

    await service.expireStaleSlots();

    expect(capacity.releaseSlot).toHaveBeenCalledWith("int-1", "user-1");
    expect(context.deleteContext).toHaveBeenCalledWith("int-1");
    expect(repo.update).toHaveBeenCalledWith(
      { interview_id: "int-1" },
      { status: AiInterviewStatus.EXPIRED },
    );
    expect(promotion.promoteNextFromQueue).toHaveBeenCalled();
  });
});

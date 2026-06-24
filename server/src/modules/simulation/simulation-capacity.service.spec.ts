import { Test, TestingModule } from "@nestjs/testing";

import { REDIS_CLIENT } from "@common/redis/redis.constants";
import { SimulationCapacityService } from "./simulation-capacity.service";

describe("SimulationCapacityService", () => {
  let service: SimulationCapacityService;
  let redis: {
    get: jest.Mock;
    set: jest.Mock;
    eval: jest.Mock;
    llen: jest.Mock;
    rpush: jest.Mock;
    lpos: jest.Mock;
    lrem: jest.Mock;
    lpop: jest.Mock;
    del: jest.Mock;
    hgetall: jest.Mock;
    exists: jest.Mock;
    hset: jest.Mock;
    expire: jest.Mock;
    smembers: jest.Mock;
  };

  beforeEach(async () => {
    redis = {
      get: jest.fn().mockResolvedValue("0"),
      set: jest.fn().mockResolvedValue("OK"),
      eval: jest.fn().mockResolvedValue(1),
      llen: jest.fn().mockResolvedValue(0),
      rpush: jest.fn(),
      lpos: jest.fn().mockResolvedValue(null),
      lrem: jest.fn(),
      lpop: jest.fn().mockResolvedValue(null),
      del: jest.fn(),
      hgetall: jest.fn().mockResolvedValue({}),
      exists: jest.fn().mockResolvedValue(1),
      hset: jest.fn(),
      expire: jest.fn(),
      smembers: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationCapacityService,
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = module.get(SimulationCapacityService);
  });

  it("returns capacity snapshot", async () => {
    const snap = await service.getSnapshot();
    expect(snap.max).toBe(2);
    expect(snap.active).toBe(0);
  });

  it("acquires a slot via lua", async () => {
    const result = await service.tryAcquireSlot("int-1", "user-1");
    expect(result.acquired).toBe(true);
    expect(redis.eval).toHaveBeenCalled();
  });
});

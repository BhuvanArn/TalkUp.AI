import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { user_email } from "@entities/user.entity";

import { PUBLIC_STATS_CACHE_TTL_MS, StatsService } from "./stats.service";

describe("StatsService", () => {
  let service: StatsService;
  let userEmailRepo: { count: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    userEmailRepo = { count: jest.fn().mockResolvedValue(42) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: getRepositoryToken(user_email), useValue: userEmailRepo },
      ],
    }).compile();

    service = module.get(StatsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("counts only verified emails and returns only totalAccounts", async () => {
    const result = await service.getPublicStats();

    expect(userEmailRepo.count).toHaveBeenCalledWith({
      where: { is_verified: true },
    });
    expect(result).toEqual({ totalAccounts: 42 });
    expect(Object.keys(result)).toEqual(["totalAccounts"]);
  });

  it("returns the cached value within the 60s window", async () => {
    await service.getPublicStats();
    userEmailRepo.count.mockResolvedValue(99);

    jest.advanceTimersByTime(PUBLIC_STATS_CACHE_TTL_MS - 1);
    const result = await service.getPublicStats();

    expect(result).toEqual({ totalAccounts: 42 });
    expect(userEmailRepo.count).toHaveBeenCalledTimes(1);
  });

  it("refreshes the count once the cache expires", async () => {
    await service.getPublicStats();
    userEmailRepo.count.mockResolvedValue(99);

    jest.advanceTimersByTime(PUBLIC_STATS_CACHE_TTL_MS);
    const result = await service.getPublicStats();

    expect(result).toEqual({ totalAccounts: 99 });
    expect(userEmailRepo.count).toHaveBeenCalledTimes(2);
  });

  it("shares a single in-flight query between concurrent callers", async () => {
    const [a, b] = await Promise.all([
      service.getPublicStats(),
      service.getPublicStats(),
    ]);

    expect(a).toEqual({ totalAccounts: 42 });
    expect(b).toEqual({ totalAccounts: 42 });
    expect(userEmailRepo.count).toHaveBeenCalledTimes(1);
  });

  it("does not cache failures", async () => {
    userEmailRepo.count.mockRejectedValueOnce(new Error("db down"));

    await expect(service.getPublicStats()).rejects.toThrow("db down");
    await expect(service.getPublicStats()).resolves.toEqual({
      totalAccounts: 42,
    });
    expect(userEmailRepo.count).toHaveBeenCalledTimes(2);
  });
});

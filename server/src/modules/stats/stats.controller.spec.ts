import { Test, TestingModule } from "@nestjs/testing";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { ThrottlerGuard } from "@nestjs/throttler";

import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";

describe("StatsController", () => {
  let controller: StatsController;
  const mockService = { getPublicStats: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatsController],
      providers: [{ provide: StatsService, useValue: mockService }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get(StatsController);
  });

  it("returns the public stats from the service", async () => {
    mockService.getPublicStats.mockResolvedValue({ totalAccounts: 7 });

    await expect(controller.getPublicStats()).resolves.toEqual({
      totalAccounts: 7,
    });
    expect(mockService.getPublicStats).toHaveBeenCalledTimes(1);
  });

  it("is throttled and has no auth guard", () => {
    const routeGuards =
      Reflect.getMetadata(GUARDS_METADATA, controller.getPublicStats) ?? [];
    const classGuards = Reflect.getMetadata(GUARDS_METADATA, StatsController);

    expect(routeGuards).toEqual([ThrottlerGuard]);
    expect(classGuards).toBeUndefined();
  });
});

import { Test, TestingModule } from "@nestjs/testing";

import { applyMockAccessTokenGuard } from "@src/test/utils/mock-guards";
import { ApplicationStatus } from "@common/enums/ApplicationStatus";
import { UserStatus } from "@common/enums/UserStatus";
import { application } from "@entities/application.entity";
import { user } from "@entities/user.entity";

import { ApplicationsController } from "./applications.controller";
import { ApplicationsService } from "./applications.service";

describe("ApplicationsController", () => {
  let controller: ApplicationsController;
  let mockService: Partial<ApplicationsService>;

  const mockUser = {
    user_id: "u1",
    username: "alice",
    status: UserStatus.ACTIVE,
  } as user;

  const row = {
    application_id: "a1",
    user_id: "u1",
    company_name: "Datadog",
    job_title: "SRE",
    status: ApplicationStatus.SENT,
    offer_url: "https://example.com/job",
    offer_details: null,
    cv_details: null,
    applied_at: new Date("2026-07-09"),
    created_at: new Date("2026-07-09"),
    updated_at: new Date("2026-07-09"),
  } as application;

  beforeEach(async () => {
    mockService = {
      createFromUrl: jest.fn().mockResolvedValue(row),
      listForUser: jest.fn().mockResolvedValue([row]),
      updateApplication: jest
        .fn()
        .mockResolvedValue({ ...row, status: ApplicationStatus.INTERVIEW }),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const moduleBuilder = Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [{ provide: ApplicationsService, useValue: mockService }],
    });
    const module: TestingModule =
      await applyMockAccessTokenGuard(moduleBuilder).compile();
    controller = module.get(ApplicationsController);
  });

  it("guards the LLM-cost create route with the ThrottlerGuard so @Throttle fires", () => {
    // @Throttle is a no-op without an explicit ThrottlerGuard on the route.
    // Assert the guard is attached (metadata), not a throttler key string.
    const guards = Reflect.getMetadata(
      "__guards__",
      ApplicationsController.prototype.create,
    ) as unknown[] | undefined;
    const names = (guards ?? []).map((g) =>
      typeof g === "function" ? g.name : g?.constructor?.name,
    );
    expect(names).toContain("ThrottlerGuard");
  });

  it("creates an application from a url and maps to camelCase", async () => {
    const dto = await controller.create(mockUser, {
      url: "https://example.com/job",
    });
    expect(mockService.createFromUrl).toHaveBeenCalledWith(
      "u1",
      "https://example.com/job",
      undefined,
    );
    expect(dto.applicationId).toBe("a1");
    expect(dto.companyName).toBe("Datadog");
    expect(dto.status).toBe(ApplicationStatus.SENT);
  });

  it("lists the current user's applications", async () => {
    const list = await controller.list(mockUser);
    expect(mockService.listForUser).toHaveBeenCalledWith("u1");
    expect(list).toHaveLength(1);
    expect(list[0].jobTitle).toBe("SRE");
  });

  it("updates the status", async () => {
    const dto = await controller.updateStatus(mockUser, "a1", {
      status: ApplicationStatus.INTERVIEW,
    });
    expect(mockService.updateApplication).toHaveBeenCalledWith("u1", "a1", {
      status: ApplicationStatus.INTERVIEW,
      interviewAt: undefined,
    });
    expect(dto.status).toBe(ApplicationStatus.INTERVIEW);
  });

  it("updates the interview date", async () => {
    await controller.updateStatus(mockUser, "a1", {
      interviewAt: "2026-07-15T14:00:00.000Z",
    });
    expect(mockService.updateApplication).toHaveBeenCalledWith("u1", "a1", {
      status: undefined,
      interviewAt: "2026-07-15T14:00:00.000Z",
    });
  });

  it("deletes an application", async () => {
    await controller.removeOne(mockUser, "a1");
    expect(mockService.remove).toHaveBeenCalledWith("u1", "a1");
  });
});

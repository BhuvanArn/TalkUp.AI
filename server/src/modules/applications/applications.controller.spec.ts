import { Test, TestingModule } from "@nestjs/testing";
import { ThrottlerGuard } from "@nestjs/throttler";

import { applyMockAccessTokenGuard } from "@src/test/utils/mock-guards";
import { ApplicationStatus } from "@common/enums/ApplicationStatus";
import { UserStatus } from "@common/enums/UserStatus";
import { RoadmapExtraction } from "@common/utils/groqExtraction";
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

  const roadmapFixture: RoadmapExtraction = {
    match_score: 62,
    summary: "Close the Kubernetes gap.",
    topics: [
      {
        title: "Kubernetes fundamentals",
        priority: "HIGH",
        rationale: "Required by the offer, absent from the CV.",
        gap: true,
      },
    ],
    talking_points: [
      {
        mission: "Own the deployment pipeline",
        angle: "You've run GitHub Actions before, so you'd start there.",
      },
    ],
  };

  beforeEach(async () => {
    mockService = {
      createFromUrl: jest.fn().mockResolvedValue(row),
      listForUser: jest.fn().mockResolvedValue([row]),
      updateApplication: jest
        .fn()
        .mockResolvedValue({ ...row, status: ApplicationStatus.INTERVIEW }),
      remove: jest.fn().mockResolvedValue(undefined),
      getRoadmap: jest.fn().mockResolvedValue(roadmapFixture),
      regenerateRoadmap: jest.fn().mockResolvedValue(roadmapFixture),
    };

    const moduleBuilder = Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [{ provide: ApplicationsService, useValue: mockService }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) });
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

  it("returns the roadmap for an owned application", async () => {
    const dto = await controller.getRoadmap(mockUser, "a1");
    expect(mockService.getRoadmap).toHaveBeenCalledWith("u1", "a1");
    expect(dto.match_score).toBe(62);
    expect(dto.topics[0].title).toBe("Kubernetes fundamentals");
    expect(dto.talking_points[0].mission).toBe("Own the deployment pipeline");
  });

  it("regenerates the roadmap", async () => {
    const dto = await controller.regenerateRoadmap(mockUser, "a1");
    expect(mockService.regenerateRoadmap).toHaveBeenCalledWith("u1", "a1");
    expect(dto.summary).toBe("Close the Kubernetes gap.");
  });

  it("attaches ThrottlerGuard AND throttle metadata to the regenerate route", () => {
    // The whole point of the fix: a @Throttle with no ThrottlerGuard is a
    // no-op (that's the existing bug on POST /applications). So the assertion
    // that MATTERS is that the guard is attached to this route handler.
    // @UseGuards stores guards under Nest's GUARDS_METADATA key ("__guards__").
    const handler = ApplicationsController.prototype.regenerateRoadmap;
    const guards =
      (Reflect.getMetadata("__guards__", handler) as unknown[]) ?? [];
    expect(guards).toContain(ThrottlerGuard);

    // Also assert SOME throttler metadata exists on the handler, WITHOUT
    // hard-coding @nestjs/throttler's internal key format (it is undocumented
    // and version-specific — asserting an exact "THROTTLER:LIMITdefault"
    // string would be brittle across throttler majors). Any own-metadata key
    // mentioning "throttler"/"THROTTLER" proves @Throttle ran on this route.
    const throttleKeys = Reflect.getMetadataKeys(handler).filter((k) =>
      String(k).toLowerCase().includes("throttler"),
    );
    expect(throttleKeys.length).toBeGreaterThan(0);
  });

  it("attaches ThrottlerGuard AND throttle metadata to the GET roadmap route", () => {
    // A cache-miss GET reaches the same Groq generation, so it must be throttled
    // too — otherwise GET-spam bypasses the regenerate limit. Same guard-must-be
    // -attached assertion as regenerate (a bare @Throttle would be a no-op).
    const handler = ApplicationsController.prototype.getRoadmap;
    const guards =
      (Reflect.getMetadata("__guards__", handler) as unknown[]) ?? [];
    expect(guards).toContain(ThrottlerGuard);

    const throttleKeys = Reflect.getMetadataKeys(handler).filter((k) =>
      String(k).toLowerCase().includes("throttler"),
    );
    expect(throttleKeys.length).toBeGreaterThan(0);
  });
});

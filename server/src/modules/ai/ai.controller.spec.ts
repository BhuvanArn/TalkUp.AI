import { Test, TestingModule } from "@nestjs/testing";

import { AiInterviewStatus } from "@common/enums/AiInterviewStatus";

import applyMockAccessTokenGuard from "../../test/utils/mock-guards";

import { AiService } from "./ai.service";
import { AiController } from "./ai.controller";

describe("AiController", () => {
  let controller: AiController;
  let mockAiService: Partial<AiService>;

  const mockInterview = {
    interview_id: "test-interview-id",
    type: "Technical",
    user_id: "test-user-id",
    language: "English",
    status: AiInterviewStatus.ASKED,
    score: null,
    feedback: null,
    video_link: null,
    created_at: new Date(),
    updated_at: new Date(),
    ended_at: null,
  };

  beforeEach(async () => {
    mockAiService = {
      createInterview: jest.fn(),
      getUserInterviews: jest.fn(),
      getInterviewById: jest.fn(),
      editAiInterview: jest.fn(),
      addTranscripts: jest.fn(),
      chat: jest.fn(),
    };

    const moduleBuilder = Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: mockAiService,
        },
      ],
    });

    // override the real guard so JwtService and DB repos are not required in unit tests
    const module: TestingModule =
      await applyMockAccessTokenGuard(moduleBuilder).compile();

    controller = module.get<AiController>(AiController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("controller methods", () => {
    it("createAiInterview should call service and return result", async () => {
      const dto = { type: "Technical", language: "English" } as any;
      const userId = "user-1";
      const serviceResult = { interviewID: "i1", entrypoint: "start" };
      (mockAiService.createInterview as jest.Mock).mockResolvedValueOnce(
        serviceResult,
      );

      const res = await controller.createAiInterview(dto, userId);

      expect(mockAiService.createInterview).toHaveBeenCalledWith(dto, userId);
      expect(res).toEqual(serviceResult);
    });

    it("getUserInterviews should return list from service", async () => {
      const query = {} as any;
      const userId = "user-1";
      const serviceResult = { data: [mockInterview], meta: { total: 1 } };
      (mockAiService.getUserInterviews as jest.Mock).mockResolvedValueOnce(
        serviceResult,
      );

      const res = await controller.getUserInterviews(query, userId);

      expect(mockAiService.getUserInterviews).toHaveBeenCalledWith(
        query,
        userId,
      );
      expect(res).toEqual(serviceResult);
    });

    it("getOneInterview should throw NotFoundException when interview not found", async () => {
      const id = "i-nonexistent";
      const userId = "user-1";
      (mockAiService.getInterviewById as jest.Mock).mockRejectedValueOnce(
        new Error("NotFoundException"),
      );

      await expect(controller.getOneInterview(id, userId)).rejects.toThrow(
        "NotFoundException",
      );

      expect(mockAiService.getInterviewById).toHaveBeenCalledWith(
        id,
        userId,
        true,
      );
    });

    it("getOneInterview should return interview when found", async () => {
      const id = mockInterview.interview_id;
      const userId = mockInterview.user_id;
      const interviewWithTranscripts = { ...mockInterview, transcripts: [] };
      (mockAiService.getInterviewById as jest.Mock).mockResolvedValueOnce(
        interviewWithTranscripts,
      );

      const res = await controller.getOneInterview(id, userId);

      expect(mockAiService.getInterviewById).toHaveBeenCalledWith(
        id,
        userId,
        true,
      );
      expect(res).toEqual(interviewWithTranscripts);
    });

    it("editAiInterview should call service and return true", async () => {
      const id = "i1";
      const dto = { status: AiInterviewStatus.COMPLETED } as any;
      const userId = "user-1";
      (mockAiService.editAiInterview as jest.Mock).mockResolvedValueOnce(true);

      const res = await controller.editAiInterview(id, dto, userId);

      expect(mockAiService.editAiInterview).toHaveBeenCalledWith(
        id,
        dto,
        userId,
      );
      expect(res).toEqual(true);
    });

    it("chat should call service with the caller's id and return the reply", async () => {
      const dto = { message: "How do I answer behavioral questions?" } as any;
      const serviceResult = { reply: "Use the STAR method." };
      (mockAiService.chat as jest.Mock).mockResolvedValueOnce(serviceResult);

      const res = await controller.chat(dto, "user-1");

      expect(mockAiService.chat).toHaveBeenCalledWith(dto, "user-1");
      expect(res).toEqual(serviceResult);
    });

    it("guards the chat route with the ThrottlerGuard so @Throttle fires", () => {
      // @Throttle is a no-op without an explicit route ThrottlerGuard.
      const guards = Reflect.getMetadata(
        "__guards__",
        AiController.prototype.chat,
      ) as unknown[] | undefined;
      const names = (guards ?? []).map((g: any) =>
        typeof g === "function" ? g.name : g?.constructor?.name,
      );
      expect(names).toContain("ThrottlerGuard");
    });

    it("addTranscripts should call service and return result", async () => {
      const id = "i1";
      const dto = {
        transcripts: [{ content: "hello", who_stated: "user" }],
      } as any;
      const userId = "user-1";
      const serviceResult = {
        inserted: 1,
        data: [{ id: 1, content: "hello" }],
      };
      (mockAiService.addTranscripts as jest.Mock).mockResolvedValueOnce(
        serviceResult,
      );

      const res = await controller.addTranscripts(id, dto, userId);

      expect(mockAiService.addTranscripts).toHaveBeenCalledWith(
        id,
        dto,
        userId,
      );
      expect(res).toEqual(serviceResult);
    });
  });
});

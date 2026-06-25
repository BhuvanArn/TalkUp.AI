import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { REDIS_CLIENT } from "@common/redis/redis.constants";
import { CreateAiInterviewDto } from "../ai/dto/createAiInterview.dto";
import { SimulationContextService } from "./simulation-context.service";
import { SimulationCapacityService } from "./simulation-capacity.service";
import { SimRedisKeys } from "./simulation.redis-keys";

describe("SimulationContextService", () => {
  let service: SimulationContextService;
  let redis: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let capacity: { touchHeartbeat: jest.Mock };

  beforeEach(async () => {
    redis = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue("OK"),
      del: jest.fn(),
    };
    capacity = { touchHeartbeat: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationContextService,
        { provide: REDIS_CLIENT, useValue: redis },
        { provide: SimulationCapacityService, useValue: capacity },
      ],
    }).compile();

    service = module.get(SimulationContextService);
  });

  describe("buildSystemPrompt", () => {
    it("includes provided language, type and trimmed jobContext", () => {
      const dto: CreateAiInterviewDto = {
        type: " technical ",
        language: " English ",
        jobContext: "  Senior backend role  ",
      } as CreateAiInterviewDto;

      const prompt = service.buildSystemPrompt(dto);

      expect(prompt).toContain("Langue de l'entretien: English.");
      expect(prompt).toContain("Type de simulation: technical.");
      expect(prompt).toContain("Senior backend role");
      expect(prompt).not.toContain("Pas de CV/offre");
    });

    it("falls back to default language/type and generic note without jobContext", () => {
      const prompt = service.buildSystemPrompt({} as CreateAiInterviewDto);

      expect(prompt).toContain("Langue de l'entretien: French.");
      expect(prompt).toContain("Type de simulation: general.");
      expect(prompt).toContain("Pas de CV/offre detailles");
    });

    it("treats blank/whitespace jobContext as absent", () => {
      const prompt = service.buildSystemPrompt({
        type: "hr",
        language: "French",
        jobContext: "   ",
      } as CreateAiInterviewDto);

      expect(prompt).toContain("Pas de CV/offre detailles");
    });
  });

  describe("storeContext", () => {
    it("stores an empty-history payload with a TTL", async () => {
      await service.storeContext("int-1", "user-1", "SYSTEM");

      expect(redis.set).toHaveBeenCalledWith(
        SimRedisKeys.context("int-1"),
        expect.any(String),
        "EX",
        expect.any(Number),
      );

      const payload = JSON.parse(redis.set.mock.calls[0][1]);
      expect(payload).toEqual({
        interviewId: "int-1",
        userId: "user-1",
        systemPrompt: "SYSTEM",
        history: [],
      });
    });
  });

  describe("getContextForSts", () => {
    it("parses and returns the stored context", async () => {
      const stored = {
        interviewId: "int-1",
        userId: "user-1",
        systemPrompt: "SYSTEM",
        history: [],
      };
      redis.get.mockResolvedValueOnce(JSON.stringify(stored));

      expect(await service.getContextForSts("int-1")).toEqual(stored);
    });

    it("throws NotFoundException when no context is stored", async () => {
      redis.get.mockResolvedValueOnce(null);

      await expect(service.getContextForSts("int-1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("appendTurn", () => {
    const baseCtx = {
      interviewId: "int-1",
      userId: "user-1",
      systemPrompt: "SYSTEM",
      history: [] as { role: string; content: string }[],
    };

    it("appends user/assistant turns, persists, and touches heartbeat", async () => {
      redis.get.mockResolvedValueOnce(JSON.stringify(baseCtx));

      await service.appendTurn("int-1", "hello", "hi there");

      const saved = JSON.parse(redis.set.mock.calls[0][1]);
      expect(saved.history).toEqual([
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi there" },
      ]);
      expect(capacity.touchHeartbeat).toHaveBeenCalledWith("int-1", "user-1");
    });

    it("trims history to the last historyMaxTurns*2 entries", async () => {
      const longHistory = Array.from({ length: 60 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "assistant",
        content: `m${i}`,
      }));
      redis.get.mockResolvedValueOnce(
        JSON.stringify({ ...baseCtx, history: longHistory }),
      );

      await service.appendTurn("int-1", "new-user", "new-assistant");

      const saved = JSON.parse(redis.set.mock.calls[0][1]);
      // historyMaxTurns defaults to 30 -> keep last 60 entries.
      expect(saved.history.length).toBe(60);
      expect(saved.history[saved.history.length - 1]).toEqual({
        role: "assistant",
        content: "new-assistant",
      });
    });
  });

  describe("deleteContext", () => {
    it("deletes the context key", async () => {
      await service.deleteContext("int-1");
      expect(redis.del).toHaveBeenCalledWith(SimRedisKeys.context("int-1"));
    });
  });
});

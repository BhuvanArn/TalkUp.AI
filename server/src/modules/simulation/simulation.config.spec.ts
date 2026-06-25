import {
  loadSimulationConfig,
  resolveAiWsPublicBase,
} from "./simulation.config";

describe("simulation.config", () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe("loadSimulationConfig", () => {
    it("returns defaults when no env vars are set", () => {
      delete process.env.SIM_MAX_CONCURRENT;
      delete process.env.SIM_QUEUE_MAX_SIZE;
      delete process.env.SIM_SLOT_TTL_SEC;
      delete process.env.SIM_QUEUE_ENTRY_TTL_SEC;
      delete process.env.SIM_WS_TOKEN_TTL_SEC;
      delete process.env.SIM_ESTIMATED_TURN_SEC;
      delete process.env.SIM_HISTORY_MAX_TURNS;
      delete process.env.SIM_CONTEXT_TTL_SEC;
      delete process.env.SIM_HEARTBEAT_INTERVAL_SEC;

      expect(loadSimulationConfig()).toEqual({
        maxConcurrent: 2,
        queueMaxSize: 20,
        slotTtlSec: 900,
        queueEntryTtlSec: 3600,
        wsTokenTtlSec: 900,
        estimatedTurnSec: 90,
        historyMaxTurns: 30,
        contextTtlSec: 7200,
        heartbeatIntervalSec: 60,
      });
    });

    it("parses overrides from env vars", () => {
      process.env.SIM_MAX_CONCURRENT = "5";
      process.env.SIM_QUEUE_MAX_SIZE = "50";
      process.env.SIM_SLOT_TTL_SEC = "120";
      process.env.SIM_QUEUE_ENTRY_TTL_SEC = "240";
      process.env.SIM_WS_TOKEN_TTL_SEC = "60";
      process.env.SIM_ESTIMATED_TURN_SEC = "45";
      process.env.SIM_HISTORY_MAX_TURNS = "10";
      process.env.SIM_CONTEXT_TTL_SEC = "3600";
      process.env.SIM_HEARTBEAT_INTERVAL_SEC = "30";

      expect(loadSimulationConfig()).toEqual({
        maxConcurrent: 5,
        queueMaxSize: 50,
        slotTtlSec: 120,
        queueEntryTtlSec: 240,
        wsTokenTtlSec: 60,
        estimatedTurnSec: 45,
        historyMaxTurns: 10,
        contextTtlSec: 3600,
        heartbeatIntervalSec: 30,
      });
    });
  });

  describe("resolveAiWsPublicBase", () => {
    it("uses AI_WS_PUBLIC_URL when set, stripping a trailing slash", () => {
      process.env.AI_WS_PUBLIC_URL = "wss://ws.example.com/ws/";
      delete process.env.AI_SERVER_URL;

      expect(resolveAiWsPublicBase()).toBe("wss://ws.example.com/ws");
    });

    it("derives ws:// from an http AI_SERVER_URL", () => {
      delete process.env.AI_WS_PUBLIC_URL;
      process.env.AI_SERVER_URL = "http://ai.local:9000/";

      expect(resolveAiWsPublicBase()).toBe("ws://ai.local:9000/ws");
    });

    it("derives wss:// from an https AI_SERVER_URL", () => {
      delete process.env.AI_WS_PUBLIC_URL;
      process.env.AI_SERVER_URL = "https://ai.example.com";

      expect(resolveAiWsPublicBase()).toBe("wss://ai.example.com/ws");
    });

    it("throws when neither URL is configured", () => {
      delete process.env.AI_WS_PUBLIC_URL;
      delete process.env.AI_SERVER_URL;

      expect(() => resolveAiWsPublicBase()).toThrow(
        /AI_WS_PUBLIC_URL or AI_SERVER_URL/,
      );
    });

    it("ignores a blank AI_WS_PUBLIC_URL and falls back to AI_SERVER_URL", () => {
      process.env.AI_WS_PUBLIC_URL = "   ";
      process.env.AI_SERVER_URL = "https://ai.example.com";

      expect(resolveAiWsPublicBase()).toBe("wss://ai.example.com/ws");
    });
  });
});

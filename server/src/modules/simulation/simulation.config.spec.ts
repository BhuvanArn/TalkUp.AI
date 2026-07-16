import {
  loadAiInitTimeoutMs,
  loadSimulationConfig,
  parsePositiveIntEnv,
  resolveAiWsPublicBase,
  SIM_AI_INIT_TIMEOUT_MS_DEFAULT,
} from "./simulation.config";

describe("simulation.config", () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe("parsePositiveIntEnv", () => {
    it("returns fallback for missing, invalid, zero, or negative values", () => {
      expect(parsePositiveIntEnv(undefined, 30)).toBe(30);
      expect(parsePositiveIntEnv("", 30)).toBe(30);
      expect(parsePositiveIntEnv("abc", 30)).toBe(30);
      expect(parsePositiveIntEnv("0", 30)).toBe(30);
      expect(parsePositiveIntEnv("-5", 30)).toBe(30);
    });

    it("parses valid positive integers", () => {
      expect(parsePositiveIntEnv("45", 30)).toBe(45);
      expect(parsePositiveIntEnv("90.9", 30)).toBe(90);
    });
  });

  describe("loadAiInitTimeoutMs", () => {
    it("defaults to 30s when unset or invalid", () => {
      delete process.env.SIM_AI_INIT_TIMEOUT_MS;
      expect(loadAiInitTimeoutMs()).toBe(SIM_AI_INIT_TIMEOUT_MS_DEFAULT);

      process.env.SIM_AI_INIT_TIMEOUT_MS = "not-a-number";
      expect(loadAiInitTimeoutMs()).toBe(SIM_AI_INIT_TIMEOUT_MS_DEFAULT);
    });

    it("parses a valid override", () => {
      process.env.SIM_AI_INIT_TIMEOUT_MS = "45000";
      expect(loadAiInitTimeoutMs()).toBe(45_000);
    });
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

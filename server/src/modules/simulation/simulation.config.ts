export type SimulationConfig = {
  maxConcurrent: number;
  queueMaxSize: number;
  slotTtlSec: number;
  queueEntryTtlSec: number;
  wsTokenTtlSec: number;
  estimatedTurnSec: number;
  historyMaxTurns: number;
  contextTtlSec: number;
  heartbeatIntervalSec: number;
};

export const SIM_AI_INIT_TIMEOUT_MS_DEFAULT = 30_000;

/** Parse a positive integer env var; invalid or non-positive values use fallback. */
export function parsePositiveIntEnv(
  raw: string | undefined,
  fallback: number,
): number {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
}

export function loadAiInitTimeoutMs(): number {
  return parsePositiveIntEnv(
    process.env.SIM_AI_INIT_TIMEOUT_MS,
    SIM_AI_INIT_TIMEOUT_MS_DEFAULT,
  );
}

export function loadSimulationConfig(): SimulationConfig {
  return {
    maxConcurrent: parsePositiveIntEnv(process.env.SIM_MAX_CONCURRENT, 2),
    queueMaxSize: parsePositiveIntEnv(process.env.SIM_QUEUE_MAX_SIZE, 20),
    slotTtlSec: parsePositiveIntEnv(process.env.SIM_SLOT_TTL_SEC, 900),
    queueEntryTtlSec: parsePositiveIntEnv(
      process.env.SIM_QUEUE_ENTRY_TTL_SEC,
      3600,
    ),
    wsTokenTtlSec: parsePositiveIntEnv(process.env.SIM_WS_TOKEN_TTL_SEC, 900),
    estimatedTurnSec: parsePositiveIntEnv(
      process.env.SIM_ESTIMATED_TURN_SEC,
      90,
    ),
    historyMaxTurns: parsePositiveIntEnv(
      process.env.SIM_HISTORY_MAX_TURNS,
      30,
    ),
    contextTtlSec: parsePositiveIntEnv(process.env.SIM_CONTEXT_TTL_SEC, 7200),
    heartbeatIntervalSec: parsePositiveIntEnv(
      process.env.SIM_HEARTBEAT_INTERVAL_SEC,
      60,
    ),
  };
}

/** Public WebSocket URL for browsers (VM/proxy). Falls back from AI_SERVER_URL for local dev. */
export function resolveAiWsPublicBase(): string {
  const explicit = process.env.AI_WS_PUBLIC_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const aiServer = process.env.AI_SERVER_URL?.trim();
  if (!aiServer) {
    throw new Error(
      "AI_WS_PUBLIC_URL or AI_SERVER_URL must be set to build simulation WebSocket entrypoints.",
    );
  }

  const wsBase = aiServer.replace(/^http/i, (m) =>
    m.toLowerCase() === "https" ? "wss" : "ws",
  );
  return `${wsBase.replace(/\/$/, "")}/ws`;
}

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

export function loadSimulationConfig(): SimulationConfig {
  return {
    maxConcurrent: parseInt(process.env.SIM_MAX_CONCURRENT ?? "2", 10),
    queueMaxSize: parseInt(process.env.SIM_QUEUE_MAX_SIZE ?? "20", 10),
    slotTtlSec: parseInt(process.env.SIM_SLOT_TTL_SEC ?? "900", 10),
    queueEntryTtlSec: parseInt(process.env.SIM_QUEUE_ENTRY_TTL_SEC ?? "3600", 10),
    wsTokenTtlSec: parseInt(process.env.SIM_WS_TOKEN_TTL_SEC ?? "900", 10),
    estimatedTurnSec: parseInt(process.env.SIM_ESTIMATED_TURN_SEC ?? "90", 10),
    historyMaxTurns: parseInt(process.env.SIM_HISTORY_MAX_TURNS ?? "30", 10),
    contextTtlSec: parseInt(process.env.SIM_CONTEXT_TTL_SEC ?? "7200", 10),
    heartbeatIntervalSec: parseInt(
      process.env.SIM_HEARTBEAT_INTERVAL_SEC ?? "60",
      10,
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

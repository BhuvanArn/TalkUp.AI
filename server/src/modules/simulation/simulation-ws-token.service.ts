import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import {
  loadSimulationConfig,
  resolveAiWsPublicBase,
} from "./simulation.config";

export type SimulationWsTokenPayload = {
  purpose: "simulation_ws";
  interviewId: string;
  userId: string;
};

@Injectable()
export class SimulationWsTokenService {
  constructor(private readonly jwtService: JwtService) {}

  buildEntrypoint(interviewId: string, userId: string): string {
    const { wsTokenTtlSec } = loadSimulationConfig();
    const token = this.jwtService.sign(
      {
        purpose: "simulation_ws",
        interviewId,
        userId,
      } satisfies SimulationWsTokenPayload,
      {
        expiresIn: wsTokenTtlSec,
      },
    );

    const base = resolveAiWsPublicBase();
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}token=${encodeURIComponent(token)}`;
  }
}

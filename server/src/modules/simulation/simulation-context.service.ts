import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CLIENT } from "@common/redis/redis.constants";

import { CreateAiInterviewDto } from "../ai/dto/createAiInterview.dto";
import { loadSimulationConfig } from "./simulation.config";
import { SimRedisKeys } from "./simulation.redis-keys";
import { SimulationCapacityService } from "./simulation-capacity.service";

export type SimulationChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type SimulationSessionContext = {
  interviewId: string;
  userId: string;
  systemPrompt: string;
  history: SimulationChatTurn[];
};

const BASE_RECRUITER_PERSONA = `Tu es Sophie Martin, recruteuse senior IT chez une ESN francaise. Tu es chaleureuse, professionnelle, patiente et humaine. Tu parles de facon naturelle comme dans une vraie conversation. Tu dois repondre uniquement a la derniere prise de parole du candidat, en une seule reponse courte et naturelle. N'ecris jamais un dialogue multi-tours, n'imite jamais des balises comme system: ou user:, et ne recopie jamais l'historique de conversation.`;

@Injectable()
export class SimulationContextService {
  private readonly logger = new Logger(SimulationContextService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly capacity: SimulationCapacityService,
  ) {}

  buildSystemPrompt(dto: CreateAiInterviewDto): string {
    const language = dto.language?.trim() || "French";
    const interviewType = dto.type?.trim() || "general";
    const jobContext = dto.jobContext?.trim();

    let prompt = `${BASE_RECRUITER_PERSONA}\n\nLangue de l'entretien: ${language}.\nType de simulation: ${interviewType}.`;

    if (jobContext) {
      prompt += `\n\nContexte candidat et poste (a utiliser pour personnaliser tes questions, sans tout reciter):\n${jobContext}`;
    } else {
      prompt +=
        "\n\n(Pas de CV/offre detailles pour cette session — pose des questions generiques adaptees au type de simulation.)";
    }

    return prompt;
  }

  async storeContext(
    interviewId: string,
    userId: string,
    systemPrompt: string,
  ): Promise<void> {
    const { contextTtlSec } = loadSimulationConfig();
    const payload: SimulationSessionContext = {
      interviewId,
      userId,
      systemPrompt,
      history: [],
    };

    await this.redis.set(
      SimRedisKeys.context(interviewId),
      JSON.stringify(payload),
      "EX",
      contextTtlSec,
    );
  }

  async getContextForSts(
    interviewId: string,
  ): Promise<SimulationSessionContext> {
    const raw = await this.redis.get(SimRedisKeys.context(interviewId));
    if (!raw) {
      this.logger.warn(`No simulation context for interview ${interviewId}`);
      throw new NotFoundException("Simulation session context not found.");
    }

    return JSON.parse(raw) as SimulationSessionContext;
  }

  async appendTurn(
    interviewId: string,
    userText: string,
    assistantText: string,
  ): Promise<void> {
    const ctx = await this.getContextForSts(interviewId);
    const { contextTtlSec, historyMaxTurns } = loadSimulationConfig();

    ctx.history.push({ role: "user", content: userText });
    ctx.history.push({ role: "assistant", content: assistantText });

    if (ctx.history.length > historyMaxTurns * 2) {
      ctx.history = ctx.history.slice(-historyMaxTurns * 2);
    }

    await this.redis.set(
      SimRedisKeys.context(interviewId),
      JSON.stringify(ctx),
      "EX",
      contextTtlSec,
    );

    await this.capacity.touchHeartbeat(interviewId, ctx.userId);
  }

  async deleteContext(interviewId: string): Promise<void> {
    await this.redis.del(SimRedisKeys.context(interviewId));
  }
}

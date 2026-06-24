import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { HttpService } from "@nestjs/axios";
import { Repository } from "typeorm";
import Redis from "ioredis";
import { Inject } from "@nestjs/common";

import { REDIS_CLIENT } from "@common/redis/redis.constants";
import { ai_interview } from "@entities/aiInterview.entity";
import { AiInterviewStatus } from "@common/enums/AiInterviewStatus";
import { CreateAiInterviewDto } from "../ai/dto/createAiInterview.dto";

import { SimulationCapacityService } from "./simulation-capacity.service";
import { SimulationContextService } from "./simulation-context.service";
import { SimulationWsTokenService } from "./simulation-ws-token.service";
import { SimRedisKeys } from "./simulation.redis-keys";
import { loadSimulationConfig } from "./simulation.config";

function createDtoFromInterview(interview: ai_interview): CreateAiInterviewDto {
  return {
    type: interview.type,
    language: interview.language,
    jobContext: interview.job_context ?? undefined,
    status: AiInterviewStatus.ASKED,
  };
}

export type ReadySessionPayload = {
  entrypoint: string;
};

@Injectable()
export class SimulationPromotionService {
  private readonly logger = new Logger(SimulationPromotionService.name);
  private readonly aiServerUrl = process.env.AI_SERVER_URL ?? "";

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly httpService: HttpService,
    private readonly capacity: SimulationCapacityService,
    private readonly context: SimulationContextService,
    private readonly wsToken: SimulationWsTokenService,
    @InjectRepository(ai_interview)
    private readonly interviewRepo: Repository<ai_interview>,
  ) {}

  private readyKey(interviewId: string): string {
    return `${SimRedisKeys.context(interviewId)}:ready`;
  }

  async prepareReadySession(
    interview: ai_interview,
    dto: CreateAiInterviewDto,
  ): Promise<ReadySessionPayload> {
    const userId = interview.user_id as string;
    const systemPrompt = this.context.buildSystemPrompt(dto);
    await this.context.storeContext(
      interview.interview_id,
      userId,
      systemPrompt,
    );

    await this.callAiInitialization();

    const entrypoint = this.wsToken.buildEntrypoint(
      interview.interview_id,
      userId,
    );

    const { wsTokenTtlSec } = loadSimulationConfig();
    await this.redis.set(
      this.readyKey(interview.interview_id),
      JSON.stringify({ entrypoint }),
      "EX",
      wsTokenTtlSec,
    );

    await this.interviewRepo.update(
      { interview_id: interview.interview_id },
      { status: AiInterviewStatus.ASKED },
    );

    return { entrypoint };
  }

  async getReadyPayload(
    interviewId: string,
  ): Promise<ReadySessionPayload | null> {
    const raw = await this.redis.get(this.readyKey(interviewId));
    if (!raw) return null;
    return JSON.parse(raw) as ReadySessionPayload;
  }

  async promoteNextFromQueue(): Promise<string | null> {
    while (true) {
      const nextId = await this.capacity.dequeueNext();
      if (!nextId) return null;

      const interview = await this.interviewRepo.findOne({
        where: { interview_id: nextId, status: AiInterviewStatus.QUEUED },
      });

      if (!interview) continue;

      const acquired = await this.capacity.tryAcquireSlot(
        nextId,
        interview.user_id as string,
      );

      if (!acquired.acquired) {
        await this.capacity.enqueue(nextId);
        return null;
      }

      const dto = createDtoFromInterview(interview);

      try {
        await this.prepareReadySession(interview, dto);
        this.logger.log(`Promoted queued interview ${nextId}`);
        return nextId;
      } catch (err) {
        this.logger.error(
          `Failed to promote interview ${nextId}: ${(err as Error).message}`,
        );
        await this.rollbackPreparedSession(
          nextId,
          interview.user_id as string,
        );
        await this.interviewRepo.update(
          { interview_id: nextId },
          { status: AiInterviewStatus.EXPIRED },
        );
        continue;
      }
    }
  }

  async clearReady(interviewId: string): Promise<void> {
    await this.redis.del(this.readyKey(interviewId));
  }

  /**
   * Releases Redis capacity and partial session artifacts when prepareReadySession fails
   * after tryAcquireSlot succeeded.
   */
  async rollbackPreparedSession(
    interviewId: string,
    userId: string,
  ): Promise<void> {
    await this.capacity.releaseSlot(interviewId, userId);
    await this.context.deleteContext(interviewId);
    await this.clearReady(interviewId);
  }

  private async callAiInitialization(): Promise<void> {
    const commKey = process.env.AI_COMMUNICATION_KEY ?? "c7yPY8u644OE";

    try {
      const response = await this.httpService.axiosRef.post(
        `${this.aiServerUrl}/process/initialization`,
        {
          key: commKey,
          type: "initialization",
          format: "text",
          data: "",
        },
      );

      if (response.status !== 200) {
        throw new InternalServerErrorException("AI server error.");
      }
    } catch (error) {
      this.logger.error(
        `AI initialization failed: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        "Internal server error while contacting AI server.",
      );
    }
  }
}

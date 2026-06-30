import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsOrder, In, Repository } from "typeorm";

import { ai_interview } from "@entities/aiInterview.entity";
import { ai_transcript } from "@entities/aiTranscript.entity";

import {
  ACTIVE_SIMULATION_STATUSES,
  AiInterviewStatus,
} from "@common/enums/AiInterviewStatus";

import { CreateAiInterviewDto } from "./dto/createAiInterview.dto";
import { PutAiInterviewDto } from "./dto/putAiInterview.dto";
import { GetInterviewsQueryDto } from "./dto/getInterviewsQuery.dto";
import { CreateAiTranscriptsDto } from "./dto/createAiTranscripts.dto";
import { CreateAiInterviewResponseDto } from "./dto/createAiInterviewResponse.dto";
import { InterviewSessionDto } from "./dto/interviewSession.dto";

import { SimulationCapacityService } from "../simulation/simulation-capacity.service";
import { SimulationContextService } from "../simulation/simulation-context.service";
import { SimulationPromotionService } from "../simulation/simulation-promotion.service";
import { SimulationVerbalAnalysisService } from "../simulation/simulation-verbal-analysis.service";
import { loadSimulationConfig } from "../simulation/simulation.config";

@Injectable()
export class AiService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(ai_interview)
    private aiInterviewRepository: Repository<ai_interview>,
    @InjectRepository(ai_transcript)
    private aiTranscriptRepository: Repository<ai_transcript>,
    private readonly capacity: SimulationCapacityService,
    private readonly context: SimulationContextService,
    private readonly promotion: SimulationPromotionService,
    private readonly verbalAnalysis: SimulationVerbalAnalysisService,
  ) {
    this.logger = new Logger(AiService.name);
  }

  async getCapacity() {
    return this.capacity.getSnapshot();
  }

  async createInterview(
    dto: CreateAiInterviewDto,
    userId: string,
  ): Promise<CreateAiInterviewResponseDto> {
    try {
      const redisActiveId =
        await this.capacity.getUserActiveInterviewId(userId);
      if (redisActiveId) {
        throw new ConflictException(
          "A simulation is already active or queued for this user.",
        );
      }

      const alreadyExists = await this.aiInterviewRepository.findOne({
        where: {
          user_id: userId,
          status: In(ACTIVE_SIMULATION_STATUSES),
        },
      });

      if (alreadyExists) {
        this.logger.warn(`Active simulation already exists for user ${userId}`);
        throw new ConflictException(
          "A simulation is already active or queued for this user.",
        );
      }

      const newInterview = this.aiInterviewRepository.create({
        user_id: userId,
        type: dto.type,
        language: dto.language,
        job_context: dto.jobContext?.trim() || null,
        status: AiInterviewStatus.QUEUED,
      });

      await this.aiInterviewRepository.save(newInterview);

      const acquired = await this.capacity.tryAcquireSlot(
        newInterview.interview_id,
        userId,
      );

      if (acquired.acquired) {
        try {
          const { entrypoint } = await this.promotion.prepareReadySession(
            newInterview,
            dto,
          );

          return {
            interviewID: newInterview.interview_id,
            status: "ready",
            entrypoint,
            queuePosition: 0,
          };
        } catch (prepError) {
          await this.promotion.rollbackPreparedSession(
            newInterview.interview_id,
            userId,
          );
          await this.aiInterviewRepository.update(
            { interview_id: newInterview.interview_id },
            { status: AiInterviewStatus.EXPIRED },
          );
          await this.promotion.promoteNextFromQueue();

          this.logger.error(
            `Failed to prepare simulation session for interview ${newInterview.interview_id}: ${(prepError as Error).message}`,
            (prepError as Error).stack,
          );
          throw new InternalServerErrorException(
            "Internal server error while preparing simulation session.",
          );
        }
      }

      const enqueued = await this.capacity.enqueue(newInterview.interview_id);
      if (!enqueued.ok) {
        await this.aiInterviewRepository.delete({
          interview_id: newInterview.interview_id,
        });
        throw new ServiceUnavailableException(
          "Simulation queue is full. Please try again later.",
        );
      }

      const queuePosition = await this.capacity.getQueuePosition(
        newInterview.interview_id,
      );
      const { estimatedTurnSec } = loadSimulationConfig();

      return {
        interviewID: newInterview.interview_id,
        status: "queued",
        entrypoint: null,
        queuePosition,
        estimatedWaitSec: queuePosition * estimatedTurnSec,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof ServiceUnavailableException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to create AI interview for user ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while creating AI interview.",
      );
    }
  }

  async getInterviewSession(
    interviewId: string,
    userId: string,
  ): Promise<InterviewSessionDto> {
    const interview = await this.getInterviewById(interviewId, userId);
    const { estimatedTurnSec } = loadSimulationConfig();

    if (
      interview.status === AiInterviewStatus.COMPLETED ||
      interview.status === AiInterviewStatus.CANCELLED ||
      interview.status === AiInterviewStatus.EXPIRED
    ) {
      return {
        interviewID: interviewId,
        dbStatus: interview.status,
        sessionStatus: "ended",
        queuePosition: 0,
        entrypoint: null,
      };
    }

    if (interview.status === AiInterviewStatus.IN_PROGRESS) {
      const ready = await this.promotion.getReadyPayload(interviewId);
      return {
        interviewID: interviewId,
        dbStatus: interview.status,
        sessionStatus: "active",
        queuePosition: 0,
        entrypoint: ready?.entrypoint ?? null,
      };
    }

    if (interview.status === AiInterviewStatus.QUEUED) {
      const queuePosition = await this.capacity.getQueuePosition(interviewId);
      return {
        interviewID: interviewId,
        dbStatus: interview.status,
        sessionStatus: "queued",
        queuePosition,
        entrypoint: null,
        estimatedWaitSec: queuePosition * estimatedTurnSec,
      };
    }

    const ready = await this.promotion.getReadyPayload(interviewId);
    return {
      interviewID: interviewId,
      dbStatus: interview.status,
      sessionStatus: "ready",
      queuePosition: 0,
      entrypoint: ready?.entrypoint ?? null,
    };
  }

  async heartbeatSimulation(
    interviewId: string,
    userId: string,
  ): Promise<{ ok: true }> {
    const interview = await this.getInterviewById(interviewId, userId);

    if (
      interview.status !== AiInterviewStatus.ASKED &&
      interview.status !== AiInterviewStatus.IN_PROGRESS
    ) {
      throw new ConflictException(
        "Heartbeat is only allowed for active simulation sessions.",
      );
    }

    await this.capacity.touchHeartbeat(interviewId, userId);
    return { ok: true };
  }

  async cancelInterview(interviewId: string, userId: string): Promise<true> {
    const interview = await this.getInterviewById(interviewId, userId);

    if (
      interview.status === AiInterviewStatus.COMPLETED ||
      interview.status === AiInterviewStatus.CANCELLED
    ) {
      return true;
    }

    if (interview.status === AiInterviewStatus.QUEUED) {
      await this.capacity.removeFromQueue(interviewId);
    } else {
      await this.capacity.releaseSlot(interviewId, userId);
      await this.promotion.promoteNextFromQueue();
    }

    await this.context.deleteContext(interviewId);
    await this.promotion.clearReady(interviewId);

    interview.status = AiInterviewStatus.CANCELLED;
    interview.ended_at = new Date();
    await this.aiInterviewRepository.save(interview);

    return true;
  }

  async editAiInterview(
    interviewId: string,
    dto: PutAiInterviewDto,
    userId: string,
  ) {
    let alreadyExists = await this.getInterviewById(interviewId, userId);

    if (
      dto.status &&
      alreadyExists.status !== AiInterviewStatus.COMPLETED &&
      dto.status === AiInterviewStatus.COMPLETED
    ) {
      alreadyExists.ended_at = new Date();
    }

    Object.assign(alreadyExists, {
      ...dto,
    });

    try {
      await this.aiInterviewRepository.save(alreadyExists);
    } catch (error) {
      this.logger.error(
        `Failed to edit AI interview for user ${userId} and id ${interviewId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while editing AI interview.",
      );
    }

    if (
      dto.status === AiInterviewStatus.COMPLETED ||
      dto.status === AiInterviewStatus.CANCELLED
    ) {
      await this.finalizeSimulation(interviewId, userId);
    } else if (dto.status === AiInterviewStatus.IN_PROGRESS) {
      await this.capacity.touchHeartbeat(interviewId, userId);
    }

    return true;
  }

  private async finalizeSimulation(
    interviewId: string,
    userId: string,
  ): Promise<void> {
    await this.capacity.releaseSlot(interviewId, userId);
    await this.context.deleteContext(interviewId);
    await this.promotion.clearReady(interviewId);
    await this.promotion.promoteNextFromQueue();
  }

  async getUserInterviews(query: GetInterviewsQueryDto, userId: string) {
    const order: FindOptionsOrder<any> = {};
    order[query.sort ?? "created_at"] = query.order ?? "DESC";

    if (!query.page && !query.limit) {
      try {
        const items = await this.aiInterviewRepository.find({
          where: { user_id: userId },
          order,
        });

        return {
          data: items,
          meta: { total: items.length },
        };
      } catch (error) {
        this.logger.error(
          `Failed to retrieve AI interviews for user ${userId}: ${(error as Error).message}`,
          (error as Error).stack,
        );
        throw new InternalServerErrorException(
          "Internal server error while retrieving AI interviews.",
        );
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    try {
      const [items, total] = await this.aiInterviewRepository.findAndCount({
        where: { user_id: userId },
        order,
        take: limit,
        skip,
      });

      return {
        data: items,
        meta: { total, page, limit },
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve AI interviews for user ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while retrieving AI interviews.",
      );
    }
  }

  async getVerbalAnalysis(interviewId: string, userId: string) {
    await this.getInterviewById(interviewId, userId);
    const record = await this.verbalAnalysis.getForInterview(
      interviewId,
      userId,
    );
    if (!record) {
      throw new NotFoundException("Verbal analysis not found for this interview.");
    }
    return record;
  }

  async addTranscripts(
    interviewId: string,
    dto: CreateAiTranscriptsDto,
    userId: string,
  ) {
    await this.getInterviewById(interviewId, userId);

    const records = dto.transcripts.map((t) =>
      this.aiTranscriptRepository.create({
        interview_id: interviewId,
        content: t.content,
        who_stated: t.who_stated,
      }),
    );

    try {
      const saved = await this.aiTranscriptRepository.save(records);
      return { inserted: saved.length, data: saved };
    } catch (error) {
      this.logger.error(
        `Failed to save transcripts for interview ${interviewId} (user ${userId}): ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while saving transcripts.",
      );
    }
  }

  async getInterviewById(
    interviewId: string,
    userId: string,
    getTranscripts: boolean = false,
  ) {
    try {
      const interview = await this.aiInterviewRepository.findOne({
        where: { user_id: userId, interview_id: interviewId },
      });

      if (!interview) {
        this.logger.warn(
          `AI interview with id ${interviewId} not found for user ${userId}.`,
        );
        throw new NotFoundException("AI interview not found.");
      }

      const transcripts = getTranscripts
        ? await this.aiTranscriptRepository.find({
            where: { interview_id: interviewId },
            order: { inserted_at: "ASC" },
          })
        : [];
      return { ...interview, transcripts };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(
        `Failed to check existing interview for user ${userId} and id ${interviewId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while getting the interview.",
      );
    }
  }
}

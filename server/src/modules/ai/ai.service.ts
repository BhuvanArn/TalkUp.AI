import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsOrder, In, Repository } from "typeorm";

import Groq from "groq-sdk";

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
import { ChatDto, ChatSurface, ChatContextDto } from "./dto/chat.dto";
import { ChatResponseDto } from "./dto/chatResponse.dto";
import {
  formatRoadmapContext,
  formatSimulationContext,
  formatAgendaContext,
  formatNotesContext,
  wrapContextForPrompt,
} from "./chat-context";

import { SimulationCapacityService } from "../simulation/simulation-capacity.service";
import { SimulationContextService } from "../simulation/simulation-context.service";
import { SimulationPromotionService } from "../simulation/simulation-promotion.service";
import { SimulationVerbalAnalysisService } from "../simulation/simulation-verbal-analysis.service";
import { loadSimulationConfig } from "../simulation/simulation.config";
import { ApplicationsService } from "../applications/applications.service";
import { buildSimulationContextFromApplication } from "../simulation/simulation-application-context";
import { AgendaService } from "../agenda/agenda.service";
import { NotesService } from "../notes/notes.service";

const CHATBOT_SYSTEM_PROMPT =
  "You are TalkUp AI, a friendly interview-preparation coach embedded in the " +
  "TalkUp app. Help users prepare for job interviews: explain frameworks (STAR, " +
  "RICE, MoSCoW), suggest answers, review their reasoning, and give concise, " +
  "actionable advice. Keep replies short (a few sentences), encouraging, and " +
  "focused on interview preparation. If asked something unrelated, gently steer " +
  "back to interview prep.";

const CHATBOT_MODEL = "llama-3.3-70b-versatile";

@Injectable()
export class AiService {
  private readonly logger: Logger;

  // Lazily built so a missing GROQ_API_KEY does not crash app bootstrap — the
  // groq-sdk constructor throws on an empty key. Only the chat route needs it and
  // surfaces the failure as a 500 instead of taking the whole server down.
  private _groq?: Groq;
  private get groq(): Groq {
    if (!this._groq) {
      this._groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return this._groq;
  }

  constructor(
    @InjectRepository(ai_interview)
    private aiInterviewRepository: Repository<ai_interview>,
    @InjectRepository(ai_transcript)
    private aiTranscriptRepository: Repository<ai_transcript>,
    private readonly capacity: SimulationCapacityService,
    private readonly context: SimulationContextService,
    private readonly promotion: SimulationPromotionService,
    private readonly verbalAnalysis: SimulationVerbalAnalysisService,
    private readonly applicationsService: ApplicationsService,
    private readonly agendaService: AgendaService,
    private readonly notesService: NotesService,
  ) {
    this.logger = new Logger(AiService.name);
  }

  async getCapacity() {
    return this.capacity.getSnapshot();
  }

  async chat(dto: ChatDto, userId: string): Promise<ChatResponseDto> {
    // Resolve the current page's data from the caller's OWNED ids and inject it
    // as grounding context. Never trust a client-supplied context blob (#154).
    const contextBlock = dto.context
      ? await this.resolveChatContext(dto.context, userId)
      : null;

    const systemPrompt =
      CHATBOT_SYSTEM_PROMPT + wrapContextForPrompt(contextBlock);

    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...(dto.history ?? []).map((turn) => ({
        role: turn.role,
        content: turn.content,
      })),
      { role: "user" as const, content: dto.message },
    ];

    try {
      const completion = await this.groq.chat.completions.create({
        model: CHATBOT_MODEL,
        messages,
        temperature: 0.6,
        max_tokens: 512,
      });

      const reply = completion.choices[0]?.message?.content?.trim();

      if (!reply) {
        throw new Error("Empty completion returned by the LLM provider.");
      }

      return { reply };
    } catch (error) {
      this.logger.error(
        `Chatbot completion failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        "The assistant is unavailable right now. Please try again.",
      );
    }
  }

  /**
   * Resolve a compact grounding block for the current page from the caller's
   * OWNED ids. Each branch loads via an owner-guarded service (throws on a
   * foreign/missing id), so a client can only ground on its own data. A
   * resolution failure degrades to no context rather than failing the whole
   * chat — the assistant just answers without page grounding.
   */
  private async resolveChatContext(
    context: ChatContextDto,
    userId: string,
  ): Promise<string | null> {
    try {
      switch (context.surface) {
        case ChatSurface.ROADMAP: {
          if (!context.applicationId) return null;
          const app = await this.applicationsService.ensureCvSnapshot(
            userId,
            context.applicationId,
          );
          const roadmap = await this.applicationsService.getRoadmap(
            userId,
            context.applicationId,
          );
          return formatRoadmapContext(app, roadmap);
        }

        case ChatSurface.CV: {
          if (!context.applicationId) return null;
          // Same owned application data the roadmap grounds on, minus the path —
          // useful before a roadmap exists (the CV-analysis surface).
          const app = await this.applicationsService.ensureCvSnapshot(
            userId,
            context.applicationId,
          );
          return buildSimulationContextFromApplication(app) || null;
        }

        case ChatSurface.SIMULATION: {
          const interviewId =
            context.interviewId ??
            (context.applicationId
              ? await this.latestInterviewIdForApplication(
                  userId,
                  context.applicationId,
                )
              : null);
          if (!interviewId) return null;

          const interview = await this.getInterviewById(
            interviewId,
            userId,
            true,
          );
          const analysis = await this.verbalAnalysis
            .getForInterview(interviewId, userId)
            .catch(() => null);
          const app = context.applicationId
            ? await this.applicationsService
                .ensureCvSnapshot(userId, context.applicationId)
                .catch(() => null)
            : null;
          return formatSimulationContext(
            app,
            interview,
            interview.transcripts,
            analysis?.overall_score ?? null,
          );
        }

        case ChatSurface.AGENDA: {
          // Upcoming events over the next 30 days.
          const from = new Date();
          const to = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
          const events = await this.agendaService.listForRange(
            userId,
            from,
            to,
          );
          return formatAgendaContext(events);
        }

        case ChatSurface.NOTES: {
          const notes = context.applicationId
            ? await this.notesService.findAll(userId, {
                applicationId: context.applicationId,
              })
            : await this.notesService.findAll(userId, {});
          return formatNotesContext(
            notes,
            context.applicationId ? "application" : "all",
          );
        }

        default:
          return null;
      }
    } catch (error) {
      this.logger.warn(
        `Chat context resolution failed for surface ${context.surface} (user ${userId}): ${(error as Error).message}`,
      );
      return null;
    }
  }

  /** Most recent interview the user ran for an application, or null. */
  private async latestInterviewIdForApplication(
    userId: string,
    applicationId: string,
  ): Promise<string | null> {
    const interview = await this.aiInterviewRepository.findOne({
      where: { user_id: userId, application_id: applicationId },
      order: { created_at: "DESC" },
    });
    return interview?.interview_id ?? null;
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

      const resolved = await this.resolveInterviewContext(dto, userId);

      const newInterview = this.aiInterviewRepository.create({
        user_id: userId,
        type: dto.type,
        language: dto.language,
        job_context: resolved.jobContext,
        application_id: resolved.applicationId,
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
            resolved.sessionDto,
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
        error instanceof InternalServerErrorException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
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
      throw new NotFoundException(
        "Verbal analysis not found for this interview.",
      );
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

  /**
   * Resolves simulation context server-side from an owned application when
   * applicationId is provided. Client-supplied jobContext is ignored in that case.
   */
  private async resolveInterviewContext(
    dto: CreateAiInterviewDto,
    userId: string,
  ): Promise<{
    jobContext: string | null;
    applicationId: string | null;
    sessionDto: CreateAiInterviewDto;
  }> {
    if (dto.applicationId) {
      const application = await this.applicationsService.ensureCvSnapshot(
        userId,
        dto.applicationId,
      );
      const jobContext = buildSimulationContextFromApplication(application);

      if (!jobContext) {
        this.logger.warn(
          `Application ${dto.applicationId} has no CV/offer context for user ${userId}`,
        );
      }

      return {
        jobContext: jobContext || null,
        applicationId: dto.applicationId,
        sessionDto: {
          ...dto,
          jobContext: jobContext || undefined,
        },
      };
    }

    const legacyContext = dto.jobContext?.trim() || null;
    return {
      jobContext: legacyContext,
      applicationId: null,
      sessionDto: {
        ...dto,
        jobContext: legacyContext ?? undefined,
      },
    };
  }
}

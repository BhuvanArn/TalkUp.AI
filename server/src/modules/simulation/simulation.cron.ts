import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { ai_interview } from "@entities/aiInterview.entity";
import { AiInterviewStatus } from "@common/enums/AiInterviewStatus";

import {
  isSimulationCronEnabled,
  loadSimulationConfig,
} from "./simulation.config";
import { SimulationCapacityService } from "./simulation-capacity.service";
import { SimulationContextService } from "./simulation-context.service";
import { SimulationPromotionService } from "./simulation-promotion.service";

@Injectable()
export class SimulationCronService {
  private readonly logger = new Logger(SimulationCronService.name);

  constructor(
    private readonly capacity: SimulationCapacityService,
    private readonly context: SimulationContextService,
    private readonly promotion: SimulationPromotionService,
    @InjectRepository(ai_interview)
    private readonly interviewRepo: Repository<ai_interview>,
  ) {}

  /**
   * Slots time out after `SIM_SLOT_TTL_SEC` (15 min by default), so a 5-minute
   * sweep is precise enough and keeps idle instances quiet.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireStaleSlots(): Promise<void> {
    if (!isSimulationCronEnabled()) return;

    const { slotTtlSec } = loadSimulationConfig();
    const now = Math.floor(Date.now() / 1000);
    const activeIds = await this.capacity.listActiveInterviewIds();

    for (const interviewId of activeIds) {
      try {
        await this.expireIfStale(interviewId, slotTtlSec, now);
      } catch (error) {
        this.logger.error(
          `Failed to expire simulation slot for interview ${interviewId}`,
          (error as Error).stack,
        );
      }
    }
  }

  private async expireIfStale(
    interviewId: string,
    slotTtlSec: number,
    now: number,
  ): Promise<void> {
    const meta = await this.capacity.getActiveMeta(interviewId);

    // A heartbeat sets the slot hash TTL to `slotTtlSec`, so a slot abandoned
    // after its first heartbeat loses its hash before it can look stale here.
    // An id still in the active set without its hash is an orphan: release it.
    if (meta && now - meta.lastHeartbeat <= slotTtlSec) return;

    // DB first: if the Redis release fails, the id stays in the active set and
    // the next sweep retries. Only interviews still running are expired, so a
    // simulation that ended normally since `listActiveInterviewIds` keeps its status.
    await this.interviewRepo.update(
      {
        interview_id: interviewId,
        status: In([AiInterviewStatus.ASKED, AiInterviewStatus.IN_PROGRESS]),
      },
      { status: AiInterviewStatus.EXPIRED, ended_at: new Date() },
    );

    const released = await this.capacity.releaseSlot(
      interviewId,
      meta?.userId ?? "",
    );
    // Already released by a normal end/cancel since the active set was listed.
    if (!released) return;

    this.logger.warn(
      meta
        ? `Expired stale simulation slot for interview ${interviewId}`
        : `Released orphaned simulation slot for interview ${interviewId}`,
    );

    await this.context.deleteContext(interviewId);
    await this.promotion.promoteNextFromQueue();
  }
}

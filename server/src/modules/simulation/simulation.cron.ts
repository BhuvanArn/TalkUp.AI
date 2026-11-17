import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

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
      const meta = await this.capacity.getActiveMeta(interviewId);

      // A heartbeat sets the slot hash TTL to `slotTtlSec`, so a slot abandoned
      // after its first heartbeat loses its hash before it can look stale here.
      // An id still in the active set without its hash is an orphan: release it.
      if (meta && now - meta.lastHeartbeat <= slotTtlSec) continue;

      this.logger.warn(
        meta
          ? `Expiring stale simulation slot for interview ${interviewId}`
          : `Releasing orphaned simulation slot for interview ${interviewId}`,
      );

      await this.capacity.releaseSlot(interviewId, meta?.userId ?? "");
      await this.context.deleteContext(interviewId);

      await this.interviewRepo.update(
        { interview_id: interviewId },
        { status: AiInterviewStatus.EXPIRED },
      );

      await this.promotion.promoteNextFromQueue();
    }
  }
}

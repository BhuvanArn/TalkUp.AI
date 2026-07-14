import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";

import { RedisModule } from "@common/redis/redis.module";
import { ai_interview } from "@entities/aiInterview.entity";
import { ai_verbal_analysis } from "@entities/aiVerbalAnalysis.entity";

import { SimulationCapacityService } from "./simulation-capacity.service";
import { SimulationContextService } from "./simulation-context.service";
import { SimulationWsTokenService } from "./simulation-ws-token.service";
import { SimulationPromotionService } from "./simulation-promotion.service";
import { SimulationVerbalAnalysisService } from "./simulation-verbal-analysis.service";
import { SimulationCronService } from "./simulation.cron";
import { SimulationInternalController } from "./simulation-internal.controller";
import { InternalApiKeyGuard } from "./guards/internal-api-key.guard";

@Module({
  imports: [
    RedisModule,
    HttpModule.register({
      timeout: parseInt(process.env.SIM_AI_INIT_TIMEOUT_MS ?? "30000", 10),
    }),
    TypeOrmModule.forFeature([ai_interview, ai_verbal_analysis]),
  ],
  controllers: [SimulationInternalController],
  providers: [
    SimulationCapacityService,
    SimulationContextService,
    SimulationWsTokenService,
    SimulationPromotionService,
    SimulationCronService,
    SimulationVerbalAnalysisService,
    InternalApiKeyGuard,
  ],
  exports: [
    SimulationCapacityService,
    SimulationContextService,
    SimulationWsTokenService,
    SimulationPromotionService,
    SimulationCronService,
    SimulationVerbalAnalysisService,
  ],
})
export class SimulationModule {}

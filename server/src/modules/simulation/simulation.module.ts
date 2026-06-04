import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";

import { RedisModule } from "@common/redis/redis.module";
import { ai_interview } from "@entities/aiInterview.entity";

import { SimulationCapacityService } from "./simulation-capacity.service";
import { SimulationContextService } from "./simulation-context.service";
import { SimulationWsTokenService } from "./simulation-ws-token.service";
import { SimulationPromotionService } from "./simulation-promotion.service";
import { SimulationCronService } from "./simulation.cron";
import { SimulationInternalController } from "./simulation-internal.controller";
import { InternalApiKeyGuard } from "./guards/internal-api-key.guard";

@Module({
  imports: [
    RedisModule,
    HttpModule.register({ timeout: 5000 }),
    TypeOrmModule.forFeature([ai_interview]),
  ],
  controllers: [SimulationInternalController],
  providers: [
    SimulationCapacityService,
    SimulationContextService,
    SimulationWsTokenService,
    SimulationPromotionService,
    SimulationCronService,
    InternalApiKeyGuard,
  ],
  exports: [
    SimulationCapacityService,
    SimulationContextService,
    SimulationWsTokenService,
    SimulationPromotionService,
    SimulationCronService,
  ],
})
export class SimulationModule {}

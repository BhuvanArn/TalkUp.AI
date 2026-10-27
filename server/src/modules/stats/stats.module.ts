import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { user_email } from "@entities/user.entity";

import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";

@Module({
  imports: [TypeOrmModule.forFeature([user_email])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}

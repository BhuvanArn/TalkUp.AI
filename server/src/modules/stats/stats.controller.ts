import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";

import { StatsService } from "./stats.service";
import { PublicStatsDto } from "./dto/publicStats.dto";

@ApiTags("stats")
@Controller("stats")
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @ApiOperation({
    summary:
      "Public, unauthenticated platform stats for the landing page (verified account count, cached 60s).",
  })
  @ApiResponse({
    status: 200,
    description: "Aggregate stats.",
    type: PublicStatsDto,
  })
  @ApiResponse({ status: 429, description: "Too many requests." })
  // No auth guard: public route. The app has no global ThrottlerGuard, so it
  // is attached here; unauthenticated callers are bucketed per IP.
  @UseGuards(ThrottlerGuard)
  // Generous limit: the response is cached 60 s server-side, and a whole school
  // can share one IP. The throttle only stops a single client hammering it.
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Get("public")
  getPublicStats(): Promise<PublicStatsDto> {
    return this.service.getPublicStats();
  }
}

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { user_email } from "@entities/user.entity";

import { PublicStatsDto } from "./dto/publicStats.dto";

export const PUBLIC_STATS_CACHE_TTL_MS = 60_000;

@Injectable()
export class StatsService {
  private cache: { value: PublicStatsDto; expiresAt: number } | null = null;
  private inFlight: Promise<PublicStatsDto> | null = null;

  constructor(
    @InjectRepository(user_email)
    private readonly userEmailRepository: Repository<user_email>,
  ) {}

  /**
   * Public landing-page stats. Counts only accounts whose email is verified
   * (`user_email.is_verified`). Cached in memory for 60s so the public,
   * unauthenticated route cannot be used to hammer the database.
   */
  async getPublicStats(): Promise<PublicStatsDto> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.value;
    }
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.userEmailRepository
      .count({ where: { is_verified: true } })
      .then((totalAccounts) => {
        const value: PublicStatsDto = { totalAccounts };
        this.cache = {
          value,
          expiresAt: Date.now() + PUBLIC_STATS_CACHE_TTL_MS,
        };
        return value;
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }
}

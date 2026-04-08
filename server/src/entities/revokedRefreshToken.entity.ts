import { Entity, PrimaryColumn, Column, Index } from "typeorm";

/**
 * Postgres-only RT revocation store (used when REDIS_URL is unset).
 * `jti` PK gives atomic INSERT for consumeRefreshJti (duplicate = already consumed).
 */
@Entity()
export class RevokedRefreshToken {
  @PrimaryColumn()
  jti!: string;

  @Index()
  @Column({ type: "timestamp with time zone" })
  expires_at!: Date;
}

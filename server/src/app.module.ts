import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";

import { throttlerTracker } from "@common/throttler/throttler-tracker";
import pgConfig from "@config/postgres.config";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { LinkedInModule } from "./modules/linkedin/linkedin.module";
import { AiModule } from "./modules/ai/ai.module";
import { MailModule } from "./modules/mail/mail.module";
import { ApplicationsModule } from "./modules/applications/applications.module";

import { LoggerMiddleware } from "@common/middleware/logger";
import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { HealthController } from "./health.controller";
import { AgendaModule } from "./modules/agenda/agenda.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { NotesModule } from "./modules/notes/notes.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [pgConfig],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
        // Per-user for authenticated routes, per-IP for the pre-auth surface.
        // See throttler-tracker.ts for the rationale and guard-ordering note.
        getTracker: throttlerTracker,
      },
    ]),
    AuthModule,
    MailModule,
    UsersModule,
    LinkedInModule,
    AgendaModule,
    NotesModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const config = pgConfig();
        return {
          ...config,
          extra: {
            ...config.extra,
            dateStrings: ["timestamp with time zone"],
            timezone: "UTC",
          },
        };
      },
    }),
    AiModule,
    OrganizationModule,
    ApplicationsModule,
    // Global JwtService: default expiry matches access tokens; AuthService still passes
    // explicit expiresIn + jwtid per token and REFRESH_SECRET for refresh JWTs.
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as any,
      },
    }),
  ],
  controllers: [HealthController],
  providers: [PostValidationPipe],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*path");
  }
}

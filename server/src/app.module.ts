import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";

import pgConfig from "@config/postgres.config";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { LinkedInModule } from "./modules/linkedin/linkedin.module";
import { AiModule } from "./modules/ai/ai.module";
import { MailModule } from "./modules/mail/mail.module";

import { LoggerMiddleware } from "@common/middleware/logger";
import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { HealthController } from "./health.controller";
import { AgendaModule } from "./modules/agenda/agenda.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [pgConfig],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    AuthModule,
    MailModule,
    UsersModule,
    LinkedInModule,
    AgendaModule,
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
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || "2d") as any,
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

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { application } from "@entities/application.entity";
import { user } from "@entities/user.entity";
import { user_cv } from "@entities/userCV.entity";
import { ApplicationsController } from "./applications.controller";
import { ApplicationsService } from "./applications.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([application, user, user_cv]), AuthModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, AccessTokenGuard],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}

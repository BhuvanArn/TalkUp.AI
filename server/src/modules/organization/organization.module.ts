import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";

import * as dotenv from "dotenv";
dotenv.config();

import { Organization } from "@entities/organization.entity";
import { user, user_email } from "@entities/user.entity";
import { organization_invite } from "@entities/organizationInvite.entity";
import { ai_interview } from "@entities/aiInterview.entity";
import { AuthModule } from "../auth/auth.module";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { OrganizationProvisioningGuard } from "@common/guards/organizationProvisioning.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      user,
      user_email,
      organization_invite,
      ai_interview,
    ]),
    AuthModule,
  ],
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    AccessTokenGuard,
    OrganizationProvisioningGuard,
  ],
  exports: [OrganizationService],
})
export class OrganizationModule {}

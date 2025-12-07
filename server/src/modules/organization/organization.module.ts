import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";

import * as dotenv from "dotenv";
dotenv.config();

import { Organization } from "@entities/organization.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class AuthModule {}

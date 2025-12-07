import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";

import * as dotenv from "dotenv";
dotenv.config();

import { Organization } from "@entities/organization.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Organization]), AuthModule],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}

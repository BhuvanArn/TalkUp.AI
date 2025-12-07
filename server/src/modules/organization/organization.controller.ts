import {
    Body,
    Controller,
    Post,
    Res,
    Get,
    Patch,
    UseGuards,
    HttpCode,
} from "@nestjs/common";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { UsePipes } from "@nestjs/common/decorators/core/use-pipes.decorator";
import { Response, CookieOptions } from "express";

import {
    ApiBadRequestResponse,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiUnprocessableEntityResponse,
    ApiTags,
    ApiOkResponse,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { CreateOrganizationDto } from "./dto/createOrganization";

import { PostValidationPipe } from "@common/pipes/PostValidationPipe";

import { OrganizationService } from "./organization.service";

const COOKIE_NAME = "accessToken";
const DEFAULT_COOKIE_MAX_AGE = 48 * 60 * 60 * 1000;
const COOKIE_MAX_AGE = process.env.COOKIE_MAX_AGE
  ? parseInt(process.env.COOKIE_MAX_AGE, 10)
  : DEFAULT_COOKIE_MAX_AGE;

const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  domain:
    process.env.NODE_ENV === "production"
      ? process.env.COOKIE_DOMAIN
      : undefined,
};

@ApiTags("Organization")
@Controller("Organization")
export class OrganizationController {
    constructor(private readonly OrganizationService: OrganizationService) {}

    @ApiCreatedResponse({
      description: "The organization has been successfully created.",
      type: CreateOrganizationDto,
    })
    @ApiBadRequestResponse({
      description: "Badly formatted parameter.",
    })
    @ApiConflictResponse({
      description: "organization already exists.",
    })
    @ApiUnprocessableEntityResponse({
      description: "Missing parameter in request.",
    })
    @UsePipes(new PostValidationPipe())
    @Post("register")
    async register(
      @Body() CreateOrganizationDto: CreateOrganizationDto,
      @Res({ passthrough: true }) response: Response,
    ) {
      const result = await this.OrganizationService.register(CreateOrganizationDto);

      response.cookie(COOKIE_NAME, result.accessToken, {
        ...BASE_COOKIE_OPTIONS,
        maxAge: COOKIE_MAX_AGE,
      });

      return { message: "Registration successful" };
    }

}

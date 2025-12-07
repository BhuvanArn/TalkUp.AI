import {
    Body,
    Controller,
    Post,
    Delete,
    BadRequestException
} from "@nestjs/common";
import { UsePipes } from "@nestjs/common/decorators/core/use-pipes.decorator";

import {
    ApiBadRequestResponse,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiUnprocessableEntityResponse,
    ApiTags,
} from "@nestjs/swagger";

import { CreateOrganizationDto } from "./dto/createOrganization";

import { PostValidationPipe } from "@common/pipes/PostValidationPipe";

import { OrganizationService } from "./organization.service";

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
    ) {
      return await this.OrganizationService.register(CreateOrganizationDto);
    }

    
    @Delete("deleteOrganization")
    async deleteOrganization(
        @Body('name') OrganizationName: string
    ) {
        if (!OrganizationName) {
            throw new BadRequestException('Organization name is required');
        }
        return await this.OrganizationService.delete(OrganizationName);
    }



}

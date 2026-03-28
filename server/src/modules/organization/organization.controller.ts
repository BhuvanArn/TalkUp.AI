import {
  Body,
  Controller,
  Post,
  Delete,
  BadRequestException,
  Patch,
  Get,
} from "@nestjs/common";
import { UsePipes } from "@nestjs/common/decorators/core/use-pipes.decorator";

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
  ApiTags,
} from "@nestjs/swagger";

import { CreateOrganizationDto } from "./dto/createOrganization.dto";

import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { ParamId } from "@common/decorators/paramId.decorator";

import { OrganizationService } from "./organization.service";

@ApiTags("Organization")
@Controller("organization")
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
  @Post()
  async register(@Body() CreateOrganizationDto: CreateOrganizationDto) {
    return await this.OrganizationService.registerOrganization(
      CreateOrganizationDto,
    );
  }

  @ApiOkResponse({
    description: "The organization has been successfully deleted.",
  })
  @ApiBadRequestResponse({
    description: "Organization ID is required",
  })
  @Delete(":id")
  async deleteOrganization(@ParamId() id: string) {
    return await this.OrganizationService.deleteOrganization(id);
  }

  @ApiOkResponse({
    description: "The organization has been successfully updated.",
  })
  @ApiBadRequestResponse({
    description: "Invalid input data.",
  })
  @ApiUnprocessableEntityResponse({
    description: "The organization could not be updated.",
  })
  @Patch(":id")
  async updateOrganization(
    @ParamId() id: string,
    @Body()
    updateData: {
      newName?: string;
      newProfilePicture?: string;
    },
  ) {
    const { newName, newProfilePicture } = updateData;

    if (!newName && !newProfilePicture) {
      throw new BadRequestException(
        "At least one field to update are required.",
      );
    }

    return await this.OrganizationService.updateOrganization(id, {
      newName,
      newProfilePicture,
    });
  }

  @ApiOkResponse({
    description: "The organization has been successfully found.",
  })
  @ApiBadRequestResponse({
    description: "Invalid input data.",
  })
  @ApiUnprocessableEntityResponse({
    description: "The organization could not be found.",
  })
  @Get(":id")
  async findOne(@ParamId() id: string) {
    return await this.OrganizationService.findOne(id);
  }
}

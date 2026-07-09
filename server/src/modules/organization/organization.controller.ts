import {
  Body,
  Controller,
  Post,
  Delete,
  Patch,
  Get,
  UseGuards,
} from "@nestjs/common";
import { UsePipes } from "@nestjs/common/decorators/core/use-pipes.decorator";

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiSecurity,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";

import { CreateOrganizationDto } from "./dto/createOrganization.dto";
import { CreateOrganizationMemberDto } from "./dto/createOrganizationMember.dto";
import { CreateOrganizationInviteDto } from "./dto/createOrganizationInvite.dto";
import { UpdateMemberRoleDto } from "./dto/updateMemberRole.dto";

import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { ParamId } from "@common/decorators/paramId.decorator";
import { CurrentUser } from "@common/decorators/currentUser.decorator";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { OrganizationProvisioningGuard } from "@common/guards/organizationProvisioning.guard";

import { OrganizationService } from "./organization.service";

import { user } from "@entities/user.entity";
import { UpdateOrganizationDto } from "./dto/updateOrganization.dto";

@ApiTags("Organization")
@Controller("organization")
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

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
  @ApiUnauthorizedResponse({
    description: "Invalid or missing organization provisioning secret.",
  })
  @ApiSecurity("org-provisioning")
  @UseGuards(OrganizationProvisioningGuard)
  @UsePipes(new PostValidationPipe())
  @Post()
  async register(@Body() createOrganizationDto: CreateOrganizationDto) {
    return await this.organizationService.registerOrganization(
      createOrganizationDto,
    );
  }

  @ApiOkResponse({
    description: "The organization has been successfully deleted.",
  })
  @ApiUnauthorizedResponse({ description: "Not authenticated." })
  @ApiForbiddenResponse({ description: "Not an organization administrator." })
  @UseGuards(AccessTokenGuard)
  @Delete(":id")
  async deleteOrganization(
    @ParamId() id: string,
    @CurrentUser() currentUser: user,
  ) {
    return await this.organizationService.deleteOrganization(id, currentUser);
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
  @ApiUnauthorizedResponse({ description: "Not authenticated." })
  @ApiForbiddenResponse({ description: "Not an organization administrator." })
  @UseGuards(AccessTokenGuard)
  @Patch(":id")
  async updateOrganization(
    @ParamId() id: string,
    @CurrentUser() currentUser: user,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return await this.organizationService.updateOrganization(
      id,
      currentUser,
      updateOrganizationDto,
    );
  }

  @ApiOkResponse({
    description: "The organization has been successfully found.",
  })
  @ApiNotFoundResponse({
    description:
      "The user has no organization (e.g. role `none` or unaffiliated account).",
  })
  @ApiUnauthorizedResponse({ description: "Not authenticated." })
  @ApiForbiddenResponse({ description: "Insufficient permissions." })
  @UseGuards(AccessTokenGuard)
  @Get()
  async getMyOrganization(@CurrentUser() currentUser: user) {
    return await this.organizationService.getMyOrganizationForUser(currentUser);
  }

  @ApiCreatedResponse({
    description: "A new member was created for the organization.",
  })
  @ApiBadRequestResponse({
    description: "Badly formatted parameter.",
  })
  @ApiUnauthorizedResponse({ description: "Not authenticated." })
  @ApiForbiddenResponse({ description: "Insufficient permissions." })
  @UseGuards(AccessTokenGuard)
  @UsePipes(new PostValidationPipe())
  @Post(":id/members")
  async createMember(
    @ParamId() id: string,
    @Body() body: CreateOrganizationMemberDto,
    @CurrentUser() currentUser: user,
  ) {
    return await this.organizationService.createOrganizationMember(
      id,
      body,
      currentUser,
    );
  }

  @ApiOkResponse({
    description: "The member was removed from the organization.",
  })
  @ApiNotFoundResponse({
    description: "Organization or target member not in this organization.",
  })
  @ApiUnauthorizedResponse({ description: "Not authenticated." })
  @ApiForbiddenResponse({ description: "Insufficient permissions." })
  @UseGuards(AccessTokenGuard)
  @Delete(":id/members/:memberUserId")
  async removeMember(
    @ParamId() id: string,
    @ParamId("memberUserId") memberUserId: string,
    @CurrentUser() currentUser: user,
  ) {
    return await this.organizationService.removeOrganizationMember(
      id,
      memberUserId,
      currentUser,
    );
  }

  @ApiOkResponse({ description: "Member role updated." })
  @ApiNotFoundResponse({
    description: "Target member not in this organization.",
  })
  @ApiUnauthorizedResponse({ description: "Not authenticated." })
  @ApiForbiddenResponse({ description: "Not an organization administrator." })
  @UseGuards(AccessTokenGuard)
  @UsePipes(new PostValidationPipe())
  @Patch(":id/members/:memberUserId/role")
  async changeMemberRole(
    @ParamId() id: string,
    @ParamId("memberUserId") memberUserId: string,
    @Body() body: UpdateMemberRoleDto,
    @CurrentUser() currentUser: user,
  ) {
    return await this.organizationService.changeMemberRole(
      id,
      memberUserId,
      body.role,
      currentUser,
    );
  }

  @ApiCreatedResponse({ description: "Invite code generated." })
  @ApiUnauthorizedResponse({ description: "Not authenticated." })
  @ApiForbiddenResponse({ description: "Insufficient permissions." })
  @UseGuards(AccessTokenGuard)
  @UsePipes(new PostValidationPipe())
  @Post(":id/invites")
  async createInvite(
    @ParamId() id: string,
    @Body() body: CreateOrganizationInviteDto,
    @CurrentUser() currentUser: user,
  ) {
    return await this.organizationService.createInvite(id, body, currentUser);
  }

  @ApiOkResponse({
    description: "Member detail with stats and recent interviews.",
  })
  @ApiNotFoundResponse({
    description: "Target member not in this organization.",
  })
  @ApiUnauthorizedResponse({ description: "Not authenticated." })
  @ApiForbiddenResponse({ description: "Insufficient permissions." })
  @UseGuards(AccessTokenGuard)
  @Get(":id/members/:memberUserId")
  async getMemberDetail(
    @ParamId() id: string,
    @ParamId("memberUserId") memberUserId: string,
    @CurrentUser() currentUser: user,
  ) {
    return await this.organizationService.getOrganizationMemberDetail(
      id,
      memberUserId,
      currentUser,
    );
  }

  @ApiOkResponse({ description: "Invites for the organization." })
  @ApiUnauthorizedResponse({ description: "Not authenticated." })
  @ApiForbiddenResponse({ description: "Insufficient permissions." })
  @UseGuards(AccessTokenGuard)
  @Get(":id/invites")
  async listInvites(@ParamId() id: string, @CurrentUser() currentUser: user) {
    return await this.organizationService.listInvites(id, currentUser);
  }

  @ApiOkResponse({ description: "Invite revoked." })
  @ApiNotFoundResponse({
    description: "Invite not found in this organization.",
  })
  @ApiUnauthorizedResponse({ description: "Not authenticated." })
  @ApiForbiddenResponse({ description: "Not an organization administrator." })
  @UseGuards(AccessTokenGuard)
  @Delete(":id/invites/:inviteId")
  async revokeInvite(
    @ParamId() id: string,
    @ParamId("inviteId") inviteId: string,
    @CurrentUser() currentUser: user,
  ) {
    return await this.organizationService.revokeInvite(
      id,
      inviteId,
      currentUser,
    );
  }
}

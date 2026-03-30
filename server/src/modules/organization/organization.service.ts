import { Repository } from "typeorm";

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Logger } from "@nestjs/common";

import { CreateOrganizationDto } from "./dto/createOrganization.dto";
import { CreateOrganizationMemberDto } from "./dto/createOrganizationMember.dto";
import { UpdateOrganizationDto } from "./dto/updateOrganization.dto";
import { CreateUserDto } from "../auth/dto/createUser.dto";

import { AuthService } from "../auth/auth.service";

import { Organization } from "@entities/organization.entity";
import { user } from "@entities/user.entity";

import { generateSecurePassword } from "@common/utils/generateSecurePassword";
import { OrganizationUserRole } from "@common/enums/organizationUserRole";
import { getUserOrganizationId } from "@common/utils/organizationUser.util";

export type OrganizationMemberRow = {
  username: string;
  user_role: string;
};

export type OrganizationDetailsDto = {
  organization_id: string;
  organization_name: string;
  profile_picture: string | null;
  created_at: Date;
  updated_at: Date;
  members?: OrganizationMemberRow[];
};

@Injectable()
export class OrganizationService {
  logger = new Logger(OrganizationService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    @InjectRepository(user)
    private userRepository: Repository<user>,

    private readonly authService: AuthService,
  ) {}

  /**
   * Registers a new organization with the provided credentials.
   *
   * This method performs the following steps:
   * 1. Checks if the email already exists in the system.
   * 2. Throws a `ConflictException` if the email is already registered.
   * 3. Creates a new organization with the given information.
   * 4. Save the new organization.
   * 5. Register a new user as the admin of the organization.
   *
   * @param CreateOrganizationDto
   * @returns An object containing the admin user credentials.
   * @throws {ConflictException} If an organization with this name already exists.
   */
  async registerOrganization(
    CreateOrganizationDto: CreateOrganizationDto,
  ): Promise<{
    message: string;
    adminUser: { username: string; email: string; password: string };
  }> {
    const nameExists = await this.organizationRepository.findOne({
      where: { organization_name: CreateOrganizationDto.OrganizationName },
    });

    if (nameExists) {
      throw new ConflictException(
        "An organization with this name already exists",
      );
    }

    const newOrganization = this.organizationRepository.create({
      organization_name: CreateOrganizationDto.OrganizationName,
    });

    const savedOrganization =
      await this.organizationRepository.save(newOrganization);

    const initialAdminPassword = generateSecurePassword();

    const createUserDto: CreateUserDto = {
      username: `${savedOrganization.organization_name}_admin`,
      email: `${CreateOrganizationDto.OrganizationEmail}`,
      password: initialAdminPassword,
      user_role: OrganizationUserRole.ADMIN,
      organization_id: savedOrganization.organization_id,
    };

    await this.authService.register(createUserDto, true, {
      organizationName: savedOrganization.organization_name,
    });

    return {
      message: "Creation successful",
      adminUser: {
        username: createUserDto.username,
        email: createUserDto.email,
        password: initialAdminPassword,
      },
    };
  }

  /**
   * Delete an organization with the provided id. Only org `admin` may delete.
   * Resets `user_role` to `none` for all users linked to this org before delete.
   * (DB `onDelete: SET NULL` only clears `organization_id`, not org roles.)
   */
  async deleteOrganization(id: string, currentUser: user): Promise<void> {
    const organization = await this.findOrganizationById(id);
    await this.assertAdminOfOrganization(id, currentUser);

    try {
      await this.organizationRepository.manager.transaction(
        async (manager) => {
          await manager
            .createQueryBuilder()
            .update(user)
            .set({ user_role: OrganizationUserRole.NONE })
            .where("organization_id = :orgId", { orgId: id })
            .execute();

          await manager.remove(organization);
        },
      );
    } catch (error) {
      this.logger.error(
        `Error removing organization ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while removing organization.",
      );
    }
  }

  /**
   * Update an organization. Only org `admin` may update.
   */
  async updateOrganization(
    id: string,
    currentUser: user,
    updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<void> {
    const organization = await this.findOrganizationById(id);
    await this.assertAdminOfOrganization(id, currentUser);

    if (updateOrganizationDto.OrganizationName) {
      organization.organization_name = updateOrganizationDto.OrganizationName;
    }
    if (updateOrganizationDto.OrganizationProfilePicture) {
      organization.profile_picture = updateOrganizationDto.OrganizationProfilePicture;
    }

    await this.organizationRepository.save(organization);
  }

  /**
   * Organization details for the org linked to the current user (via `GET /organization/me` only).
   */
  async getMyOrganizationForUser(
    currentUser: user,
  ): Promise<OrganizationDetailsDto> {
    const u = await this.loadUserWithOrg(currentUser.user_id);
    const orgId = getUserOrganizationId(u);

    if (!orgId) {
      throw new NotFoundException(
        "User is not affiliated with an organization",
      );
    }

    const organization = await this.findOrganizationById(orgId);

    const role = u.user_role;
    if (
      role !== OrganizationUserRole.ADMIN &&
      role !== OrganizationUserRole.EMPLOYEE &&
      role !== OrganizationUserRole.USER
    ) {
      throw new ForbiddenException("Insufficient permissions");
    }

    let members: OrganizationMemberRow[] | undefined;

    if (role === OrganizationUserRole.ADMIN) {
      members = await this.listOrgMembers(orgId, { scope: "all" });
    } else if (role === OrganizationUserRole.EMPLOYEE) {
      members = await this.listOrgMembers(orgId, {
        scope: "roles",
        roles: [OrganizationUserRole.USER],
      });
    }

    return {
      organization_id: orgId,
      organization_name: organization.organization_name,
      profile_picture: organization.profile_picture ?? null,
      created_at: organization.created_at,
      updated_at: organization.updated_at,
      ...(members !== undefined ? { members } : {}),
    };
  }

  async createOrganizationMember(
    organizationId: string,
    dto: CreateOrganizationMemberDto,
    caller: user,
  ): Promise<{
    message: string;
    username: string;
    email: string;
    password: string;
  }> {
    const organization = await this.findOrganizationById(organizationId);

    const u = await this.loadUserWithOrg(caller.user_id);
    const callerOrgId = getUserOrganizationId(u);

    if (callerOrgId !== organizationId) {
      throw new ForbiddenException("You are not a member of this organization");
    }

    const callerRole = u.user_role;

    if (
      callerRole !== OrganizationUserRole.ADMIN &&
      callerRole !== OrganizationUserRole.EMPLOYEE
    ) {
      throw new ForbiddenException("Insufficient permissions");
    }

    if (callerRole === OrganizationUserRole.EMPLOYEE) {
      if (dto.role !== OrganizationUserRole.USER) {
        throw new ForbiddenException(
          "Employees may only create users with the basic user role",
        );
      }
    }

    const password = dto.password ?? generateSecurePassword();

    await this.authService.register(
      {
        username: dto.username,
        email: dto.email,
        password,
        organization_id: organizationId,
        user_role: dto.role,
      },
      true,
      { organizationName: organization.organization_name },
    );

    return {
      message: "Member created",
      username: dto.username,
      email: dto.email,
      password,
    };
  }

  /**
   * Detaches a member from the organization (`user_role` → `none`, no org).
   * Admin may remove `employee` or `user`; employee may remove `user` only.
   * Org admins cannot be removed here; admins cannot remove themselves.
   */
  async removeOrganizationMember(
    organizationId: string,
    memberUserId: string,
    caller: user,
  ): Promise<{ message: string }> {
    await this.findOrganizationById(organizationId);

    const callerFull = await this.loadUserWithOrg(caller.user_id);
    const callerOrgId = getUserOrganizationId(callerFull);

    if (callerOrgId !== organizationId) {
      throw new ForbiddenException("You are not a member of this organization");
    }

    const callerRole = callerFull.user_role;

    if (
      callerRole !== OrganizationUserRole.ADMIN &&
      callerRole !== OrganizationUserRole.EMPLOYEE
    ) {
      throw new ForbiddenException("Insufficient permissions");
    }

    const member = await this.loadUserWithOrg(memberUserId);
    const memberOrgId = getUserOrganizationId(member);

    if (memberOrgId !== organizationId) {
      throw new NotFoundException(
        "This user is not a member of the organization",
      );
    }

    if (member.user_role === OrganizationUserRole.ADMIN) {
      throw new ForbiddenException(
        "Organization administrators cannot be removed through this endpoint",
      );
    }

    if (callerRole === OrganizationUserRole.EMPLOYEE &&
      member.user_role !== OrganizationUserRole.USER) {
      throw new ForbiddenException(
        "Employees may only remove users with the basic user role",
      );
    }

    if (
      callerFull.user_id === member.user_id &&
      callerRole === OrganizationUserRole.ADMIN
    ) {
      throw new ForbiddenException(
        "An administrator cannot remove themselves from the organization",
      );
    }

    member.organization_id = null;
    member.user_role = OrganizationUserRole.NONE;
    await this.userRepository.save(member);

    return { message: "Member removed from the organization" };
  }


  ///////////////////////
  /// PRIVATE METHODS ///
  ///////////////////////


  /**
   * Assert that the current user is an admin of the organization.
   *
   * @param organizationId - The id of the organization.
   * @param currentUser - The current user.
   * @returns void.
   * @throws {ForbiddenException} If the current user is not an admin of the organization.
   */
  private async assertAdminOfOrganization(
    organizationId: string,
    currentUser: user,
  ): Promise<void> {
    const u = await this.loadUserWithOrg(currentUser.user_id);
    const orgId = getUserOrganizationId(u);

    if (orgId !== organizationId) {
      throw new ForbiddenException("You are not a member of this organization");
    }

    if (u.user_role !== OrganizationUserRole.ADMIN) {
      throw new ForbiddenException(
        "Only organization administrators may perform this action",
      );
    }
  }

  private async loadUserWithOrg(userId: string): Promise<user> {
    const u = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ["organization_id"],
    });

    if (!u) {
      throw new UnauthorizedException("User not found");
    }

    return u;
  }

  private async listOrgMembers(
    orgId: string,
    filter:
      | { scope: "all" }
      | { scope: "roles"; roles: string[] },
  ): Promise<OrganizationMemberRow[]> {
    const qb = this.userRepository
      .createQueryBuilder("u")
      .select(["u.username", "u.user_role"])
      .where("u.organization_id = :orgId", { orgId });

    if (filter.scope === "roles") {
      qb.andWhere("u.user_role IN (:...roles)", { roles: filter.roles });
    }

    const rows = await qb.getMany();
    return rows.map((r) => ({
      username: r.username,
      user_role: r.user_role,
    }));
  }

  /**
   * Find an organization by its id (internal).
   */
  private async findOrganizationById(organization_id: string) {
    try {
      const organization = await this.organizationRepository.findOne({
        where: { organization_id },
      });

      if (!organization) throw new NotFoundException("Organization not found.");
      return organization;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Error retrieving organization ${organization_id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while retrieving organization.",
      );
    }
  }
}

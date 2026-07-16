import { QueryFailedError, Repository } from "typeorm";

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { Logger } from "@nestjs/common";

import { CreateOrganizationDto } from "./dto/createOrganization.dto";
import { CreateOrganizationMemberDto } from "./dto/createOrganizationMember.dto";
import { CreateOrganizationInviteDto } from "./dto/createOrganizationInvite.dto";
import { UpdateOrganizationDto } from "./dto/updateOrganization.dto";
import { CreateUserDto } from "../auth/dto/createUser.dto";
import { OrganizationInviteCreatedEvent } from "./events/organization-invite-created.event";

import { AuthService } from "../auth/auth.service";

import { Organization } from "@entities/organization.entity";
import { user, user_email } from "@entities/user.entity";
import { organization_invite } from "@entities/organizationInvite.entity";
import { ai_interview } from "@entities/aiInterview.entity";

import { buildAdminUsername } from "@common/utils/buildAdminUsername";
import { generateSecurePassword } from "@common/utils/generateSecurePassword";
import { OrganizationUserRole } from "@common/enums/organizationUserRole";
import { getUserOrganizationId } from "@common/utils/organizationUser.util";
import { OrganizationInviteStatus } from "@common/enums/OrganizationInviteStatus";
import { generateInviteCode } from "@common/utils/inviteCode";
import { AiInterviewStatus } from "@common/enums/AiInterviewStatus";

export type MemberStats = {
  interviewCount: number;
  completedCount: number;
  avgScore: number | null;
  lastActivityAt: Date | null;
};

export type OrganizationMemberRow = MemberStats & {
  user_id: string;
  username: string;
  user_role: string;
};

export const INVITE_EXPIRY_DAYS = 14;

export type OrganizationInviteRow = {
  invite_id: string;
  code: string;
  email: string | null;
  role: string;
  status: string;
  expires_at: Date;
  created_at: Date;
  accepted_at: Date | null;
};

export type OrganizationDetailsDto = {
  organization_id: string;
  organization_name: string;
  profile_picture: string | null;
  created_at: Date;
  updated_at: Date;
  members?: OrganizationMemberRow[];
};

export type OrganizationMemberDetailDto = {
  user_id: string;
  username: string;
  user_role: string;
  email: string | null;
  stats: MemberStats;
  recentInterviews: {
    interview_id: string;
    type: string;
    status: string;
    score: number | null;
    created_at: Date;
    ended_at: Date | null;
  }[];
};

@Injectable()
export class OrganizationService {
  logger = new Logger(OrganizationService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    @InjectRepository(user)
    private userRepository: Repository<user>,

    @InjectRepository(organization_invite)
    private inviteRepository: Repository<organization_invite>,

    @InjectRepository(ai_interview)
    private aiInterviewRepository: Repository<ai_interview>,

    @InjectRepository(user_email)
    private userEmailRepository: Repository<user_email>,

    private readonly authService: AuthService,

    private readonly eventEmitter: EventEmitter2,
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

    let savedOrganization: Organization;
    try {
      savedOrganization =
        await this.organizationRepository.save(newOrganization);
    } catch (error) {
      // Unique-constraint violation: a concurrent request won the race between
      // the pre-check above and this insert (Postgres error code 23505).
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === "23505"
      ) {
        throw new ConflictException(
          "An organization with this name already exists",
        );
      }
      throw error;
    }

    const initialAdminPassword = generateSecurePassword();

    const createUserDto: CreateUserDto = {
      username: buildAdminUsername(savedOrganization.organization_name),
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
      await this.organizationRepository.manager.transaction(async (manager) => {
        await manager
          .createQueryBuilder()
          .update(user)
          .set({ user_role: OrganizationUserRole.NONE })
          .where("organization_id = :orgId", { orgId: id })
          .execute();

        await manager.remove(organization);
      });
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
      organization.profile_picture =
        updateOrganizationDto.OrganizationProfilePicture;
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

    if (
      callerRole === OrganizationUserRole.EMPLOYEE &&
      member.user_role !== OrganizationUserRole.USER
    ) {
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

  /**
   * F13: admin switches a member between `user` and `employee`.
   * Admin targets are protected; DTO validation restricts the new role.
   */
  async changeMemberRole(
    organizationId: string,
    memberUserId: string,
    role: string,
    caller: user,
  ): Promise<{ message: string }> {
    await this.findOrganizationById(organizationId);
    await this.assertAdminOfOrganization(organizationId, caller);

    const member = await this.loadUserWithOrg(memberUserId);
    if (getUserOrganizationId(member) !== organizationId) {
      throw new NotFoundException(
        "This user is not a member of the organization",
      );
    }
    if (member.user_role === OrganizationUserRole.ADMIN) {
      throw new ForbiddenException(
        "Organization administrators cannot have their role changed here",
      );
    }

    member.user_role = role;
    await this.userRepository.save(member);

    return { message: "Member role updated" };
  }

  /**
   * F14: member detail — profile basics + full stats + recent interviews.
   * Admin sees any member; employee only `user`-role members.
   */
  async getOrganizationMemberDetail(
    organizationId: string,
    memberUserId: string,
    caller: user,
  ): Promise<OrganizationMemberDetailDto> {
    await this.findOrganizationById(organizationId);

    const callerFull = await this.loadUserWithOrg(caller.user_id);
    if (getUserOrganizationId(callerFull) !== organizationId) {
      throw new ForbiddenException("You are not a member of this organization");
    }

    if (memberUserId === caller.user_id) {
      return this.buildMemberDetail(callerFull);
    }

    const callerRole = callerFull.user_role;
    if (
      callerRole !== OrganizationUserRole.ADMIN &&
      callerRole !== OrganizationUserRole.EMPLOYEE
    ) {
      throw new ForbiddenException("Insufficient permissions");
    }

    const member = await this.loadUserWithOrg(memberUserId);
    if (getUserOrganizationId(member) !== organizationId) {
      throw new NotFoundException(
        "This user is not a member of the organization",
      );
    }
    if (
      callerRole === OrganizationUserRole.EMPLOYEE &&
      member.user_role !== OrganizationUserRole.USER
    ) {
      throw new ForbiddenException(
        "Employees may only view users with the basic user role",
      );
    }

    return this.buildMemberDetail(member);
  }

  /**
   * F14: shared tail for member detail — load email + stats + recent
   * interviews and assemble the DTO. Single source of truth for the shape.
   */
  private async buildMemberDetail(
    member: user,
  ): Promise<OrganizationMemberDetailDto> {
    const emailEntity = await this.userEmailRepository.findOne({
      where: { user_id: member.user_id },
    });

    const stats = (await this.getMemberStats([member.user_id])).get(
      member.user_id,
    ) ?? {
      interviewCount: 0,
      completedCount: 0,
      avgScore: null,
      lastActivityAt: null,
    };

    const interviews = await this.aiInterviewRepository
      .createQueryBuilder("i")
      .where("i.user_id = :userId", { userId: member.user_id })
      .orderBy("i.created_at", "DESC")
      .take(10)
      .getMany();

    return {
      user_id: member.user_id,
      username: member.username,
      user_role: member.user_role,
      email: emailEntity?.email ?? null,
      stats,
      recentInterviews: interviews.map((i) => ({
        interview_id: i.interview_id,
        type: i.type,
        status: i.status,
        score: i.score ?? null,
        created_at: i.created_at,
        ended_at: i.ended_at ?? null,
      })),
    };
  }

  /**
   * F13: generate a per-invite unique code. Admin may invite user or employee;
   * employee may invite only user. Emails the code when `email` is set.
   */
  async createInvite(
    organizationId: string,
    dto: CreateOrganizationInviteDto,
    caller: user,
  ): Promise<OrganizationInviteRow> {
    const organization = await this.findOrganizationById(organizationId);
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

    const role = dto.role ?? OrganizationUserRole.USER;
    if (
      callerRole === OrganizationUserRole.EMPLOYEE &&
      role !== OrganizationUserRole.USER
    ) {
      throw new ForbiddenException(
        "Employees may only invite users with the basic user role",
      );
    }

    const code = await this.generateUniqueInviteCode();
    const email = dto.email ? dto.email.toLowerCase() : null;

    const invite = await this.inviteRepository.save(
      this.inviteRepository.create({
        code,
        organization_id: organizationId,
        email,
        role,
        status: OrganizationInviteStatus.PENDING,
        expires_at: new Date(
          Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        ),
        created_by: callerFull.user_id,
        accepted_by: null,
        accepted_at: null,
      }),
    );

    if (email) {
      const event: OrganizationInviteCreatedEvent = {
        email,
        code,
        organizationName: organization.organization_name,
        role,
        expiresAt: invite.expires_at,
        registerUrl: this.buildRegisterUrl(code),
      };
      this.eventEmitter.emit("organization.invite_created", event);
    }

    return this.toInviteRow(invite);
  }

  /** F13: list invites. Visible to admin and employee (employees read-only via routes). */
  async listInvites(
    organizationId: string,
    caller: user,
  ): Promise<OrganizationInviteRow[]> {
    await this.findOrganizationById(organizationId);
    const callerFull = await this.loadUserWithOrg(caller.user_id);

    if (getUserOrganizationId(callerFull) !== organizationId) {
      throw new ForbiddenException("You are not a member of this organization");
    }
    if (
      callerFull.user_role !== OrganizationUserRole.ADMIN &&
      callerFull.user_role !== OrganizationUserRole.EMPLOYEE
    ) {
      throw new ForbiddenException("Insufficient permissions");
    }

    const invites = await this.inviteRepository.find({
      where: { organization_id: organizationId },
      order: { created_at: "DESC" },
    });

    // Only admins get the full plaintext code; employees see it masked so they
    // cannot read (and re-share) admin-created codes to escalate a signup.
    const redactCode = callerFull.user_role !== OrganizationUserRole.ADMIN;
    return invites.map((i) => this.toInviteRow(i, redactCode));
  }

  /** F13: revoke a pending invite. Admin only. */
  async revokeInvite(
    organizationId: string,
    inviteId: string,
    caller: user,
  ): Promise<{ message: string }> {
    await this.findOrganizationById(organizationId);
    await this.assertAdminOfOrganization(organizationId, caller);

    const invite = await this.inviteRepository.findOne({
      where: { invite_id: inviteId },
    });

    if (!invite || invite.organization_id !== organizationId) {
      throw new NotFoundException("Invite not found in this organization");
    }
    if (invite.status !== OrganizationInviteStatus.PENDING) {
      throw new ConflictException("Only pending invites can be revoked");
    }

    invite.status = OrganizationInviteStatus.REVOKED;
    await this.inviteRepository.save(invite);

    return { message: "Invite revoked" };
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
    filter: { scope: "all" } | { scope: "roles"; roles: string[] },
  ): Promise<OrganizationMemberRow[]> {
    const qb = this.userRepository
      .createQueryBuilder("u")
      .select(["u.user_id", "u.username", "u.user_role"])
      .where("u.organization_id = :orgId", { orgId });

    if (filter.scope === "roles") {
      qb.andWhere("u.user_role IN (:...roles)", { roles: filter.roles });
    }

    const rows = await qb.getMany();
    const stats = await this.getMemberStats(rows.map((r) => r.user_id));

    return rows.map((r) => ({
      user_id: r.user_id,
      username: r.username,
      user_role: r.user_role,
      ...(stats.get(r.user_id) ?? {
        interviewCount: 0,
        completedCount: 0,
        avgScore: null,
        lastActivityAt: null,
      }),
    }));
  }

  /**
   * F14: one grouped aggregate over ai_interview for the given users.
   * Lives in the org service by design (Approach A): single round-trip,
   * no cross-module service coupling.
   */
  private async getMemberStats(
    userIds: string[],
  ): Promise<Map<string, MemberStats>> {
    if (userIds.length === 0) return new Map();

    const raw: {
      user_id: string;
      interview_count: string | number;
      completed_count: string | number;
      avg_score: string | null;
      last_activity_at: Date | null;
    }[] = await this.aiInterviewRepository
      .createQueryBuilder("i")
      .select("i.user_id", "user_id")
      .addSelect("COUNT(*)::int", "interview_count")
      .addSelect(
        "COUNT(*) FILTER (WHERE i.status = :completed)::int",
        "completed_count",
      )
      .addSelect("AVG(i.score)", "avg_score")
      .addSelect("MAX(COALESCE(i.ended_at, i.created_at))", "last_activity_at")
      .where("i.user_id IN (:...userIds)", { userIds })
      .setParameter("completed", AiInterviewStatus.COMPLETED)
      .groupBy("i.user_id")
      .getRawMany();

    return new Map(
      raw.map((row) => [
        row.user_id,
        {
          interviewCount: Number(row.interview_count),
          completedCount: Number(row.completed_count),
          avgScore:
            row.avg_score === null
              ? null
              : Math.round(Number(row.avg_score) * 10) / 10,
          lastActivityAt: row.last_activity_at,
        },
      ]),
    );
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

  /** Retries on the (unlikely) unique-code collision. */
  private async generateUniqueInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const code = generateInviteCode();
      const existing = await this.inviteRepository.findOne({ where: { code } });
      if (!existing) return code;
    }
    throw new InternalServerErrorException(
      "Could not generate a unique invite code",
    );
  }

  /** Pending invites past expiry are reported as expired without mutating the row. */
  private toInviteRow(
    invite: organization_invite,
    redactCode = false,
  ): OrganizationInviteRow {
    const isLapsed =
      invite.status === OrganizationInviteStatus.PENDING &&
      invite.expires_at.getTime() < Date.now();
    return {
      invite_id: invite.invite_id,
      code: redactCode ? this.maskInviteCode(invite.code) : invite.code,
      email: invite.email,
      role: invite.role,
      status: isLapsed ? OrganizationInviteStatus.EXPIRED : invite.status,
      expires_at: invite.expires_at,
      created_at: invite.created_at,
      accepted_at: invite.accepted_at,
    };
  }

  /** Mask an invite code to its last 4 chars so non-admins can't read or reuse it. */
  private maskInviteCode(code: string): string {
    const visible = code.slice(-4);
    return `${"•".repeat(Math.max(0, code.length - 4))}${visible}`;
  }

  private buildRegisterUrl(code: string): string | undefined {
    const base = (process.env.FRONTEND_URL ?? "").replace(/\/$/, "");
    if (!base) return undefined;
    return `${base}/register?code=${encodeURIComponent(code)}`;
  }
}

import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { OrganizationService } from "./organization.service";
import { Organization } from "@entities/organization.entity";
import { user } from "@entities/user.entity";
import { organization_invite } from "@entities/organizationInvite.entity";
import { ai_interview } from "@entities/aiInterview.entity";
import { user_email } from "@entities/user.entity";
import { AuthService } from "../auth/auth.service";
import { OrganizationUserRole } from "@common/enums/organizationUserRole";
import { OrganizationInviteStatus } from "@common/enums/OrganizationInviteStatus";

describe("OrganizationService", () => {
  let service: OrganizationService;
  let orgRepo: any;
  let userRepo: Partial<Repository<user>>;
  let authService: Partial<AuthService>;
  let inviteRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let aiInterviewRepo: { createQueryBuilder: jest.Mock };
  let userEmailRepo: { findOne: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  const mockOrganization: Organization = {
    organization_id: "org-id",
    organization_name: "TestOrg",
    profile_picture: "",
    created_at: new Date(),
    updated_at: new Date(),
  } as Organization;

  const adminUserRow: user = {
    user_id: "admin-user-id",
    username: "admin",
    user_role: OrganizationUserRole.ADMIN,
    organization_id: { organization_id: "org-id" } as Organization,
  } as user;

  const employeeUserRow: user = {
    user_id: "employee-user-id",
    username: "employee",
    user_role: OrganizationUserRole.EMPLOYEE,
    organization_id: { organization_id: "org-id" } as Organization,
  } as user;

  beforeEach(async () => {
    orgRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      manager: {
        transaction: jest.fn(async (fn: (m: any) => Promise<void>) => {
          const mockManager = {
            createQueryBuilder: jest.fn(() => ({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 1 }),
            })),
            remove: jest.fn().mockResolvedValue(undefined),
          };
          await fn(mockManager);
        }) as any,
      },
    };

    userRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      save: jest.fn(),
    };

    authService = {
      register: jest.fn(),
    };

    inviteRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => ({ invite_id: "invite-id", ...v })),
    };
    aiInterviewRepo = { createQueryBuilder: jest.fn() };
    userEmailRepo = { findOne: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: getRepositoryToken(Organization),
          useValue: orgRepo,
        },
        {
          provide: getRepositoryToken(user),
          useValue: userRepo,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: getRepositoryToken(organization_invite),
          useValue: inviteRepo,
        },
        {
          provide: getRepositoryToken(ai_interview),
          useValue: aiInterviewRepo,
        },
        {
          provide: getRepositoryToken(user_email),
          useValue: userEmailRepo,
        },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(OrganizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerOrganization", () => {
    const dto = {
      OrganizationName: "TestOrg",
      OrganizationEmail: "admin@test.com",
    };

    it("should create organization and admin user", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(null);
      (orgRepo.create as jest.Mock).mockReturnValue(mockOrganization);
      (orgRepo.save as jest.Mock).mockResolvedValue(mockOrganization);
      (authService.register as jest.Mock).mockResolvedValue({});

      const result = await service.registerOrganization(dto as any);

      expect(orgRepo.findOne).toHaveBeenCalledWith({
        where: { organization_name: dto.OrganizationName },
      });

      expect(orgRepo.create).toHaveBeenCalledWith({
        organization_name: dto.OrganizationName,
      });

      expect(authService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "TestOrg_admin",
          email: "admin@test.com",
          user_role: OrganizationUserRole.ADMIN,
          organization_id: "org-id",
        }),
        true,
        { organizationName: "TestOrg" },
      );

      const registerArg = (authService.register as jest.Mock).mock.calls[0][0];
      expect(registerArg.password).toMatch(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
      );
      expect(registerArg.password.length).toBeGreaterThanOrEqual(20);

      expect(result.message).toBe("Creation successful");
      expect(result.adminUser).toEqual({
        username: "TestOrg_admin",
        email: "admin@test.com",
        password: registerArg.password,
      });
    });

    it("should throw if organization name already exists", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);

      await expect(service.registerOrganization(dto as any)).rejects.toThrow(
        new ConflictException("An organization with this name already exists"),
      );

      expect(orgRepo.create).not.toHaveBeenCalled();
      expect(authService.register).not.toHaveBeenCalled();
    });

    it("should 409 when a concurrent insert wins the unique-name race (23505)", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(null);
      (orgRepo.create as jest.Mock).mockReturnValue(mockOrganization);
      (orgRepo.save as jest.Mock).mockRejectedValue(
        new QueryFailedError("insert", [], {
          code: "23505",
        } as unknown as Error),
      );

      await expect(service.registerOrganization(dto as any)).rejects.toThrow(
        ConflictException,
      );
      expect(authService.register).not.toHaveBeenCalled();
    });
  });

  describe("deleteOrganization", () => {
    it("should delete organization when caller is admin", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);

      await service.deleteOrganization("org-id", adminUserRow);

      expect(orgRepo.manager.transaction).toHaveBeenCalled();
    });

    it("should throw NotFoundException if organization does not exist", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deleteOrganization("unknown-id", adminUserRow),
      ).rejects.toThrow(new NotFoundException("Organization not found."));

      expect(orgRepo.manager.transaction).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException if caller is not admin", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      const basicUser = {
        ...adminUserRow,
        user_role: OrganizationUserRole.USER,
      } as user;
      (userRepo.findOne as jest.Mock).mockResolvedValue(basicUser);

      await expect(
        service.deleteOrganization("org-id", basicUser),
      ).rejects.toThrow(ForbiddenException);

      expect(orgRepo.manager.transaction).not.toHaveBeenCalled();
    });

    it("throws InternalServerError when transaction fails", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);
      orgRepo.manager.transaction = jest
        .fn()
        .mockRejectedValue(new Error("db fail"));

      await expect(
        service.deleteOrganization("org-id", adminUserRow),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("updateOrganization", () => {
    it("should update name and profile picture", async () => {
      const org = { ...mockOrganization };

      (orgRepo.findOne as jest.Mock).mockResolvedValue(org);
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);
      (orgRepo.save as jest.Mock).mockResolvedValue(org);

      await service.updateOrganization("org-id", adminUserRow, {
        OrganizationName: "NewName",
        OrganizationProfilePicture: "pic.png",
      });

      expect(org.organization_name).toBe("NewName");
      expect(org.profile_picture).toBe("pic.png");
      expect(orgRepo.save).toHaveBeenCalledWith(org);
    });

    it("should throw if organization not found", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateOrganization("unknown-id", adminUserRow, {
          OrganizationName: "X",
        }),
      ).rejects.toThrow(new NotFoundException("Organization not found."));

      expect(orgRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("removeOrganizationMember", () => {
    const memberUserId = "member-user-id";

    const basicMember = (): user =>
      ({
        user_id: memberUserId,
        username: "basic",
        user_role: OrganizationUserRole.USER,
        organization_id: { organization_id: "org-id" } as Organization,
      }) as user;

    const employeeMember = (): user =>
      ({
        user_id: memberUserId,
        username: "emp",
        user_role: OrganizationUserRole.EMPLOYEE,
        organization_id: { organization_id: "org-id" } as Organization,
      }) as user;

    it("allows admin to remove a user", async () => {
      const member = basicMember();
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(adminUserRow)
        .mockResolvedValueOnce(member);
      (userRepo.save as jest.Mock).mockResolvedValue(member);

      const res = await service.removeOrganizationMember(
        "org-id",
        memberUserId,
        adminUserRow,
      );

      expect(res.message).toBe("Member removed from the organization");
      expect(member.user_role).toBe(OrganizationUserRole.NONE);
      expect(member.organization_id).toBeNull();
      expect(userRepo.save).toHaveBeenCalledWith(member);
    });

    it("allows admin to remove an employee", async () => {
      const member = employeeMember();
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(adminUserRow)
        .mockResolvedValueOnce(member);
      (userRepo.save as jest.Mock).mockResolvedValue(member);

      await service.removeOrganizationMember(
        "org-id",
        memberUserId,
        adminUserRow,
      );

      expect(member.user_role).toBe(OrganizationUserRole.NONE);
      expect(userRepo.save).toHaveBeenCalled();
    });

    it("allows employee to remove a user", async () => {
      const employeeCaller = {
        ...adminUserRow,
        user_id: "emp-caller",
        user_role: OrganizationUserRole.EMPLOYEE,
      } as user;
      const member = basicMember();
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(employeeCaller)
        .mockResolvedValueOnce(member);
      (userRepo.save as jest.Mock).mockResolvedValue(member);

      await service.removeOrganizationMember(
        "org-id",
        memberUserId,
        employeeCaller,
      );

      expect(userRepo.save).toHaveBeenCalled();
    });

    it("forbids employee from removing an employee", async () => {
      const employeeCaller = {
        ...adminUserRow,
        user_id: "emp-caller",
        user_role: OrganizationUserRole.EMPLOYEE,
      } as user;
      const member = employeeMember();
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(employeeCaller)
        .mockResolvedValueOnce(member);

      await expect(
        service.removeOrganizationMember(
          "org-id",
          memberUserId,
          employeeCaller,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it("forbids removing an organization admin", async () => {
      const otherAdmin = {
        user_id: memberUserId,
        username: "other-admin",
        user_role: OrganizationUserRole.ADMIN,
        organization_id: { organization_id: "org-id" } as Organization,
      } as user;
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(adminUserRow)
        .mockResolvedValueOnce(otherAdmin);

      await expect(
        service.removeOrganizationMember("org-id", memberUserId, adminUserRow),
      ).rejects.toThrow(ForbiddenException);

      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it("throws when member is not in this organization", async () => {
      const outsider = {
        ...basicMember(),
        organization_id: { organization_id: "other-org" } as Organization,
      } as user;
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(adminUserRow)
        .mockResolvedValueOnce(outsider);

      await expect(
        service.removeOrganizationMember("org-id", memberUserId, adminUserRow),
      ).rejects.toThrow(NotFoundException);

      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it("throws when caller is not in this organization", async () => {
      const outsiderCaller = {
        ...adminUserRow,
        organization_id: { organization_id: "other-org" } as Organization,
      } as user;
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue(outsiderCaller);

      await expect(
        service.removeOrganizationMember(
          "org-id",
          memberUserId,
          outsiderCaller,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it("throws when caller is not admin or employee", async () => {
      const userCaller = {
        ...adminUserRow,
        user_role: OrganizationUserRole.USER,
      } as user;
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue(userCaller);

      await expect(
        service.removeOrganizationMember("org-id", memberUserId, userCaller),
      ).rejects.toThrow(ForbiddenException);

      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it("throws Unauthorized when caller user record is missing", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.removeOrganizationMember("org-id", memberUserId, adminUserRow),
      ).rejects.toThrow(UnauthorizedException);

      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("getMyOrganizationForUser", () => {
    it("throws when user has no organization", async () => {
      const noneUser = {
        ...adminUserRow,
        user_role: OrganizationUserRole.NONE,
        organization_id: null,
      } as user;
      (userRepo.findOne as jest.Mock).mockResolvedValue(noneUser);

      await expect(service.getMyOrganizationForUser(noneUser)).rejects.toThrow(
        new NotFoundException("User is not affiliated with an organization"),
      );
    });

    it("throws when user has org but role is not allowed", async () => {
      const badUser = {
        ...adminUserRow,
        user_role: OrganizationUserRole.NONE,
        organization_id: { organization_id: "org-id" } as Organization,
      } as user;
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue(badUser);

      await expect(service.getMyOrganizationForUser(badUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("returns organization when user is affiliated", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);

      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            user_id: "member-a",
            username: "a",
            user_role: OrganizationUserRole.ADMIN,
          },
        ]),
      };
      (userRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      aiInterviewRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      const res = await service.getMyOrganizationForUser(adminUserRow);

      expect(res.organization_id).toBe("org-id");
      expect(res.members).toHaveLength(1);
      expect(res.members![0]).toEqual(
        expect.objectContaining({
          user_id: "member-a",
          username: "a",
          user_role: OrganizationUserRole.ADMIN,
          interviewCount: 0,
          completedCount: 0,
          avgScore: null,
          lastActivityAt: null,
        }),
      );
    });

    it("returns organization for USER without members list", async () => {
      const userRow = {
        ...adminUserRow,
        user_role: OrganizationUserRole.USER,
      } as user;
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue(userRow);

      const res = await service.getMyOrganizationForUser(userRow);

      expect(res.organization_id).toBe("org-id");
      expect(res.members).toBeUndefined();
    });

    it("returns organization for EMPLOYEE with filtered members", async () => {
      const userRow = {
        ...adminUserRow,
        user_role: OrganizationUserRole.EMPLOYEE,
      } as user;
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue(userRow);

      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            user_id: "member-u",
            username: "u",
            user_role: OrganizationUserRole.USER,
          },
        ]),
      };
      (userRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      aiInterviewRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      const res = await service.getMyOrganizationForUser(userRow);

      expect(res.members).toEqual([
        expect.objectContaining({
          user_id: "member-u",
          username: "u",
          user_role: OrganizationUserRole.USER,
          interviewCount: 0,
          completedCount: 0,
          avgScore: null,
          lastActivityAt: null,
        }),
      ]);
      expect(qb.andWhere).toHaveBeenCalled();
    });
  });

  describe("createOrganizationMember", () => {
    const dto = {
      username: "newuser",
      email: "n@example.com",
      role: OrganizationUserRole.USER,
    };

    it("creates member when admin calls", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);
      (authService.register as jest.Mock).mockResolvedValue({});

      const res = await service.createOrganizationMember(
        "org-id",
        dto as any,
        adminUserRow,
      );

      expect(res.message).toBe("Member created");
      expect(res.username).toBe("newuser");
      expect(authService.register).toHaveBeenCalled();
    });

    it("throws when caller is not in this organization", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      const otherOrgUser = {
        ...adminUserRow,
        organization_id: { organization_id: "other" } as Organization,
      } as user;
      (userRepo.findOne as jest.Mock).mockResolvedValue(otherOrgUser);

      await expect(
        service.createOrganizationMember("org-id", dto as any, otherOrgUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it("throws when caller is not admin or employee", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      const userOnly = {
        ...adminUserRow,
        user_role: OrganizationUserRole.USER,
      } as user;
      (userRepo.findOne as jest.Mock).mockResolvedValue(userOnly);

      await expect(
        service.createOrganizationMember("org-id", dto as any, userOnly),
      ).rejects.toThrow(ForbiddenException);
    });

    it("throws when employee tries to create non-USER role", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      const emp = {
        ...adminUserRow,
        user_role: OrganizationUserRole.EMPLOYEE,
      } as user;
      (userRepo.findOne as jest.Mock).mockResolvedValue(emp);

      await expect(
        service.createOrganizationMember(
          "org-id",
          { ...dto, role: OrganizationUserRole.EMPLOYEE } as any,
          emp,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("uses dto password when provided", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);
      (authService.register as jest.Mock).mockResolvedValue({});

      const res = await service.createOrganizationMember(
        "org-id",
        { ...dto, password: "CustomPass1!" } as any,
        adminUserRow,
      );

      expect(res.password).toBe("CustomPass1!");
    });

    it("throws InternalServerError when organization lookup fails unexpectedly", async () => {
      (orgRepo.findOne as jest.Mock).mockRejectedValue(new Error("db fail"));

      await expect(
        service.createOrganizationMember("org-id", dto as any, adminUserRow),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("createInvite", () => {
    beforeEach(() => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
    });

    it("admin creates an employee invite with 14-day expiry", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);
      inviteRepo.findOne.mockResolvedValue(null); // no code collision

      const before = Date.now();
      const row = await service.createInvite(
        "org-id",
        { role: OrganizationUserRole.EMPLOYEE },
        adminUserRow,
      );

      expect(row.code).toHaveLength(12);
      expect(row.role).toBe(OrganizationUserRole.EMPLOYEE);
      expect(row.status).toBe(OrganizationInviteStatus.PENDING);
      const expectedExpiry = before + 14 * 24 * 60 * 60 * 1000;
      expect(row.expires_at.getTime()).toBeGreaterThanOrEqual(
        expectedExpiry - 5000,
      );
      expect(inviteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: "org-id",
          created_by: adminUserRow.user_id,
          email: null,
        }),
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled(); // no email set
    });

    it("defaults role to user and emits invite email when email is set", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);
      inviteRepo.findOne.mockResolvedValue(null);

      const row = await service.createInvite(
        "org-id",
        { email: "Candidate@Example.com" },
        adminUserRow,
      );

      expect(row.role).toBe(OrganizationUserRole.USER);
      expect(inviteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: "candidate@example.com" }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "organization.invite_created",
        expect.objectContaining({
          email: "candidate@example.com",
          code: row.code,
          organizationName: mockOrganization.organization_name,
          role: OrganizationUserRole.USER,
        }),
      );
    });

    it("rejects employee inviting an employee", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(employeeUserRow);

      await expect(
        service.createInvite(
          "org-id",
          { role: OrganizationUserRole.EMPLOYEE },
          employeeUserRow,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(inviteRepo.save).not.toHaveBeenCalled();
    });

    it("rejects caller from another organization", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue({
        ...adminUserRow,
        organization_id: { organization_id: "other-org" } as Organization,
      });

      await expect(
        service.createInvite("org-id", {}, adminUserRow),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("listInvites", () => {
    it("returns rows for employees, mapping expired pending invites", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue(employeeUserRow);
      inviteRepo.find.mockResolvedValue([
        {
          invite_id: "i1",
          code: "AAAABBBBCCCC",
          email: null,
          role: "user",
          status: OrganizationInviteStatus.PENDING,
          expires_at: new Date(Date.now() - 1000), // past
          created_at: new Date(),
          accepted_at: null,
        },
      ]);

      const rows = await service.listInvites("org-id", employeeUserRow);

      expect(inviteRepo.find).toHaveBeenCalledWith({
        where: { organization_id: "org-id" },
        order: { created_at: "DESC" },
      });
      expect(rows[0].status).toBe(OrganizationInviteStatus.EXPIRED);
      // Employees get the code masked (only last 4 chars visible).
      expect(rows[0].code).not.toBe("AAAABBBBCCCC");
      expect(rows[0].code.endsWith("CCCC")).toBe(true);
      expect(rows[0].code).toContain("•");
    });

    it("returns the full plaintext code to admins", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);
      inviteRepo.find.mockResolvedValue([
        {
          invite_id: "i1",
          code: "AAAABBBBCCCC",
          email: null,
          role: "user",
          status: OrganizationInviteStatus.PENDING,
          expires_at: new Date(Date.now() + 100000),
          created_at: new Date(),
          accepted_at: null,
        },
      ]);

      const rows = await service.listInvites("org-id", adminUserRow);

      expect(rows[0].code).toBe("AAAABBBBCCCC");
    });

    it("rejects plain user-role callers", async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.findOne as jest.Mock).mockResolvedValue({
        ...employeeUserRow,
        user_role: OrganizationUserRole.USER,
      });

      await expect(
        service.listInvites("org-id", employeeUserRow),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("revokeInvite", () => {
    beforeEach(() => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
    });

    it("admin revokes a pending invite", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);
      inviteRepo.findOne.mockResolvedValue({
        invite_id: "i1",
        organization_id: "org-id",
        status: OrganizationInviteStatus.PENDING,
        expires_at: new Date(Date.now() + 1000),
      });

      await service.revokeInvite("org-id", "i1", adminUserRow);

      expect(inviteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrganizationInviteStatus.REVOKED }),
      );
    });

    it("rejects employees", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(employeeUserRow);

      await expect(
        service.revokeInvite("org-id", "i1", employeeUserRow),
      ).rejects.toThrow(ForbiddenException);
    });

    it("404s on invite from another org", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);
      inviteRepo.findOne.mockResolvedValue({
        invite_id: "i1",
        organization_id: "other-org",
        status: OrganizationInviteStatus.PENDING,
      });

      await expect(
        service.revokeInvite("org-id", "i1", adminUserRow),
      ).rejects.toThrow(NotFoundException);
    });

    it("409s on a non-pending invite", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);
      inviteRepo.findOne.mockResolvedValue({
        invite_id: "i1",
        organization_id: "org-id",
        status: OrganizationInviteStatus.ACCEPTED,
      });

      await expect(
        service.revokeInvite("org-id", "i1", adminUserRow),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("changeMemberRole", () => {
    const memberRow: user = {
      user_id: "member-id",
      username: "member",
      user_role: OrganizationUserRole.USER,
      organization_id: { organization_id: "org-id" } as Organization,
    } as user;

    beforeEach(() => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
    });

    it("admin promotes user to employee", async () => {
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(adminUserRow) // caller lookup
        .mockResolvedValueOnce(memberRow); // target lookup

      await service.changeMemberRole(
        "org-id",
        "member-id",
        OrganizationUserRole.EMPLOYEE,
        adminUserRow,
      );

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ user_role: OrganizationUserRole.EMPLOYEE }),
      );
    });

    it("rejects employee callers", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(employeeUserRow);

      await expect(
        service.changeMemberRole(
          "org-id",
          "member-id",
          OrganizationUserRole.EMPLOYEE,
          employeeUserRow,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("rejects changing an admin's role", async () => {
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(adminUserRow)
        .mockResolvedValueOnce({
          ...memberRow,
          user_role: OrganizationUserRole.ADMIN,
        });

      await expect(
        service.changeMemberRole(
          "org-id",
          "member-id",
          OrganizationUserRole.USER,
          adminUserRow,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("404s when target is not in the organization", async () => {
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(adminUserRow)
        .mockResolvedValueOnce({
          ...memberRow,
          organization_id: { organization_id: "other-org" } as Organization,
        });

      await expect(
        service.changeMemberRole(
          "org-id",
          "member-id",
          OrganizationUserRole.EMPLOYEE,
          adminUserRow,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getMyOrganizationForUser with stats (F14)", () => {
    const statsQb = (raw: any[]) => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(raw),
    });

    const membersQb = (rows: any[]) => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(rows),
    });

    it("attaches aggregated interview stats to member rows", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        membersQb([
          { user_id: "member-1", username: "alice", user_role: "user" },
          { user_id: "member-2", username: "bob", user_role: "user" },
        ]),
      );
      const lastActivity = new Date("2026-07-01T10:00:00Z");
      aiInterviewRepo.createQueryBuilder.mockReturnValue(
        statsQb([
          {
            user_id: "member-1",
            interview_count: 4,
            completed_count: 3,
            avg_score: "72.5",
            last_activity_at: lastActivity,
          },
        ]),
      );

      const details = await service.getMyOrganizationForUser(adminUserRow);

      expect(details.members).toEqual([
        expect.objectContaining({
          user_id: "member-1",
          username: "alice",
          interviewCount: 4,
          completedCount: 3,
          avgScore: 72.5,
          lastActivityAt: lastActivity,
        }),
        expect.objectContaining({
          user_id: "member-2",
          interviewCount: 0,
          completedCount: 0,
          avgScore: null,
          lastActivityAt: null,
        }),
      ]);
    });

    it("skips the stats query when there are no members", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(adminUserRow);
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (userRepo.createQueryBuilder as jest.Mock).mockReturnValue(membersQb([]));

      const details = await service.getMyOrganizationForUser(adminUserRow);

      expect(details.members).toEqual([]);
      expect(aiInterviewRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe("getOrganizationMemberDetail", () => {
    const memberRow: user = {
      user_id: "member-id",
      username: "alice",
      user_role: OrganizationUserRole.USER,
      organization_id: { organization_id: "org-id" } as Organization,
    } as user;

    const interviewsQb = (rows: any[]) => ({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(rows),
    });

    const statsQb = (raw: any[]) => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(raw),
    });

    beforeEach(() => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
    });

    it("returns profile, stats and recent interviews for an employee viewer", async () => {
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(employeeUserRow)
        .mockResolvedValueOnce(memberRow);
      userEmailRepo.findOne.mockResolvedValue({ email: "alice@example.com" });
      const interview = {
        interview_id: "iv-1",
        type: "technical",
        status: "completed",
        score: 80,
        created_at: new Date(),
        ended_at: new Date(),
      };
      aiInterviewRepo.createQueryBuilder
        .mockReturnValueOnce(
          statsQb([
            {
              user_id: "member-id",
              interview_count: 1,
              completed_count: 1,
              avg_score: "80",
              last_activity_at: interview.ended_at,
            },
          ]),
        )
        .mockReturnValueOnce(interviewsQb([interview]));

      const detail = await service.getOrganizationMemberDetail(
        "org-id",
        "member-id",
        employeeUserRow,
      );

      expect(detail).toEqual(
        expect.objectContaining({
          user_id: "member-id",
          username: "alice",
          email: "alice@example.com",
          stats: expect.objectContaining({ interviewCount: 1, avgScore: 80 }),
          recentInterviews: [
            expect.objectContaining({ interview_id: "iv-1", score: 80 }),
          ],
        }),
      );
    });

    it("blocks employees from viewing employee-role members", async () => {
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(employeeUserRow)
        .mockResolvedValueOnce({
          ...memberRow,
          user_role: OrganizationUserRole.EMPLOYEE,
        });

      await expect(
        service.getOrganizationMemberDetail(
          "org-id",
          "member-id",
          employeeUserRow,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("blocks user-role callers", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue({
        ...employeeUserRow,
        user_role: OrganizationUserRole.USER,
      });

      await expect(
        service.getOrganizationMemberDetail(
          "org-id",
          "member-id",
          employeeUserRow,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("404s when the target is in another organization", async () => {
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(adminUserRow)
        .mockResolvedValueOnce({
          ...memberRow,
          organization_id: { organization_id: "other-org" } as Organization,
        });

      await expect(
        service.getOrganizationMemberDetail(
          "org-id",
          "member-id",
          adminUserRow,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

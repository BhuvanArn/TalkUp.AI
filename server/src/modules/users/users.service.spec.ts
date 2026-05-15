import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { InternalServerErrorException } from "@nestjs/common";

import { ProfileVisibility } from "@common/enums/ProfileVisibility";
import { UserStatus } from "@common/enums/UserStatus";
import {
  user,
  user_email,
  user_phone_number,
  user_profile,
} from "@entities/user.entity";

import { UsersService } from "./users.service";

describe("UsersService", () => {
  let service: UsersService;
  let userRepo: {
    save: jest.Mock;
    delete: jest.Mock;
  };
  let profileRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let emailRepo: {
    findOne: jest.Mock;
  };
  let phoneRepo: {
    findOne: jest.Mock;
  };

  const baseUser = {
    user_id: "uid-1",
    username: "alice",
    created_at: new Date(),
    last_accessed_at: new Date(),
    updated_at: new Date(),
    tokenVersion: 1,
    status: UserStatus.ACTIVE,
    provider: "manual",
    organization_id: null,
    user_role: "none",
  } as user;

  const baseProfile = {
    user_id: "uid-1",
    first_name: "Alice",
    last_name: "Bee",
    bio: null,
    job_title: null,
    linkedin_url: null,
    profile_picture: null,
    avatar_accent_color: "#2B70C9",
    banner_gradient: null,
    profile_visibility: ProfileVisibility.PUBLIC,
    notification_prefs: null,
  } as user_profile;

  const emailRow: user_email = {
    email_id: 1,
    user_id: "uid-1",
    email: "alice@example.com",
    is_verified: true,
    user: undefined as never,
  };

  beforeEach(async () => {
    userRepo = {
      save: jest.fn((u: user) => Promise.resolve(u)),
      delete: jest.fn(),
    };
    profileRepo = {
      findOne: jest.fn(),
      create: jest.fn((p: Partial<user_profile>) => p as user_profile),
      save: jest.fn((p: user_profile) => Promise.resolve(p)),
    };
    emailRepo = {
      findOne: jest.fn(),
    };
    phoneRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(user), useValue: userRepo },
        { provide: getRepositoryToken(user_profile), useValue: profileRepo },
        { provide: getRepositoryToken(user_email), useValue: emailRepo },
        {
          provide: getRepositoryToken(user_phone_number),
          useValue: phoneRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getProfile", () => {
    it("returns assembled camelCase view", async () => {
      profileRepo.findOne.mockResolvedValue({ ...baseProfile });
      emailRepo.findOne.mockResolvedValue(emailRow);
      phoneRepo.findOne.mockResolvedValue(null);

      const v = await service.getProfile(baseUser);
      expect(v.userId).toBe("uid-1");
      expect(v.email).toBe("alice@example.com");
      expect(v.firstName).toBe("Alice");
      expect(v.profilePicture).toBeNull();
    });
  });

  describe("updateProfile", () => {
    it("creates profile when missing and updates first name", async () => {
      profileRepo.findOne.mockResolvedValueOnce(null);
      emailRepo.findOne.mockResolvedValue(emailRow);
      phoneRepo.findOne.mockResolvedValue(null);

      const v = await service.updateProfile(baseUser, {
        firstName: "Zed",
      });
      expect(profileRepo.create).toHaveBeenCalled();
      expect(profileRepo.save).toHaveBeenCalled();
      expect(v.firstName).toBe("Zed");
    });

    it("updates existing profile", async () => {
      profileRepo.findOne.mockResolvedValue({ ...baseProfile });
      emailRepo.findOne.mockResolvedValue(emailRow);
      phoneRepo.findOne.mockResolvedValue(null);

      const v = await service.updateProfile(baseUser, {
        firstName: "Zed",
      });
      expect(userRepo.save).toHaveBeenCalled();
      expect(profileRepo.save).toHaveBeenCalled();
      expect(v.firstName).toBe("Zed");
    });

    it("maps profilePicture to profile_picture", async () => {
      profileRepo.findOne.mockResolvedValue({ ...baseProfile });
      emailRepo.findOne.mockResolvedValue(emailRow);
      phoneRepo.findOne.mockResolvedValue(null);

      const dataUrl = "data:image/jpeg;base64,abcd";
      await service.updateProfile(baseUser, { profilePicture: dataUrl });

      expect(profileRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ profile_picture: dataUrl }),
      );
    });

    it("wraps unexpected errors", async () => {
      profileRepo.findOne.mockResolvedValue({ ...baseProfile });
      userRepo.save.mockRejectedValue(new Error("db"));

      await expect(
        service.updateProfile(baseUser, { bio: "x" }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("deleteAccount", () => {
    it("deletes existing account", async () => {
      userRepo.delete.mockResolvedValue({ affected: 1 });
      await expect(service.deleteAccount(baseUser)).resolves.toBeUndefined();
      expect(userRepo.delete).toHaveBeenCalledWith({
        user_id: baseUser.user_id,
      });
    });

    it("throws when account does not exist", async () => {
      userRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.deleteAccount(baseUser)).rejects.toThrow(
        "User not found.",
      );
    });
  });
});

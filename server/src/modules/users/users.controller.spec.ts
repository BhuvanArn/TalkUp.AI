import { Test, TestingModule } from "@nestjs/testing";

import { applyMockAccessTokenGuard } from "@src/test/utils/mock-guards";

import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/updateProfile.dto";

import { ProfileVisibility } from "@common/enums/ProfileVisibility";
import { UserStatus } from "@common/enums/UserStatus";
import { user } from "@entities/user.entity";

describe("UsersController", () => {
  let controller: UsersController;
  let mockUsersService: Partial<UsersService>;

  const mockUser = {
    user_id: "u1",
    username: "alice",
    status: UserStatus.ACTIVE,
  } as user;

  const profile = {
    userId: "u1",
    username: "alice",
    email: "a@example.com",
    phone: null,
    firstName: "Alice",
    lastName: "Bee",
    bio: null,
    jobTitle: null,
    linkedinUrl: null,
    profilePicture: null,
    avatarAccentColor: "#2B70C9",
    bannerGradient: null,
    profileVisibility: ProfileVisibility.PUBLIC,
    notificationPrefs: null,
  };

  beforeEach(async () => {
    mockUsersService = {
      getProfile: jest.fn().mockResolvedValue(profile),
      updateProfile: jest.fn().mockResolvedValue(profile),
      deleteAccount: jest.fn().mockResolvedValue(undefined),
      uploadCV: jest.fn().mockResolvedValue(undefined),
      uploadJobOffer: jest.fn().mockResolvedValue(undefined),
    };

    const moduleBuilder = Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    });
    const module: TestingModule =
      await applyMockAccessTokenGuard(moduleBuilder).compile();
    controller = module.get<UsersController>(UsersController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getMe", () => {
    it("returns profile from service", async () => {
      const res = await controller.getMe(mockUser);
      expect(res).toEqual(profile);
      expect(mockUsersService.getProfile).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("patchMe", () => {
    it("delegates to updateProfile", async () => {
      const dto: UpdateProfileDto = { firstName: "Bob" };
      const res = await controller.patchMe(mockUser, dto);
      expect(res).toEqual(profile);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
        mockUser,
        dto,
      );
    });
  });

  describe("deleteMe", () => {
    it("delegates to deleteAccount", async () => {
      await expect(controller.deleteMe(mockUser)).resolves.toBeUndefined();
      expect(mockUsersService.deleteAccount).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("uploadCV", () => {
    it("delegates to uploadCV with the user id and file", async () => {
      const file = { buffer: Buffer.from("pdf") } as never;
      await controller.uploadCV(mockUser, file);
      expect(mockUsersService.uploadCV).toHaveBeenCalledWith(
        mockUser.user_id,
        file,
      );
    });
  });

  describe("uploadJobOffer", () => {
    it("delegates to uploadJobOffer with the user id and url", async () => {
      await controller.uploadJobOffer(mockUser, {
        url: "https://example.com/job/1",
      });
      expect(mockUsersService.uploadJobOffer).toHaveBeenCalledWith(
        mockUser.user_id,
        "https://example.com/job/1",
      );
    });
  });
});

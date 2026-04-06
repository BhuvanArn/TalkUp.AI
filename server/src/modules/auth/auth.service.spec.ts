import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import * as bcrypt from "bcrypt";

import { AuthService } from "./auth.service";
import { CreateUserDto } from "./dto/createUser.dto";
import { EditUserDto } from "./dto/editUser.dto";
import { PasswordResetRequestDto } from "./dto/passwordResetRequest.dto";
import { PasswordResetVerifyDto } from "./dto/passwordResetVerify.dto";

import { OtpPurpose } from "@common/enums/OtpPurpose";
import { UserStatus } from "@common/enums/UserStatus";
import { OrganizationUserRole } from "@common/enums/organizationUserRole";

import { Otp } from "@entities/otp.entity";
import { user, user_password, user_email } from "@entities/user.entity";

import { ITokenStorage } from "@common/interfaces/token-storage";

jest.mock("bcrypt");
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

jest.mock("@common/utils/passwordHasher", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashed-password"),
}));

describe("AuthService", () => {
  let service: AuthService;
  let mockUserRepo: Partial<Repository<user>>;
  let mockUserEmailRepo: Partial<Repository<user_email>>;
  let mockUserPasswordRepo: Partial<Repository<user_password>>;
  let mockOtpRepo: Partial<Repository<Otp>>;
  let mockJwtService: Partial<JwtService>;
  let mockDataSource: { transaction: jest.Mock };
  let mockEventEmitter: { emit: jest.Mock };
  let mockTokenStorage: {
    blacklistToken: jest.Mock;
    consumeRefreshJti: jest.Mock;
    isJtiBlacklisted: jest.Mock;
    getTokenVersion: jest.Mock;
    incrementTokenVersion: jest.Mock;
  };

  const mockUser: user = {
    user_id: "test-user-id",
    username: "testuser",
    profile_picture: "",
    provider: "",
    verification_code: "",
    status: UserStatus.ACTIVE,
    organization_id: null,
    user_role: OrganizationUserRole.NONE,
    tokenVersion: 1,
    last_accessed_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    generateUUIDv7: (): string => "test-uuid",
  };

  const mockEmail: user_email = {
    email_id: 1,
    user_id: "test-user-id",
    email: "test@example.com",
    is_verified: false,
    user: mockUser,
  };

  const mockPassword: user_password = {
    password_id: 1,
    user_id: "test-user-id",
    password: "hashed-password",
    user: mockUser,
  };

  const mockOtp: Otp = {
    id: "otp-id",
    email: "test@example.com",
    codeHash: "hashed-otp",
    purpose: OtpPurpose.REGISTER,
    attempts: 0,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      findOneByOrFail: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockUserEmailRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockUserPasswordRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockOtpRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
      sign: jest.fn().mockReturnValue("reset-jwt"),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn(),
    };

    mockTokenStorage = {
      blacklistToken: jest.fn().mockResolvedValue(undefined),
      consumeRefreshJti: jest.fn().mockResolvedValue(true),
      isJtiBlacklisted: jest.fn().mockResolvedValue(false),
      getTokenVersion: jest.fn().mockResolvedValue(1),
      incrementTokenVersion: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(user),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(user_email),
          useValue: mockUserEmailRepo,
        },
        {
          provide: getRepositoryToken(user_password),
          useValue: mockUserPasswordRepo,
        },
        {
          provide: getRepositoryToken(Otp),
          useValue: mockOtpRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: ITokenStorage,
          useValue: mockTokenStorage,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    const createUserDto: CreateUserDto = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    it("should register pending user and emit OTP event", async () => {
      const txUserRepo = {
        create: jest
          .fn()
          .mockReturnValue({ ...mockUser, status: UserStatus.PENDING }),
        save: jest
          .fn()
          .mockResolvedValue({ ...mockUser, status: UserStatus.PENDING }),
        findOne: jest.fn(),
      };
      const txUserPasswordRepo = {
        create: jest.fn().mockReturnValue(mockPassword),
        save: jest.fn().mockResolvedValue(mockPassword),
        findOne: jest.fn(),
      };
      const txUserEmailRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(mockEmail),
        save: jest.fn().mockResolvedValue(mockEmail),
      };
      const txOtpRepo = {
        create: jest.fn().mockReturnValue(mockOtp),
        save: jest.fn().mockResolvedValue(mockOtp),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        }),
      };

      mockedBcrypt.hash.mockResolvedValue("otp-hash" as never);
      mockDataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: (entity: unknown) => {
            if (entity === user) return txUserRepo;
            if (entity === user_password) return txUserPasswordRepo;
            if (entity === user_email) return txUserEmailRepo;
            if (entity === Otp) return txOtpRepo;
            return null;
          },
        }),
      );

      await service.register(createUserDto);

      expect(txUserEmailRepo.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(txUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: createUserDto.username,
          status: UserStatus.PENDING,
          organization_id: null,
          user_role: OrganizationUserRole.NONE,
        }),
      );
      expect(txOtpRepo.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        "auth.otp_generated",
        expect.objectContaining({
          email: createUserDto.email,
          purpose: OtpPurpose.REGISTER,
        }),
      );
    });

    it("should apply org and role when trusted", async () => {
      const txUserRepo = {
        create: jest
          .fn()
          .mockReturnValue({ ...mockUser, status: UserStatus.PENDING }),
        save: jest
          .fn()
          .mockResolvedValue({ ...mockUser, status: UserStatus.PENDING }),
        findOne: jest.fn(),
      };
      const txUserPasswordRepo = {
        create: jest.fn().mockReturnValue(mockPassword),
        save: jest.fn().mockResolvedValue(mockPassword),
        findOne: jest.fn(),
      };
      const txUserEmailRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(mockEmail),
        save: jest.fn().mockResolvedValue(mockEmail),
      };
      const txOtpRepo = {
        create: jest.fn().mockReturnValue(mockOtp),
        save: jest.fn().mockResolvedValue(mockOtp),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        }),
      };

      mockedBcrypt.hash.mockResolvedValue("otp-hash" as never);
      mockDataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: (entity: unknown) => {
            if (entity === user) return txUserRepo;
            if (entity === user_password) return txUserPasswordRepo;
            if (entity === user_email) return txUserEmailRepo;
            if (entity === Otp) return txOtpRepo;
            return null;
          },
        }),
      );

      await service.register(
        {
          ...createUserDto,
          organization_id: "org-uuid",
          user_role: OrganizationUserRole.ADMIN,
        },
        true,
      );

      expect(txUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "testuser",
          status: UserStatus.PENDING,
          organization_id: { organization_id: "org-uuid" },
          user_role: OrganizationUserRole.ADMIN,
        }),
      );
    });

    it("should enrich OTP event when trusted register includes organization invite context", async () => {
      const txUserRepo = {
        create: jest
          .fn()
          .mockReturnValue({ ...mockUser, status: UserStatus.PENDING }),
        save: jest
          .fn()
          .mockResolvedValue({ ...mockUser, status: UserStatus.PENDING }),
        findOne: jest.fn(),
      };
      const txUserPasswordRepo = {
        create: jest.fn().mockReturnValue(mockPassword),
        save: jest.fn().mockResolvedValue(mockPassword),
        findOne: jest.fn(),
      };
      const txUserEmailRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(mockEmail),
        save: jest.fn().mockResolvedValue(mockEmail),
      };
      const txOtpRepo = {
        create: jest.fn().mockReturnValue(mockOtp),
        save: jest.fn().mockResolvedValue(mockOtp),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        }),
      };

      mockedBcrypt.hash.mockResolvedValue("otp-hash" as never);
      mockDataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: (entity: unknown) => {
            if (entity === user) return txUserRepo;
            if (entity === user_password) return txUserPasswordRepo;
            if (entity === user_email) return txUserEmailRepo;
            if (entity === Otp) return txOtpRepo;
            return null;
          },
        }),
      );

      const prevUrl = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = "https://app.example.com";

      await service.register(
        {
          ...createUserDto,
          organization_id: "org-uuid",
          user_role: OrganizationUserRole.USER,
        },
        true,
        { organizationName: "Acme Inc" },
      );

      process.env.FRONTEND_URL = prevUrl;

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        "auth.otp_generated",
        expect.objectContaining({
          email: createUserDto.email,
          purpose: OtpPurpose.REGISTER,
          registrationChannel: "organization",
          organizationName: "Acme Inc",
          verifyUrl:
            "https://app.example.com/verify-email?email=test%40example.com",
        }),
      );
    });

    it("should throw conflict for active account", async () => {
      mockedBcrypt.hash.mockResolvedValue("otp-hash" as never);

      const txEmailRepo = {
        findOne: jest.fn().mockResolvedValue(mockEmail),
        save: jest.fn(),
      };
      const txUserRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue({
            ...mockUser,
            status: UserStatus.ACTIVE,
          }),
        }),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: (entity: unknown) => {
            if (entity === user) {
              return txUserRepo;
            }
            if (entity === user_password) {
              return { findOne: jest.fn() };
            }
            if (entity === user_email) {
              return txEmailRepo;
            }
            if (entity === Otp) {
              return { delete: jest.fn(), save: jest.fn(), create: jest.fn() };
            }
            return null;
          },
        }),
      );

      await expect(service.register(createUserDto)).rejects.toThrow(
        new ConflictException("An account with this email already exists"),
      );
      expect(txEmailRepo.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(txUserRepo.createQueryBuilder).toHaveBeenCalledWith("user");
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe("validateUser", () => {
    const email = "test@example.com";
    const password = "password123";

    it("should successfully validate active user", async () => {
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);
      mockUserPasswordRepo.findOne = jest.fn().mockResolvedValue(mockPassword);
      mockUserRepo.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockUser, status: UserStatus.ACTIVE });
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(email, password);

      expect(result).toEqual(
        expect.objectContaining({ user_id: "test-user-id" }),
      );
    });

    it("should reject pending users", async () => {
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);
      mockUserPasswordRepo.findOne = jest.fn().mockResolvedValue(mockPassword);
      mockUserRepo.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockUser, status: UserStatus.PENDING });

      await expect(service.validateUser(email, password)).rejects.toThrow(
        new UnauthorizedException("Email is not verified"),
      );
    });
  });

  describe("login", () => {
    it("should return access and refresh token", async () => {
      mockJwtService.signAsync = jest
        .fn()
        .mockResolvedValueOnce("access-token")
        .mockResolvedValueOnce("refresh-token");

      const result = await service.login(mockUser);

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });
  });

  describe("getUserById", () => {
    it("returns user when found", async () => {
      mockUserRepo.findOne = jest.fn().mockResolvedValue(mockUser);
      const result = await service.getUserById("test-user-id");
      expect(result).toEqual(mockUser);
    });

    it("returns null when not found", async () => {
      mockUserRepo.findOne = jest.fn().mockResolvedValue(null);
      const result = await service.getUserById("missing");
      expect(result).toBeNull();
    });
  });

  describe("validateUser", () => {
    const email = "test@example.com";
    const password = "password123";

    it("throws when email entity missing", async () => {
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.validateUser(email, password)).rejects.toThrow(
        new UnauthorizedException("Email not found"),
      );
    });

    it("throws when password or user entity missing", async () => {
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);
      mockUserPasswordRepo.findOne = jest.fn().mockResolvedValue(null);
      mockUserRepo.findOne = jest.fn().mockResolvedValue(mockUser);
      await expect(service.validateUser(email, password)).rejects.toThrow(
        new UnauthorizedException("Email not found"),
      );
    });

    it("throws when password does not match", async () => {
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);
      mockUserPasswordRepo.findOne = jest.fn().mockResolvedValue(mockPassword);
      mockUserRepo.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockUser, status: UserStatus.ACTIVE });
      mockedBcrypt.compare.mockResolvedValue(false as never);
      await expect(service.validateUser(email, password)).rejects.toThrow(
        new UnauthorizedException("Invalid password"),
      );
    });
  });

  describe("passwordResetRequest", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns silently when email is unknown (timing-safe)", async () => {
      mockedBcrypt.hash.mockResolvedValue("dummy-hash" as never);
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(null);

      const dto: PasswordResetRequestDto = { email: "ghost@example.com" };
      const promise = service.passwordResetRequest(dto);
      await jest.runAllTimersAsync();
      await promise;

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe("passwordResetVerify", () => {
    it("rejects wrong purpose", async () => {
      const dto = {
        email: "a@b.com",
        code: "123456",
        purpose: OtpPurpose.REGISTER,
      } as unknown as PasswordResetVerifyDto;
      await expect(service.passwordResetVerify(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws when OTP verification fails in transaction", async () => {
      const dto: PasswordResetVerifyDto = {
        email: "test@example.com",
        code: "123456",
        purpose: OtpPurpose.RESET_PASSWORD,
      };

      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);
      mockUserRepo.findOne = jest.fn().mockResolvedValue(mockUser);

      mockDataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: () => ({
            createQueryBuilder: jest.fn().mockReturnValue({
              setLock: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue(null),
            }),
            delete: jest.fn(),
            save: jest.fn(),
          }),
        }),
      );

      await expect(service.passwordResetVerify(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("returns signed reset token when OTP valid", async () => {
      const dto: PasswordResetVerifyDto = {
        email: "test@example.com",
        code: "123456",
        purpose: OtpPurpose.RESET_PASSWORD,
      };

      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);
      mockUserRepo.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockUser, tokenVersion: 2 });

      const otpEntity = {
        id: "otp-1",
        codeHash: "hash",
        attempts: 0,
        expiresAt: new Date(Date.now() + 60000),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: () => ({
            createQueryBuilder: jest.fn().mockReturnValue({
              setLock: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue(otpEntity),
            }),
            delete: jest.fn(),
            save: jest.fn(),
          }),
        }),
      );

      mockedBcrypt.compare.mockResolvedValue(true as never);

      const token = await service.passwordResetVerify(dto);
      expect(token).toBe("reset-jwt");
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });

  describe("passwordUpdate", () => {
    it("updates password in transaction", async () => {
      const userRepo = {
        findOne: jest.fn().mockResolvedValue(mockUser),
        createQueryBuilder: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 1 }),
        }),
      };
      const passwordRepo = {
        findOne: jest.fn().mockResolvedValue(mockPassword),
        save: jest.fn().mockResolvedValue(mockPassword),
        create: jest.fn(),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: (entity: unknown) => {
            if (entity === user) return userRepo;
            if (entity === user_password) return passwordRepo;
            return {};
          },
        }),
      );

      await expect(
        service.passwordUpdate("test-user-id", "Newpass1!"),
      ).resolves.toBeUndefined();
      expect(passwordRepo.save).toHaveBeenCalled();
    });
  });

  describe("resendOtp", () => {
    it("throws 429 when within cooldown", async () => {
      const recent = new Date(Date.now() - 1000);
      mockOtpRepo.findOne = jest.fn().mockResolvedValue({
        ...mockOtp,
        createdAt: recent,
      });
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await expect(
        service.resendOtp("test@example.com", OtpPurpose.REGISTER),
      ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
    });

    it("throws when email not found", async () => {
      mockOtpRepo.findOne = jest.fn().mockResolvedValue(null);
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(null);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await expect(
        service.resendOtp("missing@example.com", OtpPurpose.REGISTER),
      ).rejects.toThrow(BadRequestException);
    });

    it("emits event when resend succeeds", async () => {
      mockOtpRepo.findOne = jest.fn().mockResolvedValue(null);
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);
      mockUserRepo.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockUser, status: UserStatus.PENDING });
      mockedBcrypt.hash.mockResolvedValue("h" as never);

      mockDataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: () => ({
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            create: jest.fn().mockReturnValue(mockOtp),
            save: jest.fn().mockResolvedValue(mockOtp),
          }),
        }),
      );

      await service.resendOtp("test@example.com", OtpPurpose.REGISTER);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        "auth.otp_generated",
        expect.objectContaining({ email: "test@example.com" }),
      );
    });

    it("emits organization invite fields on resend when user belongs to an org", async () => {
      mockOtpRepo.findOne = jest.fn().mockResolvedValue(null);
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);
      const pendingUser = {
        ...mockUser,
        status: UserStatus.PENDING,
      };
      const userWithOrg = {
        ...pendingUser,
        organization_id: {
          organization_id: "org-id",
          organization_name: "Acme Inc",
        },
      };
      mockUserRepo.findOne = jest
        .fn()
        .mockResolvedValueOnce(pendingUser)
        .mockResolvedValueOnce(userWithOrg);
      mockedBcrypt.hash.mockResolvedValue("h" as never);

      mockDataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: () => ({
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            create: jest.fn().mockReturnValue(mockOtp),
            save: jest.fn().mockResolvedValue(mockOtp),
          }),
        }),
      );

      const prevUrl = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = "https://app.example.com";

      await service.resendOtp("test@example.com", OtpPurpose.REGISTER);

      process.env.FRONTEND_URL = prevUrl;

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        "auth.otp_generated",
        expect.objectContaining({
          email: "test@example.com",
          registrationChannel: "organization",
          organizationName: "Acme Inc",
          verifyUrl:
            "https://app.example.com/verify-email?email=test%40example.com",
        }),
      );
    });
  });

  describe("editUser", () => {
    it("updates username and email", async () => {
      mockUserRepo.findOneByOrFail = jest.fn().mockResolvedValue({
        ...mockUser,
      });
      mockUserRepo.save = jest.fn().mockResolvedValue(mockUser);
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);

      const dto: EditUserDto = {
        username: "newname",
        email: "new@example.com",
      };

      const result = await service.editUser("test-user-id", dto);
      expect(result).toBeDefined();
      expect(mockUserEmailRepo.save).toHaveBeenCalled();
    });

    it("wraps unexpected errors", async () => {
      mockUserRepo.findOneByOrFail = jest.fn().mockResolvedValue(mockUser);
      mockUserRepo.save = jest.fn().mockRejectedValue(new Error("db"));

      await expect(
        service.editUser("test-user-id", { username: "x" } as EditUserDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("refreshTokens", () => {
    it("issues new token pair and consumes old jti atomically", async () => {
      const now = Math.floor(Date.now() / 1000);
      mockJwtService.verifyAsync = jest.fn().mockResolvedValueOnce({
        userId: "test-user-id",
        tv: 1,
        typ: "refresh",
        jti: "old-jti",
        exp: now + 3600,
      });
      mockUserRepo.findOne = jest.fn().mockResolvedValue(mockUser);
      mockJwtService.signAsync = jest
        .fn()
        .mockResolvedValueOnce("new-at")
        .mockResolvedValueOnce("new-rt");

      const result = await service.refreshTokens("old-refresh-jwt");

      expect(result).toEqual({
        accessToken: "new-at",
        refreshToken: "new-rt",
      });
      expect(mockTokenStorage.consumeRefreshJti).toHaveBeenCalledWith(
        "old-jti",
        expect.any(Number),
      );
      expect(mockTokenStorage.blacklistToken).not.toHaveBeenCalled();
    });

    it("rejects when RT has wrong typ", async () => {
      mockJwtService.verifyAsync = jest.fn().mockResolvedValueOnce({
        userId: "test-user-id",
        tv: 1,
        typ: "access",
        jti: "jti-1",
      });

      await expect(service.refreshTokens("bad-rt")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejects when jti was already consumed or revoked", async () => {
      mockJwtService.verifyAsync = jest.fn().mockResolvedValueOnce({
        userId: "test-user-id",
        tv: 1,
        typ: "refresh",
        jti: "revoked-jti",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      mockUserRepo.findOne = jest.fn().mockResolvedValue(mockUser);
      mockTokenStorage.consumeRefreshJti.mockResolvedValueOnce(false);

      await expect(service.refreshTokens("revoked-rt")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejects when tokenVersion mismatches", async () => {
      mockJwtService.verifyAsync = jest.fn().mockResolvedValueOnce({
        userId: "test-user-id",
        tv: 99,
        typ: "refresh",
        jti: "jti-1",
      });
      mockUserRepo.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockUser, tokenVersion: 1 });

      await expect(service.refreshTokens("stale-rt")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejects when RT signature is invalid", async () => {
      mockJwtService.verifyAsync = jest
        .fn()
        .mockRejectedValueOnce(new Error("invalid signature"));

      await expect(service.refreshTokens("tampered-rt")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("logout", () => {
    it("increments tokenVersion and blacklists jti", async () => {
      await service.logout("test-user-id", "rt-jti-1");

      expect(mockTokenStorage.incrementTokenVersion).toHaveBeenCalledWith(
        "test-user-id",
      );
      expect(mockTokenStorage.blacklistToken).toHaveBeenCalledWith(
        "rt-jti-1",
        7 * 24 * 60 * 60,
      );
    });

    it("increments tokenVersion without blacklist when no jti", async () => {
      await service.logout("test-user-id");

      expect(mockTokenStorage.incrementTokenVersion).toHaveBeenCalledWith(
        "test-user-id",
      );
      expect(mockTokenStorage.blacklistToken).not.toHaveBeenCalled();
    });
  });
});

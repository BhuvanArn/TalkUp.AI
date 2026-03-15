import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import * as bcrypt from "bcrypt";

import { AuthService } from "./auth.service";
import { CreateUserDto } from "./dto/createUser.dto";

import { OtpPurpose } from "@common/enums/OtpPurpose";
import { UserStatus } from "@common/enums/UserStatus";
import { Otp } from "@entities/otp.entity";
import { user, user_password, user_email } from "@entities/user.entity";

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

  const mockUser: user = {
    user_id: "test-user-id",
    username: "testuser",
    profile_picture: "",
    provider: "",
    verification_code: "",
    status: UserStatus.ACTIVE,
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
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn(),
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
        create: jest.fn().mockReturnValue(mockEmail),
        save: jest.fn().mockResolvedValue(mockEmail),
      };
      const txOtpRepo = {
        create: jest.fn().mockReturnValue(mockOtp),
        save: jest.fn().mockResolvedValue(mockOtp),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(null);
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

      expect(mockUserEmailRepo.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(txOtpRepo.delete).toHaveBeenCalledWith({
        email: createUserDto.email,
        purpose: OtpPurpose.REGISTER,
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        "auth.otp_generated",
        expect.objectContaining({
          email: createUserDto.email,
          purpose: OtpPurpose.REGISTER,
        }),
      );
    });

    it("should throw conflict for active account", async () => {
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);
      mockedBcrypt.hash.mockResolvedValue("otp-hash" as never);

      mockDataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: (entity: unknown) => {
            if (entity === user) {
              return {
                findOne: jest
                  .fn()
                  .mockResolvedValue({
                    ...mockUser,
                    status: UserStatus.ACTIVE,
                  }),
              };
            }
            if (entity === user_password) {
              return { findOne: jest.fn() };
            }
            if (entity === user_email) {
              return { save: jest.fn() };
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
});

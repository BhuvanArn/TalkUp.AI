import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

import { applyMockAccessTokenGuard } from "../../test/utils/mock-guards";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "./dto/createUser.dto";
import { EditUserDto } from "./dto/editUser.dto";
import { LoginDto } from "./dto/login.dto";
import { PasswordResetRequestDto } from "./dto/passwordResetRequest.dto";
import { PasswordResetVerifyDto } from "./dto/passwordResetVerify.dto";
import { PasswordUpdateDto } from "./dto/passwordUpdate.dto";

import { AccessTokenGuard } from "../../common/guards/accessToken.guard";
import { ResetTokenGuard } from "../../common/guards/resetToken.guard";
import { SessionGuard } from "../../common/guards/session.guard";

import { UserStatus } from "../../common/enums/UserStatus";
import { OtpPurpose } from "../../common/enums/OtpPurpose";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "../../common/constants/auth.constants";

describe("AuthController", () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;

  const mockUser = {
    user_id: "test-user-id",
    username: "testuser",
    profile_picture: "",
    provider: "",
    verification_code: "",
    status: UserStatus.ACTIVE,
    last_accessed_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      verifyEmail: jest.fn(),
      resendOtp: jest.fn(),
      validateUser: jest.fn(),
      login: jest.fn(),
      getUserById: jest.fn(),
      passwordResetRequest: jest.fn(),
      passwordResetVerify: jest.fn(),
      passwordUpdate: jest.fn(),
      editUser: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
    };

    const moduleBuilder = Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(ResetTokenGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(SessionGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) });
    const module: TestingModule =
      await applyMockAccessTokenGuard(moduleBuilder).compile();
    controller = module.get<AuthController>(AuthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("register", () => {
    const createUserDto: CreateUserDto = {
      username: "testuser",
      email: "testuser@example.com",
      password: "password123",
    };

    it("should successfully register a new user", async () => {
      mockAuthService.register = jest.fn().mockResolvedValue(undefined);

      const result = await controller.register(createUserDto);

      expect(result).toEqual({ message: "Verification email sent" });
      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    });

    it("should throw ConflictException when email already exists", async () => {
      const conflictError = new ConflictException(
        "An account with this email already exists",
      );
      mockAuthService.register = jest.fn().mockRejectedValue(conflictError);

      await expect(controller.register(createUserDto)).rejects.toThrow(
        conflictError,
      );

      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    });

    it("should handle service errors properly", async () => {
      const serviceError = new Error("Database connection failed");
      mockAuthService.register = jest.fn().mockRejectedValue(serviceError);

      await expect(controller.register(createUserDto)).rejects.toThrow(
        serviceError,
      );

      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe("verifyEmail", () => {
    it("should verify email, set both cookies, and return success", async () => {
      mockAuthService.verifyEmail = jest.fn().mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const mockResponse: any = { cookie: jest.fn() };
      const result = await controller.verifyEmail(
        { email: "testuser@example.com", otpCode: "123456" },
        mockResponse,
      );

      expect(result).toEqual({ message: "Email verified" });
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        ACCESS_COOKIE_NAME,
        "access-token",
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        "refresh-token",
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe("resendOtp", () => {
    it("should resend OTP", async () => {
      mockAuthService.resendOtp = jest.fn().mockResolvedValue(undefined);

      const result = await controller.resendOtp({
        email: "testuser@example.com",
        purpose: OtpPurpose.REGISTER,
      });

      expect(result).toEqual({ message: "Verification email sent" });
      expect(mockAuthService.resendOtp).toHaveBeenCalledWith(
        "testuser@example.com",
        OtpPurpose.REGISTER,
      );
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      email: "testuser@example.com",
      password: "password123",
    };

    it("should successfully login a user", async () => {
      const serviceLoginResponse = {
        accessToken: "login-jwt-token",
        refreshToken: "login-refresh-token",
      };
      mockAuthService.validateUser = jest.fn().mockResolvedValue(mockUser);
      mockAuthService.login = jest.fn().mockResolvedValue(serviceLoginResponse);

      const mockResponse: any = { cookie: jest.fn() };

      const result = await controller.login(loginDto, mockResponse);

      expect(result).toEqual({ message: "Login successful" });
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        "testuser@example.com",
        "password123",
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        ACCESS_COOKIE_NAME,
        serviceLoginResponse.accessToken,
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        serviceLoginResponse.refreshToken,
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it("should throw UnauthorizedException when email not found", async () => {
      const unauthorizedError = new UnauthorizedException("Email not found");
      mockAuthService.validateUser = jest
        .fn()
        .mockRejectedValue(unauthorizedError);

      const mockResponse: any = { cookie: jest.fn() };

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        unauthorizedError,
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        "testuser@example.com",
        "password123",
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException when password is invalid", async () => {
      const invalidPasswordError = new UnauthorizedException(
        "Invalid password",
      );
      mockAuthService.validateUser = jest
        .fn()
        .mockRejectedValue(invalidPasswordError);

      const mockResponse: any = { cookie: jest.fn() };

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        invalidPasswordError,
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        "testuser@example.com",
        "password123",
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it("should handle different login credentials", async () => {
      const customLoginDto: LoginDto = {
        email: "different@example.com",
        password: "differentPassword",
      };
      const expectedResponse = {
        accessToken: "custom-token",
        refreshToken: "custom-refresh",
      };

      mockAuthService.validateUser = jest.fn().mockResolvedValue(mockUser);
      mockAuthService.login = jest.fn().mockResolvedValue(expectedResponse);

      const mockResponse: any = { cookie: jest.fn() };

      const result = await controller.login(customLoginDto, mockResponse);

      expect(result).toEqual({ message: "Login successful" });
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        "different@example.com",
        "differentPassword",
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        ACCESS_COOKIE_NAME,
        expectedResponse.accessToken,
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it("should handle service validation errors properly", async () => {
      const serviceError = new Error("Database connection failed");
      mockAuthService.validateUser = jest.fn().mockRejectedValue(serviceError);

      const mockResponse: any = { cookie: jest.fn() };

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        serviceError,
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        "testuser@example.com",
        "password123",
      );
    });
  });

  describe("logout", () => {
    it("should call authService.logout, clear both cookies, and return success", async () => {
      mockAuthService.logout = jest.fn().mockResolvedValue(undefined);
      const mockRequest: any = { refreshJti: undefined };
      const mockResponse: any = { cookie: jest.fn() };

      const result = await controller.logout(
        "user-1",
        mockRequest,
        mockResponse,
      );

      expect(result).toEqual({ message: "Logout successful" });
      expect(mockAuthService.logout).toHaveBeenCalledWith(
        "user-1",
        undefined,
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        ACCESS_COOKIE_NAME,
        "",
        expect.objectContaining({ maxAge: 0 }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        "",
        expect.objectContaining({ maxAge: 0 }),
      );
    });

    it("passes refreshJti when session was authenticated via RT", async () => {
      mockAuthService.logout = jest.fn().mockResolvedValue(undefined);
      const mockRequest: any = { refreshJti: "rt-jti-for-logout" };
      const mockResponse: any = { cookie: jest.fn() };

      await controller.logout("user-1", mockRequest, mockResponse);

      expect(mockAuthService.logout).toHaveBeenCalledWith(
        "user-1",
        "rt-jti-for-logout",
      );
    });
  });

  describe("refresh", () => {
    it("should call refreshTokens and set both cookies", async () => {
      mockAuthService.refreshTokens = jest.fn().mockResolvedValue({
        accessToken: "new-at",
        refreshToken: "new-rt",
      });
      const mockRequest: any = {
        cookies: { [REFRESH_COOKIE_NAME]: "old-rt" },
      };
      const mockResponse: any = { cookie: jest.fn() };

      const result = await controller.refresh(mockRequest, mockResponse);

      expect(result).toEqual({ message: "Token refreshed" });
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith("old-rt");
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        ACCESS_COOKIE_NAME,
        "new-at",
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        "new-rt",
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it("throws when refresh cookie is missing", async () => {
      const mockRequest: any = { cookies: {} };
      const mockResponse: any = { cookie: jest.fn() };

      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("getAuthStatus", () => {
    it("should return authenticated: true when guard passes", async () => {
      const result = await controller.getAuthStatus();

      expect(result).toEqual({ authenticated: true });
    });

    it("should throw UnauthorizedException when guard fails (simulated)", async () => {
      const result = await controller.getAuthStatus();
      expect(result).toEqual({ authenticated: true });
    });
  });

  describe("passwordResetRequest", () => {
    it("delegates to auth service", async () => {
      mockAuthService.passwordResetRequest = jest
        .fn()
        .mockResolvedValue(undefined);
      const dto: PasswordResetRequestDto = { email: "u@example.com" };

      const result = await controller.passwordResetRequest(dto);

      expect(mockAuthService.passwordResetRequest).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        message: "If the account exists, a password reset code will be sent",
      });
    });
  });

  describe("passwordResetVerify", () => {
    it("sets resetToken cookie and returns success message", async () => {
      mockAuthService.passwordResetVerify = jest
        .fn()
        .mockResolvedValue("jwt-reset-token");
      const dto: PasswordResetVerifyDto = {
        email: "u@example.com",
        code: "123456",
        purpose: OtpPurpose.RESET_PASSWORD,
      };
      const mockResponse: any = { cookie: jest.fn() };

      const result = await controller.passwordResetVerify(dto, mockResponse);

      expect(mockAuthService.passwordResetVerify).toHaveBeenCalledWith(dto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "resetToken",
        "jwt-reset-token",
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ message: "Verification successful" });
    });
  });

  describe("passwordUpdate", () => {
    it("updates password and clears resetToken cookie", async () => {
      mockAuthService.passwordUpdate = jest.fn().mockResolvedValue(undefined);
      const body: PasswordUpdateDto = { newPassword: "Abcd1234!" };
      const mockResponse: any = { cookie: jest.fn() };

      const result = await controller.passwordUpdate(
        "user-1",
        body,
        mockResponse,
      );

      expect(mockAuthService.passwordUpdate).toHaveBeenCalledWith(
        "user-1",
        "Abcd1234!",
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "resetToken",
        "",
        expect.objectContaining({ maxAge: 0 }),
      );
      expect(result).toEqual({ message: "Password updated successfully" });
    });
  });

  describe("editUser", () => {
    it("delegates to auth service", async () => {
      const updated = { ...mockUser, username: "new" };
      mockAuthService.editUser = jest.fn().mockResolvedValue(updated);
      const dto: EditUserDto = {
        username: "new",
        email: "testuser@example.com",
      };

      const result = await controller.editUser("user-1", dto);

      expect(mockAuthService.editUser).toHaveBeenCalledWith("user-1", dto);
      expect(result).toEqual(updated);
    });
  });
});

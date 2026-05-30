import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  Get,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  UnauthorizedException,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { Request, Response } from "express";

import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { ResetTokenGuard } from "@common/guards/resetToken.guard";
import { SessionGuard } from "@common/guards/session.guard";

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiAcceptedResponse,
  ApiUnprocessableEntityResponse,
  ApiTags,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { CreateUserDto } from "./dto/createUser.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verifyEmail.dto";
import { ResendOtpDto } from "./dto/resendOtp.dto";
import { PasswordResetRequestDto } from "./dto/passwordResetRequest.dto";
import { PasswordResetVerifyDto } from "./dto/passwordResetVerify.dto";
import { PasswordUpdateDto } from "./dto/passwordUpdate.dto";

import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { UserId } from "@common/decorators/userId.decorator";

import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS,
  BASE_COOKIE_OPTIONS,
} from "@common/constants/auth.constants";

import { AuthService } from "./auth.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiAcceptedResponse({
    description: "Verification email sent.",
  })
  @ApiBadRequestResponse({
    description: "Badly formatted parameter.",
  })
  @ApiConflictResponse({
    description: "User already exists.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Missing parameter in request.",
  })
  @UsePipes(new PostValidationPipe())
  @Post("register")
  @HttpCode(HttpStatus.ACCEPTED)
  async register(@Body() createUserDto: CreateUserDto) {
    await this.authService.register(createUserDto);

    return { message: "Verification email sent" };
  }

  @ApiOkResponse({
    description: "Email successfully verified.",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Email verified" },
      },
    },
  })
  @UsePipes(new PostValidationPipe())
  @Post("verify-email")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(200)
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.verifyEmail(verifyEmailDto);

    // Pair cookies: short AT + long RT; maxAge matches JWT TTLs in auth.constants.
    response.cookie(ACCESS_COOKIE_NAME, result.accessToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
    response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return { message: "Email verified" };
  }

  @ApiAcceptedResponse({
    description: "OTP resent.",
  })
  @UsePipes(new PostValidationPipe())
  @Post("resend-otp")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    await this.authService.resendOtp(resendOtpDto.email, resendOtpDto.purpose);

    return { message: "Verification email sent" };
  }

  @ApiOkResponse({
    description: "User successfully logged in.",
    type: String,
  })
  @UsePipes(new PostValidationPipe())
  @Post("login")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    const result = await this.authService.login(user);

    response.cookie(ACCESS_COOKIE_NAME, result.accessToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
    response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return { message: "Login successful" };
  }

  /**
   * Primary logout: bump tokenVersion so every JWT with the old `tv` fails validation.
   * Optional refreshJti blacklist is defense-in-depth when SessionGuard authenticated
   * via RT (see SessionGuard); omitting it when AT was used is fine — tv bump is enough.
   */
  @ApiOkResponse({
    description: "User successfully logged out.",
  })
  @ApiUnauthorizedResponse({
    description: "User is not authenticated or token is invalid.",
  })
  @UseGuards(SessionGuard)
  @HttpCode(200)
  @Post("logout")
  async logout(
    @UserId() userId: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(userId, request.refreshJti);

    const clearOptions = {
      ...BASE_COOKIE_OPTIONS,
      maxAge: 0,
      expires: new Date(0),
    };
    response.cookie(ACCESS_COOKIE_NAME, "", clearOptions);
    response.cookie(REFRESH_COOKIE_NAME, "", clearOptions);

    return { message: "Logout successful" };
  }

  /**
   * Strict refresh-token rotation (RTR): one successful use consumes the old RT JTI,
   * then issues a new AT+RT pair. Concurrent refreshes with the same RT: only one
   * wins consumeRefreshJti; the other gets 401 (client should single-flight refresh).
   *
   * `jti`, `iat`, `exp` on the payload come from jsonwebtoken (jwtid + registered claims).
   */
  @ApiOkResponse({
    description: "Token refreshed successfully.",
  })
  @ApiUnauthorizedResponse({
    description: "Refresh token is missing, invalid, or revoked.",
  })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Cookie-based RT only — body does not carry secrets (XSS can't read httpOnly).
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken || typeof refreshToken !== "string") {
      throw new UnauthorizedException("Refresh token missing");
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    response.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
    response.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return { message: "Token refreshed" };
  }

  @ApiOkResponse({
    description: "User is authenticated.",
  })
  @ApiUnauthorizedResponse({
    description: "User is not authenticated or token is invalid.",
  })
  @UseGuards(AccessTokenGuard)
  @Get("status")
  async getAuthStatus() {
    return { authenticated: true };
  }

  @ApiAcceptedResponse({
    description: "If the account exists, a reset OTP request is processed.",
  })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UsePipes(new PostValidationPipe())
  @Post("password-reset-request")
  @HttpCode(HttpStatus.ACCEPTED)
  async passwordResetRequest(
    @Body() passwordResetRequestDto: PasswordResetRequestDto,
  ) {
    await this.authService.passwordResetRequest(passwordResetRequestDto);

    return {
      message: "If the account exists, a password reset code will be sent",
    };
  }

  @ApiOkResponse({
    description: "OTP verified and reset token issued.",
  })
  @UsePipes(new PostValidationPipe())
  @Post("password-reset-verify")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async passwordResetVerify(
    @Body() passwordResetVerifyDto: PasswordResetVerifyDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const resetToken = await this.authService.passwordResetVerify(
      passwordResetVerifyDto,
    );

    response.cookie("resetToken", resetToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return { message: "Verification successful" };
  }

  @ApiOkResponse({
    description: "Password updated successfully.",
  })
  @ApiUnauthorizedResponse({
    description: "Reset token is missing, invalid, or expired.",
  })
  @UseGuards(ResetTokenGuard)
  @UsePipes(new PostValidationPipe())
  @Patch("password-update")
  @HttpCode(HttpStatus.OK)
  async passwordUpdate(
    @UserId() userId: string,
    @Body() passwordUpdateDto: PasswordUpdateDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.passwordUpdate(
      userId,
      passwordUpdateDto.newPassword,
    );

    // remove resetToken cookie after successful password update
    response.cookie("resetToken", "", {
      ...BASE_COOKIE_OPTIONS,
      maxAge: 0,
      expires: new Date(0),
    });

    return { message: "Password updated successfully" };
  }
}

import {
  Body,
  Controller,
  Post,
  Res,
  Get,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { Response, CookieOptions } from "express";

import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { ResetTokenGuard } from "@common/guards/resetToken.guard";

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
import { EditUserDto } from "./dto/editUser.dto";
import { VerifyEmailDto } from "./dto/verifyEmail.dto";
import { ResendOtpDto } from "./dto/resendOtp.dto";
import { PasswordResetRequestDto } from "./dto/passwordResetRequest.dto";
import { PasswordResetVerifyDto } from "./dto/passwordResetVerify.dto";
import { PasswordUpdateDto } from "./dto/passwordUpdate.dto";

import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { UserId } from "@common/decorators/userId.decorator";

import { AuthService } from "./auth.service";

const COOKIE_NAME = "accessToken";
const DEFAULT_COOKIE_MAX_AGE = 48 * 60 * 60 * 1000;
const COOKIE_MAX_AGE = process.env.COOKIE_MAX_AGE
  ? parseInt(process.env.COOKIE_MAX_AGE, 10)
  : DEFAULT_COOKIE_MAX_AGE;

const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  domain:
    process.env.NODE_ENV === "production"
      ? process.env.COOKIE_DOMAIN
      : undefined,
};

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

    response.cookie(COOKIE_NAME, result.accessToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE,
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

    const cookieOptions = {
      ...BASE_COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE,
    };

    response.cookie(COOKIE_NAME, result.accessToken, cookieOptions);

    return { message: "Login successful" };
  }

  @ApiOkResponse({
    description: "User successfully logged out.",
  })
  @ApiUnauthorizedResponse({
    description: "User is not authenticated or token is invalid.",
  })
  @UseGuards(AccessTokenGuard)
  @HttpCode(200)
  @Post("logout")
  async logout(@Res({ passthrough: true }) response: Response) {
    response.cookie(COOKIE_NAME, "", {
      ...BASE_COOKIE_OPTIONS,
      maxAge: 0,
      expires: new Date(0),
    });

    return { message: "Logout successful" };
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

  @Patch("editUser")
  @UseGuards(AccessTokenGuard)
  @ApiOkResponse({ description: "User updated successfully." })
  async editUser(@UserId() userId: string, @Body() editUserDto: EditUserDto) {
    return await this.authService.editUser(userId, editUserDto);
  }
}

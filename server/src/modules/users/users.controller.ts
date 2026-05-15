import {
  Body,
  Controller,
  Req,
  Res,
  BadRequestException,
  UseInterceptors,
  UseGuards,
  Put,
  Post,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from "@nestjs/common";
import { UsePipes } from "@nestjs/common/decorators/core/use-pipes.decorator";
import type { Request, Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";

import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { CurrentUser } from "@common/decorators/currentUser.decorator";

import { user } from "@entities/user.entity";

import { UpdateProfileDto } from "./dto/updateProfile.dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOkResponse({ description: "Current user profile" })
  @ApiUnauthorizedResponse()
  @UseGuards(AccessTokenGuard)
  @Get("me")
  async getMe(@CurrentUser() user: user) {
    return this.usersService.getProfile(user);
  }

  @ApiOkResponse({ description: "Updated profile" })
  @ApiUnauthorizedResponse()
  @UseGuards(AccessTokenGuard)
  @UsePipes(new PostValidationPipe())
  @Patch("me")
  @HttpCode(HttpStatus.OK)
  async patchMe(@CurrentUser() user: user, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(user, body);
  }

  @ApiOkResponse({ description: "Account deleted" })
  @ApiUnauthorizedResponse()
  @UseGuards(AccessTokenGuard)
  @Delete("me")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@CurrentUser() user: user): Promise<void> {
    await this.usersService.deleteAccount(user);
  }

  @ApiOkResponse({
    description: "The CV has successfully uploaded",
    type: String,
  })
  @ApiBadRequestResponse({
    description:
      "Invalid request data in body (e.g., missing file or incorrect format)",
  })
  @UsePipes(new PostValidationPipe())
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
          cb(null, true);
        } else {
          cb(new BadRequestException("Only PDF files are accepted"), false);
        }
      },
    }),
  )
  @UseGuards(AccessTokenGuard)
  @Post("uploadCV")
  async uploadCV(@Req() req: Request, @Res() res: Response) {
    return this.usersService.uploadCV(req, res);
  }
}

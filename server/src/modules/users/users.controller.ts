import {
  Body,
  Controller,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Post,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from "@nestjs/common";
import { UsePipes } from "@nestjs/common/decorators/core/use-pipes.decorator";
import { Throttle } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { CurrentUser } from "@common/decorators/currentUser.decorator";

import { user } from "@entities/user.entity";

import { UpdateProfileDto } from "./dto/updateProfile.dto";
import { UploadedPdf, UsersService } from "./users.service";

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
  @ApiConflictResponse({
    description: "Phone number already in use by another account",
  })
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

  @ApiOperation({
    summary: "Upload a CV PDF and extract structured profile info",
  })
  @ApiOkResponse({
    description: "The CV has successfully uploaded",
    type: String,
  })
  @ApiBadRequestResponse({
    description:
      "Invalid request data in body (e.g., missing file or incorrect format)",
  })
  @ApiUnauthorizedResponse()
  @UsePipes(new PostValidationPipe())
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        // Browsers don't always report `application/pdf` — drag-and-drop and
        // some OSes send `application/octet-stream` or an empty type for a
        // perfectly valid PDF. Accept those and any `.pdf` name; the actual
        // PDF-ness is verified downstream when the service parses the buffer.
        const acceptedMimetypes = [
          "application/pdf",
          "application/octet-stream",
          "application/x-pdf",
          "",
        ];
        const hasPdfExtension = file.originalname
          ?.toLowerCase()
          .endsWith(".pdf");
        if (acceptedMimetypes.includes(file.mimetype) || hasPdfExtension) {
          cb(null, true);
        } else {
          cb(new BadRequestException("Only PDF files are accepted"), false);
        }
      },
    }),
  )
  @UseGuards(AccessTokenGuard)
  @Post("uploadCV")
  async uploadCV(
    @CurrentUser() user: user,
    @UploadedFile() file?: UploadedPdf,
  ): Promise<{ message: string }> {
    return this.usersService.uploadCV(user.user_id, file);
  }
}

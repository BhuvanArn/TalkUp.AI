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
} from "@nestjs/common";
import { UsePipes } from "@nestjs/common/decorators/core/use-pipes.decorator";
import type { Request, Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";


import {
  ApiTags,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from "@nestjs/swagger";

import { UpdatePasswordDto } from "./dto/updatePassword.dto";
import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOkResponse({
    description: "The password has successfully changed",
    type: String,
  })
  @ApiBadRequestResponse({
    description: "Invalid request data in body (UpdatePasswordDto)",
  })
  @ApiNotFoundResponse({
    description: "User with the provided email was not found",
  })
  @UsePipes(new PostValidationPipe())
  @Put("password")
  async updatePassword(@Body() body: UpdatePasswordDto) {
    return this.usersService.changeUserPassword(body.email, body.newPassword);
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
  // @UseGuards(AccessTokenGuard)
  @Post("uploadCV")
  async uploadCV(@Req() req: Request, @Res() res: Response) {
    return this.usersService.uploadCV(req, res);
  }
}

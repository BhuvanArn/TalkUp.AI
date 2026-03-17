import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { user } from "@entities/user.entity";

const PASSWORD_RESET_PURPOSE = "PASSWORD_RESET_AUTHORIZED";

@Injectable()
export class ResetTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(user)
    private readonly userRepository: Repository<user>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const token = req.cookies?.resetToken;

    if (!token || typeof token !== "string") {
      throw new UnauthorizedException(
        "Reset password token missing or malformed",
      );
    }

    let payload: Record<string, unknown>;

    try {
      payload = (await this.jwtService.verifyAsync(token)) as Record<
        string,
        unknown
      >;
    } catch {
      throw new UnauthorizedException("Invalid or expired reset token");
    }

    const purpose = payload.purpose;
    const userId =
      typeof payload.sub === "string"
        ? payload.sub
        : typeof payload.userId === "string"
          ? payload.userId
          : null;
    const tokenVersion =
      typeof payload.tv === "number"
        ? payload.tv
        : typeof payload.tv === "string"
          ? Number(payload.tv)
          : NaN;

    if (
      purpose !== PASSWORD_RESET_PURPOSE ||
      !userId ||
      Number.isNaN(tokenVersion)
    ) {
      throw new UnauthorizedException("Invalid reset token payload");
    }

    const foundUser = await this.userRepository.findOne({
      where: { user_id: userId },
    });

    if (!foundUser || (foundUser.tokenVersion ?? 1) !== tokenVersion) {
      throw new UnauthorizedException("Reset token is no longer valid");
    }

    req.userId = foundUser.user_id;

    return true;
  }
}

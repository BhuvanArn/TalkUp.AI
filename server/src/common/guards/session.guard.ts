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
import { ITokenStorage } from "@common/interfaces/token-storage";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_SECRET,
} from "@common/constants/auth.constants";

/**
 * Guard for POST /logout only (do not use AccessTokenGuard alone here).
 *
 * Used to authenticate the user for the POST /logout route.
 * Important to correctly identify the session when the user
 * reaches logout with a missing/expired AT but a still-valid refresh JWT.
 *
 * Order matters: we try the **access** cookie first. If it verifies, we never
 * read the refresh cookie — so `req.refreshJti` is **only set** when the user
 * reached logout with a **missing/expired AT** but a still-valid **refresh** JWT.
 * That is expected: tv bump already revokes all tokens; optional blacklist uses
 * refreshJti when we happened to authenticate via RT.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(user)
    private readonly userRepository: Repository<user>,
    private readonly tokenStorage: ITokenStorage,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // AT path: default case after login (valid short-lived cookie).
    const atResult = await this.tryAccessToken(req);
    if (atResult) return true;

    // RT path: idle past AT TTL — still identify session for logout + optional RT jti.
    const rtResult = await this.tryRefreshToken(req);
    if (rtResult) return true;

    throw new UnauthorizedException("No valid session");
  }

  private async tryAccessToken(req: Record<string, unknown>): Promise<boolean> {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const token = cookies?.[ACCESS_COOKIE_NAME];

    if (!token || typeof token !== "string") return false;

    let payload: Record<string, unknown>;
    try {
      payload = (await this.jwtService.verifyAsync(token)) as Record<
        string,
        unknown
      >;
    } catch {
      return false;
    }

    // Stateful session: JWT tv must match DB (password change / logout bumps tv).
    const userId = this.extractUserId(payload);
    const tv = this.extractTv(payload);
    if (!userId || Number.isNaN(tv)) return false;

    const foundUser = await this.userRepository.findOne({
      where: { user_id: userId },
    });
    if (!foundUser || (foundUser.tokenVersion ?? 1) !== tv) return false;

    req.userId = foundUser.user_id;
    req.user = foundUser;
    return true;
  }

  private async tryRefreshToken(
    req: Record<string, unknown>,
  ): Promise<boolean> {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const token = cookies?.[REFRESH_COOKIE_NAME];

    if (!token || typeof token !== "string") return false;

    let payload: Record<string, unknown>;
    try {
      // Must use refresh secret — prevents substituting an access JWT for refresh.
      payload = (await this.jwtService.verifyAsync(token, {
        secret: REFRESH_SECRET,
      })) as Record<string, unknown>;
    } catch {
      return false;
    }

    if (payload.typ !== "refresh") return false;

    const jti = payload.jti as string | undefined;
    const userId = this.extractUserId(payload);
    const tv = this.extractTv(payload);
    if (!jti || !userId || Number.isNaN(tv)) return false;

    if (await this.tokenStorage.isJtiBlacklisted(jti)) return false;

    const foundUser = await this.userRepository.findOne({
      where: { user_id: userId },
    });
    if (!foundUser || (foundUser.tokenVersion ?? 1) !== tv) return false;

    req.userId = foundUser.user_id;
    req.user = foundUser;
    req.refreshJti = jti;
    return true;
  }

  private extractUserId(payload: Record<string, unknown>): string | null {
    if (typeof payload.userId === "string") return payload.userId;
    if (typeof payload.sub === "string") return payload.sub;
    return null;
  }

  private extractTv(payload: Record<string, unknown>): number {
    if (typeof payload.tv === "number") return payload.tv;
    if (typeof payload.tv === "string") return Number(payload.tv);
    return NaN;
  }
}

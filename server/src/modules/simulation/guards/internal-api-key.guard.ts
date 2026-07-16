import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

/**
 * Protects STS ↔ NestJS internal routes (no user JWT).
 * Set SIM_INTERNAL_API_KEY on NestJS and the STS container.
 */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.SIM_INTERNAL_API_KEY?.trim();
    if (!expected) {
      throw new UnauthorizedException("Internal API is not configured.");
    }

    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.header("x-internal-api-key")?.trim();

    if (!provided || provided !== expected) {
      throw new UnauthorizedException("Invalid internal API key.");
    }

    return true;
  }
}

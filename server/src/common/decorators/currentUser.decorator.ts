import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { user } from "@entities/user.entity";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => getUserFromContext(ctx),
);

// exported for testability
export function getUserFromContext(ctx: ExecutionContext) {
  const req = ctx.switchToHttp().getRequest();
  return req.user as user | undefined;
}

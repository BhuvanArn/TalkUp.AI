import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export function userIdParamFactory(
  _data: unknown,
  ctx: ExecutionContext,
): string | undefined {
  return getUserIdFromContext(ctx);
}

export const UserId = createParamDecorator(userIdParamFactory);

// exported for testability
export function getUserIdFromContext(ctx: ExecutionContext) {
  const req = ctx.switchToHttp().getRequest();
  return req.userId as string | undefined;
}

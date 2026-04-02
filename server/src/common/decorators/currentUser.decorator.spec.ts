import { ExecutionContext } from "@nestjs/common";

import { user } from "@entities/user.entity";

import { getUserFromContext } from "./currentUser.decorator";

describe("getUserFromContext", () => {
  it("returns req.user when present", () => {
    const mockUser = { user_id: "u1" } as user;
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as ExecutionContext;

    expect(getUserFromContext(ctx)).toBe(mockUser);
  });

  it("returns undefined when req.user is missing", () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as ExecutionContext;

    expect(getUserFromContext(ctx)).toBeUndefined();
  });
});
